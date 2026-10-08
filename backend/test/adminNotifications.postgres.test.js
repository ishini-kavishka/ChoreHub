// Real HTTP/PostgreSQL integration tests. Every fixture belongs to newly created test accounts.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config({ quiet: true });
const { pool } = require('../src/config/db');
const app = require('../src/server');

test('Announcements, reminders and notifications persist, synchronize and enforce ownership', {
  skip: process.env.RUN_DATABASE_TESTS !== '1', timeout: 180000,
}, async () => {
  const accounts = [];
  let server;
  try {
    const tables = (await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1)",
      [['notifications', 'personal_reminders', 'household_announcements', 'notification_settings']])).rows;
    assert.equal(tables.length, 4, 'Use the existing PostgreSQL tables; do not substitute fake data.');
    const password = 'Isolated-notification-test';
    const hash = await bcrypt.hash(password, 4);
    const account = async role => {
      const row = (await pool.query('INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,email',
        ['Notification CRUD test', `notifications-${randomUUID()}@example.invalid`, hash, role])).rows[0];
      accounts.push(row.id); return row;
    };
    const admin = await account('admin'), member = await account('member'), outsider = await account('admin');
    const family = (await pool.query('INSERT INTO families(name,invite_code,created_by) VALUES($1,$2,$3) RETURNING id',
      ['Isolated notification test household', randomUUID(), admin.id])).rows[0].id;
    await pool.query("INSERT INTO family_members(family_id,user_id,role) VALUES($1,$2,'admin'),($1,$3,'member')", [family, admin.id, member.id]);
    await pool.query('INSERT INTO notification_settings(user_id,announcements) VALUES($1,TRUE),($2,TRUE)', [admin.id, member.id]);
    const chore = (await pool.query("INSERT INTO chores(family_id,created_by,assigned_to,title,status) VALUES($1,$2,$2,'Isolated reminder test chore','pending') RETURNING id", [family, admin.id])).rows[0].id;
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const base = 'http://127.0.0.1:' + server.address().port;
    const login = async email => {
      const r = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      assert.equal(r.status, 200); return (await r.json()).token;
    };
    const adminToken = await login(admin.email), memberToken = await login(member.email), outsiderToken = await login(outsider.email);
    const request = async (path, method = 'GET', body, token = adminToken, status = 200) => {
      const r = await fetch(base + '/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const value = await r.json(); assert.equal(r.status, status, `${method} ${path}: ${JSON.stringify(value)}`); return value;
    };
    const path = '/announcements?family_id=' + family;
    await request(path, 'GET', undefined, '', 401);
    await request(path, 'GET', undefined, outsiderToken, 403);
    await request(path, 'POST', { title: 'Unauthorized', message: 'Not allowed' }, memberToken, 403);
    await request(path, 'POST', { title: ' ', message: 'Invalid' }, adminToken, 400);
    await request(path, 'POST', { title: 'Title', message: 'x'.repeat(5001) }, adminToken, 400);
    const announcement = (await request(path, 'POST', { title: 'Draft test', message: 'Draft content', status: 'draft' }, adminToken, 201)).announcement;
    assert.equal((await request(path)).announcements[0].id, announcement.id);
    assert.equal((await request(path, 'GET', undefined, memberToken)).announcements.length, 0);
    await request('/announcements/' + announcement.id, 'GET', undefined, memberToken, 404);
    await request('/announcements/' + announcement.id, 'PATCH', { title: 'Unauthorized edit' }, memberToken, 403);
    await request('/announcements/' + announcement.id, 'DELETE', undefined, memberToken, 403);
    const published = (await request('/announcements/' + announcement.id, 'PATCH', { status: 'published' })).announcement;
    assert.ok(published.published_at);
    assert.equal((await request(path, 'GET', undefined, memberToken)).announcements[0].id, announcement.id);
    const notice = (await request('/notifications', 'GET', undefined, memberToken)).notifications.find(n => n.announcement_id === announcement.id);
    assert.ok(notice, 'A subscribed client receives the published real announcement.');
    await request('/notifications/' + notice.id + '/read', 'PATCH', undefined, memberToken);
    await request('/announcements/' + announcement.id, 'PATCH', { title: 'Updated test', message: 'Updated content', status: 'published' });
    const reread = (await request('/announcements/' + announcement.id)).announcement;
    assert.equal(reread.title, 'Updated test');
    const persisted = (await pool.query('SELECT title,message FROM household_announcements WHERE id=$1', [announcement.id])).rows[0];
    assert.deepEqual(persisted, { title: 'Updated test', message: 'Updated content' });
    const notices = (await request('/notifications', 'GET', undefined, memberToken)).notifications;
    assert.equal(notices.length, 1, 'Editing does not duplicate delivery.');
    assert.equal(notices[0].title, 'Updated test'); assert.equal(notices[0].message, 'Updated content'); assert.equal(notices[0].is_read, true);
    await request('/announcements/' + announcement.id, 'PATCH', { status: 'draft' }, adminToken, 409);
    await request('/announcements/' + announcement.id, 'DELETE');
    await request('/announcements/' + announcement.id, 'GET', undefined, adminToken, 404);
    assert.equal((await pool.query('SELECT id FROM household_announcements WHERE id=$1', [announcement.id])).rowCount, 0);
    assert.equal((await request('/notifications', 'GET', undefined, memberToken)).notifications.length, 0, 'Existing FK deletion removes linked client alerts.');

    const future = new Date(Date.now() + 86400000).toISOString();
    await request('/reminders', 'POST', { title: 'Invalid', chore_id: chore, remind_at: '2026-02-30T12:00:00Z' }, adminToken, 400);
    await request('/reminders', 'POST', { title: 'Invalid', chore_id: chore, remind_at: future }, memberToken, 403);
    const reminder = (await request('/reminders', 'POST', { title: 'Reminder test', note: 'Initial note', chore_id: chore, remind_at: future }, adminToken, 201)).reminder;
    assert.ok((await request('/reminders')).reminders.find(r => r.id === reminder.id));
    await request('/reminders/' + reminder.id, 'GET', undefined, memberToken, 404);
    await request('/reminders/' + reminder.id, 'PATCH', { title: 'Unauthorized' }, memberToken, 404);
    await request('/reminders/' + reminder.id, 'DELETE', undefined, memberToken, 404);
    await request('/reminders/' + reminder.id, 'PATCH', { title: 'Edited reminder', note: 'Persisted note', remind_at: future });
    assert.equal((await request('/reminders/' + reminder.id)).reminder.title, 'Edited reminder');
    assert.equal((await pool.query('SELECT note FROM personal_reminders WHERE id=$1', [reminder.id])).rows[0].note, 'Persisted note');
    await request('/reminders/' + reminder.id, 'DELETE');
    assert.equal((await pool.query('SELECT id FROM personal_reminders WHERE id=$1', [reminder.id])).rowCount, 0);
    await request('/reminders/' + reminder.id, 'GET', undefined, adminToken, 404);

    const personal = (await request('/notifications/reminders', 'POST', { title: 'Private notification', message: 'Test message' }, adminToken, 201)).notification;
    await request('/notifications/' + personal.id + '/read', 'PATCH', undefined, memberToken, 404);
    assert.equal((await request('/notifications?filter=unread')).notifications[0].id, personal.id);
    await request('/notifications/read-all', 'PATCH');
    assert.equal((await request('/notifications?filter=read')).notifications[0].id, personal.id);
    assert.equal((await request('/notifications/unread-count')).count, 0);
    await request('/notifications/' + personal.id, 'DELETE', undefined, memberToken, 404);
    await request('/notifications/' + personal.id, 'DELETE');
    await request('/notifications?filter=invalid', 'GET', undefined, adminToken, 400);
    console.log('Verified real schema, announcement/reminder CRUD, client synchronization, read state, validation and ownership.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    // Delete only the IDs inserted above. Household, chores, reminders and notices cascade.
    if (accounts.length) await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [accounts]);
    await pool.end();
  }
});

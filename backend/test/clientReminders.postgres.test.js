const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const path = require('node:path');
require('dotenv').config({ quiet: true });
const { pool, ensurePersonalReminderDeviceSchema } = require('../src/config/db');
const app = require('../src/server');

test('normal-member reminders persist through HTTP CRUD and reject another owner', {
  skip: process.env.RUN_DATABASE_TESTS !== '1', timeout: 180000,
}, async () => {
  const accounts = []; let server;
  try {
    await ensurePersonalReminderDeviceSchema();
    const password = 'Isolated-client-reminder-test';
    const hash = await bcrypt.hash(password, 4);
    const account = async role => {
      const row = (await pool.query('INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,email',
        ['Isolated client reminder test', `reminder-${randomUUID()}@example.invalid`, hash, role])).rows[0];
      accounts.push(row.id); return row;
    };
    const admin = await account('admin'), member = await account('member'), other = await account('member');
    const family = (await pool.query('INSERT INTO families(name,invite_code,created_by) VALUES($1,$2,$3) RETURNING id', ['Isolated reminder household', randomUUID(), admin.id])).rows[0].id;
    await pool.query("INSERT INTO family_members(family_id,user_id,role) VALUES($1,$2,'admin'),($1,$3,'member'),($1,$4,'member')", [family, admin.id, member.id, other.id]);
    const chore = async (owner, status = 'pending') => (await pool.query('INSERT INTO chores(family_id,created_by,assigned_to,title,status) VALUES($1,$2,$3,$4,$5) RETURNING id', [family, admin.id, owner, 'Own assigned test chore', status])).rows[0].id;
    const ownChore = await chore(member.id), foreignChore = await chore(other.id), completed = await chore(member.id, 'completed');
    const due = new Date();due.setDate(due.getDate()+2);due.setHours(20,0,0,0);
    await pool.query('UPDATE chores SET due_date=$1 WHERE id=$2',[due,ownChore]);
    const choreBefore=(await pool.query('SELECT * FROM chores WHERE id=$1',[ownChore])).rows[0];
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const login = async user => {
      const r = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password }) });
      assert.equal(r.status, 200); const value = await r.json(); return value.token;
    };
    let token = await login(member); const otherToken = await login(other);
    const request = async (path, method = 'GET', body, owner = token, expected = 200) => {
      const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(owner ? { Authorization: `Bearer ${owner}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const value = await r.json(); assert.equal(r.status, expected, `${method} ${path}: ${JSON.stringify(value)}`); return value;
    };
    assert.deepEqual((await request('/reminders/chores')).chores.map(c => c.id), [ownChore]);
    assert.equal(Date.parse((await request('/reminders/chores')).chores[0].due_date),due.getTime());
    await request('/reminders', 'GET', undefined, '', 401);
    const draft = { title: 'Get ready to clean the room', note: 'Take cleaning supplies', chore_id: ownChore, vibrate:true, remind_at: new Date(due.getTime()-10*60_000).toISOString() };
    await request('/reminders','POST',{...draft,vibrate:'yes'},token,400);
    for (const invalid of [{ title: ' ' }, { title: 'x'.repeat(201) }, { note: 'x'.repeat(2001) }, { remind_at: '2026-02-30T12:00:00Z' }, { remind_at: new Date(0).toISOString() }]) await request('/reminders', 'POST', { ...draft, ...invalid }, token, 400);
    for (const chore_id of [foreignChore, completed]) await request('/reminders', 'POST', { ...draft, chore_id }, token, 403);
    const standalone=(await request('/reminders','POST',{title:'Private standalone',note:'Owner only',sound:false,vibrate:true,remind_at:new Date(Date.now()+120000).toISOString()},token,201)).reminder;
    assert.equal(standalone.chore_id,null);assert.equal(standalone.sound,false);
    assert.equal((await request('/reminders/'+standalone.id)).reminder.status,'pending');
    const adminToken=await login(admin);
    for(const owner of [otherToken,adminToken])for(const method of ['GET','PATCH','DELETE'])await request('/reminders/'+standalone.id,method,method==='PATCH'?{note:'forbidden'}:undefined,owner,404);
    await request('/reminders/'+standalone.id,'PATCH',{sound:true,remind_at:new Date(Date.now()+180000).toISOString()});
    assert.equal((await request('/reminders/'+standalone.id)).reminder.sound,true);
    const delivery=require('../src/services/notificationDeliveryService');await delivery.ensureReminderDeliverySchema();
    assert.equal(await delivery.processDueReminders({userId:member.id,now:new Date(Date.now()+240000)}),1);
    const delivered=(await pool.query("SELECT user_id,message FROM notifications WHERE user_id=$1 AND type='personal_reminder'",[member.id])).rows;
    assert.ok(delivered.some(n=>n.message==='Owner only'));
    assert.equal((await pool.query("SELECT id FROM notifications WHERE user_id IN ($1,$2) AND message='Owner only'",[admin.id,other.id])).rowCount,0);
    await request('/reminders/'+standalone.id,'DELETE');
    const saved = (await request('/reminders', 'POST', { ...draft, userId: other.id }, token, 201)).reminder;
    assert.equal(saved.user_id, member.id, 'The authenticated identity overrides arbitrary userId.');
    assert.equal(saved.vibrate,true);
    assert.equal((await pool.query('SELECT title FROM personal_reminders WHERE id=$1', [saved.id])).rows[0].title, draft.title);
    assert.equal((await request('/reminders')).reminders[0].id, saved.id);
    assert.equal((await request(`/reminders/${saved.id}`)).reminder.chore_name, 'Own assigned test chore');
    assert.equal((await request('/reminders', 'GET', undefined, otherToken)).reminders.length, 0);
    for (const method of ['GET', 'PATCH', 'DELETE']) await request(`/reminders/${saved.id}`, method, method === 'PATCH' ? { title: 'Forbidden' } : undefined, otherToken, 404);
    const edit = { title: 'Take bins outside — edited', note: 'Updated persisted note', vibrate:false, remind_at: new Date(Date.now() + 172800000).toISOString() };
    await request(`/reminders/${saved.id}`, 'PATCH', edit);
    token = await login(member); // A new authenticated session proves this is not cached frontend state.
    const reread = (await request(`/reminders/${saved.id}`)).reminder;
    assert.equal(reread.title, edit.title); assert.equal(reread.note, edit.note); assert.equal(reread.remind_at, edit.remind_at);
    assert.equal(reread.vibrate,false);
    const row = (await pool.query('SELECT title,note,remind_at FROM personal_reminders WHERE id=$1', [saved.id])).rows[0];
    assert.equal(row.title, edit.title); assert.equal(row.note, edit.note); assert.equal(row.remind_at.toISOString(), edit.remind_at);
    await request(`/reminders/${saved.id}`, 'DELETE');
    token = await login(member);
    assert.equal((await request('/reminders')).reminders.length, 0);
    await request(`/reminders/${saved.id}`, 'GET', undefined, token, 404);
    assert.equal((await pool.query('SELECT id FROM personal_reminders WHERE id=$1', [saved.id])).rowCount, 0);
    // Render the existing normal-user component and exercise its real service against
    // this HTTP server with the member's login token, rather than mock persistence.
    await promisify(execFile)(process.execPath, ['--test', 'scripts/test-client-reminders.cjs'], {
      cwd: path.resolve(__dirname, '../../frontend'), timeout: 90000,
      env: { ...process.env, REAL_REMINDER_BASE: base.replace(/\/api$/, ''), REAL_REMINDER_TOKEN: token, REAL_REMINDER_CHORE: ownChore },
    });
    assert.equal((await pool.query('SELECT id FROM personal_reminders WHERE user_id=$1', [member.id])).rowCount, 0, 'Rendered client create/edit/delete left no reminder after refresh.');
    assert.deepEqual((await pool.query('SELECT * FROM chores WHERE id=$1',[ownChore])).rows[0],choreBefore,'Personal reminder CRUD never changes the Admin chore.');
    console.log('Normal member login, eligible chores, create/read/update/delete, fresh-session persistence and ownership verified against PostgreSQL.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (accounts.length) await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [accounts]);
    await pool.end();
  }
});

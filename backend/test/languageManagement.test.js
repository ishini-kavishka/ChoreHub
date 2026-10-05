const { test } = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config({ quiet: true });
const { pool } = require('../src/config/db');
const jwt = require('jsonwebtoken');
const app = require('../src/server');

test('Admin language management, client availability, and fallback', { skip: process.env.RUN_DATABASE_TESTS !== '1' }, async () => {
  const client = await pool.connect();
  const originalQuery = pool.query;
  let server;
  try {
    await client.query('BEGIN');
    pool.query = client.query.bind(client);

    // Get an admin user and non-admin member
    const adminRes = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    assert.ok(adminRes.rows.length, 'An admin account is required.');
    const adminId = adminRes.rows[0].id;

    const memberRes = await client.query("SELECT id FROM users WHERE role != 'admin' LIMIT 1");
    const memberId = memberRes.rows.length ? memberRes.rows[0].id : null;

    server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)); });
    const base = 'http://127.0.0.1:' + server.address().port;

    const adminToken = jwt.sign({ sub: adminId }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const memberToken = memberId ? jwt.sign({ sub: memberId }, process.env.JWT_SECRET, { expiresIn: '5m' }) : null;

    // 1. GET /api/settings/languages (authenticated)
    const listRes = await fetch(base + '/api/settings/languages', {
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(Array.isArray(listData.languages), 'languages should be an array');
    const codes = listData.languages.map(l => l.code);
    assert.ok(codes.includes('en'), 'contains en');
    assert.ok(codes.includes('si'), 'contains si');
    assert.ok(codes.includes('ta'), 'contains ta');

    // 2. PUT /api/settings/languages - Admin tries to disable 'en' (should fail)
    const disableEn = await fetch(base + '/api/settings/languages', {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + adminToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'en', is_enabled: false }),
    });
    assert.equal(disableEn.status, 400);

    // 3. PUT /api/settings/languages - Non-admin tries to toggle language (should be 403 Forbidden)
    if (memberToken) {
      const nonAdminPut = await fetch(base + '/api/settings/languages', {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + memberToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'ta', is_enabled: false }),
      });
      assert.equal(nonAdminPut.status, 403);
    }

    // 4. PUT /api/settings/languages - Admin disables 'ta'
    const disableTa = await fetch(base + '/api/settings/languages', {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + adminToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'ta', is_enabled: false }),
    });
    assert.equal(disableTa.status, 200);
    const disableTaData = await disableTa.json();
    assert.equal(disableTaData.language.is_enabled, false);

    // 5. Client attempts to select disabled language 'ta' (should be 400)
    const selectTa = await fetch(base + '/api/settings/preferences', {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + (memberToken || adminToken), 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'ta' }),
    });
    assert.equal(selectTa.status, 400);

    // 6. Admin re-enables 'ta'
    const enableTa = await fetch(base + '/api/settings/languages', {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + adminToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'ta', is_enabled: true }),
    });
    assert.equal(enableTa.status, 200);

    // 7. Client selects 'ta' successfully
    const selectTaAgain = await fetch(base + '/api/settings/preferences', {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + (memberToken || adminToken), 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'ta' }),
    });
    assert.equal(selectTaAgain.status, 200);
    const prefData = await selectTaAgain.json();
    assert.equal(prefData.preferences.language, 'ta');

  } finally {
    await client.query('ROLLBACK');
    client.release();
    pool.query = originalQuery;
    if (server) await new Promise(resolve => server.close(resolve));
  }
});

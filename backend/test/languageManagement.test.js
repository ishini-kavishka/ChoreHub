const { test } = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config({ quiet: true });
const { pool, ensureSupportedLanguageSchema } = require('../src/config/db');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('node:crypto');
const app = require('../src/server');

test('Admin language management, client availability, and fallback', { skip: process.env.RUN_DATABASE_TESTS !== '1' }, async () => {
  const client = await pool.connect();
  const originalQuery = pool.query;
  let server;
  try {
    await client.query('BEGIN');
    pool.query = client.query.bind(client);
    const supported = require('../../shared/languages.json').filter(item=>item.translation_supported);
    const newlyBundled = supported.filter(item=>!['en','si','ta'].includes(item.code)).map(item=>item.code);
    // Simulate upgrading previously unsupported, untouched catalog seeds.
    await client.query(`UPDATE supported_languages SET is_enabled=FALSE,
      created_at='2000-01-01',updated_at='2000-01-01' WHERE code=ANY($1::text[])`,[newlyBundled]);
    await ensureSupportedLanguageSchema();
    assert.ok((await client.query('SELECT is_enabled FROM supported_languages WHERE code=ANY($1::text[])',[newlyBundled])).rows.every(row=>row.is_enabled));
    await client.query("UPDATE supported_languages SET is_enabled=FALSE,updated_at=CURRENT_TIMESTAMP WHERE code='ja'");
    await ensureSupportedLanguageSchema();
    assert.equal((await client.query("SELECT is_enabled FROM supported_languages WHERE code='ja'")).rows[0].is_enabled,false,'restart preserves an explicit Admin disable');
    // The user's live availability may already have languages disabled. Test setup is rolled back.
    for (const item of supported) await client.query(`INSERT INTO supported_languages
      (code,name,native_name,flag,is_enabled,sort_order) VALUES($1,$2,$3,$4,TRUE,$5)
      ON CONFLICT(code) DO UPDATE SET is_enabled=TRUE`,[item.code,item.name,item.native_name,item.flag,item.sort_order]);

    // Isolated accounts use the real login endpoint; existing user credentials are never changed.
    const password = 'Language-test-password';
    const passwordHash = await bcrypt.hash(password, 4);
    const account = async role => (await client.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email',
      ['Language test', `language-${randomUUID()}@example.invalid`, passwordHash, role])).rows[0];
    const admin = await account('admin');
    const member = await account('member');
    const memberId = member.id;

    server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)); });
    const base = 'http://127.0.0.1:' + server.address().port;

    const login = async email => {
      const response = await fetch(base + '/api/auth/login', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.ok(body.token);
      return body.token;
    };
    const adminToken = await login(admin.email);
    const memberToken = await login(member.email);

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

    const request = (path, method = 'GET', body, token = adminToken) => fetch(base + path, {
      method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    for (const {code} of supported) {
      for (const token of [memberToken,adminToken]) {
        const saved = await request('/api/settings/preferences','PUT',{language:code},token);
        assert.equal(saved.status,200,code+' saves for Member and Admin');
        assert.equal((await saved.json()).preferences.language,code);
        // Fresh JWT/login + GET simulates restoring after restarting the app.
        const restored = await request('/api/settings/preferences','GET',undefined,
          await login(token===memberToken?member.email:admin.email));
        assert.equal((await restored.json()).preferences.language,code);
      }
    }
    await request('/api/settings/preferences','PUT',{language:'ta'});
    const publicList = await fetch(base + '/api/settings/languages');
    assert.equal(publicList.status, 200);
    assert.ok((await publicList.json()).languages.filter(l => supported.some(item=>item.code===l.code)).every(l => l.translation_supported));
    const record = { code: 'zz', name: 'Test locale', native_name: 'Test locale' };
    assert.ok(memberToken, 'A normal member account is required for authorization coverage.');
    for (const code of ['en', 'si', 'ta']) {
      const saved = await request('/api/settings/preferences', 'PUT', { language: code }, memberToken);
      assert.equal(saved.status, 200);
      const restored = await request('/api/settings/preferences', 'GET', undefined, memberToken);
      assert.equal((await restored.json()).preferences.language, code);
      const persisted = await client.query('SELECT language FROM user_preferences WHERE user_id = $1', [memberId]);
      assert.equal(persisted.rows[0].language, code);
    }
    if (memberToken) assert.equal((await request('/api/settings/languages', 'POST', record, memberToken)).status, 403);
    const added = await request('/api/settings/languages', 'POST', record);
    assert.equal(added.status, 201);
    assert.deepEqual(((await added.json()).language), {
      code: 'zz', name: 'Test locale', native_name: 'Test locale', flag: '🌐',
      is_enabled: false, sort_order: 100, translation_supported: false,
    });
    assert.equal((await request('/api/settings/languages', 'PUT', { code: 'zz', is_enabled: true })).status, 400);
    assert.equal((await request('/api/settings/languages', 'POST', record)).status, 409);
    assert.equal((await request('/api/settings/preferences', 'PUT', { language: 'zz' })).status, 400);
    await request('/api/settings/languages', 'PUT', { code: 'ta', is_enabled: false });
    const fallback = await request('/api/settings/preferences', 'GET', undefined, memberToken || adminToken);
    assert.equal((await fallback.json()).preferences.language, 'en');
    const refreshed = (await (await request('/api/settings/languages')).json()).languages;
    assert.equal(refreshed.find(l => l.code === 'ta').is_enabled, false);
    await client.query('UPDATE user_preferences SET language = $1 WHERE user_id = $2', ['invalid', memberId]);
    const invalid = await request('/api/settings/preferences', 'GET', undefined, memberToken);
    assert.equal((await invalid.json()).preferences.language, 'en');

  } finally {
    await client.query('ROLLBACK');
    client.release();
    pool.query = originalQuery;
    if (server) await new Promise(resolve => server.close(resolve));
    await pool.end();
  }
});

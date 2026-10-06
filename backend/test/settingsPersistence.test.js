// Opt-in integration test against the configured PostgreSQL database.
// Every preference change and schema addition is rolled back.
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config({ quiet: true });
const { pool } = require('../src/config/db');
const controller = require('../src/controllers/settingsController');
const jwt = require('jsonwebtoken');
const app = require('../src/server');

test('Settings round-trip, member compatibility, and partial preferences', { skip: process.env.RUN_DATABASE_TESTS !== '1' }, async () => {
  const client = await pool.connect();
  const originalQuery = pool.query;
  let server;
  try {
    await client.query('BEGIN');
    // Round trips require an available language. Live Admin availability is
    // deliberately restored by the transaction rollback below.
    await client.query("UPDATE supported_languages SET is_enabled=TRUE WHERE code IN ('en','si','ta')");
    await client.query(`ALTER TABLE notification_settings
      ADD COLUMN IF NOT EXISTS due_date_alerts BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS weekly_summary BOOLEAN NOT NULL DEFAULT TRUE`);
    const { rows } = await client.query('SELECT id FROM users LIMIT 1');
    assert.ok(rows.length, 'An existing user is required; no accounts are created.');
    const userId = rows[0].id;
    pool.query = client.query.bind(client);
    server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)); });
    const authToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const routes = new Map([
      [controller.getNotificationSettings, ['GET', 'notifications']],
      [controller.updateNotificationSettings, ['PUT', 'notifications']],
      [controller.getPreferences, ['GET', 'preferences']],
      [controller.updatePreferences, ['PUT', 'preferences']],
    ]);
    const base = 'http://127.0.0.1:' + server.address().port;
    const unauthorized = await fetch(base + '/api/settings/notifications');
    assert.equal(unauthorized.status, 401);
    const call = async (handler, body = {}) => {
      const [method, path] = routes.get(handler);
      const response = await fetch(base + '/api/settings/' + path, {
        method, headers: { Authorization: 'Bearer ' + authToken, 'Content-Type': 'application/json' },
        ...(method === 'PUT' ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, data: await response.json() };
    };
    const options = { chore_reminders: false, due_date_alerts: false, weekly_summary: true, chore_completions: true, family_updates: false, announcements: false, reminder_time: '30min' };
    assert.equal((await call(controller.updateNotificationSettings, options)).status, 200);
    let loaded = (await call(controller.getNotificationSettings)).data.settings;
    for (const [key, value] of Object.entries(options)) assert.equal(loaded[key], value);
    const { due_date_alerts, weekly_summary, ...memberOptions } = options;
    await call(controller.updateNotificationSettings, { ...memberOptions, chore_reminders: true });
    loaded = (await call(controller.getNotificationSettings)).data.settings;
    assert.equal(loaded.due_date_alerts, false); assert.equal(loaded.weekly_summary, true);
    assert.equal(loaded.chore_reminders, true);
    assert.equal((await call(controller.updateNotificationSettings, { ...options, weekly_summary: 'false' })).status, 400);
    await call(controller.updatePreferences, { theme: 'dark', language: 'ta', brightness: 85, auto_brightness: true });
    await call(controller.updatePreferences, { theme: 'system' });
    const prefs = (await call(controller.getPreferences)).data.preferences;
    assert.equal(prefs.theme, 'system'); assert.equal(prefs.language, 'ta');
    assert.equal(prefs.brightness, 85); assert.equal(prefs.auto_brightness, true);
    assert.equal((await call(controller.updatePreferences, { theme: '' })).status, 400);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    pool.query = originalQuery;
    await client.query('ROLLBACK'); client.release(); await pool.end();
  }
});

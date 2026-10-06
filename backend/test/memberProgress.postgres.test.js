// Opt-in: real HTTP routes and PostgreSQL, with all test chores rolled back.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config({ quiet: true });
const { pool } = require('../src/config/db');

test('Household assignment and member completion across ranges', {
  skip: process.env.RUN_DATABASE_TESTS !== '1',
}, async () => {
  const client = await pool.connect();
  const originalQuery = pool.query;
  let server;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT fm.family_id, fm.user_id, u.full_name
      FROM family_members fm JOIN users u ON u.id = fm.user_id
      WHERE fm.role = 'admin' AND u.role = 'admin'
        AND (SELECT COUNT(*) FROM family_members other WHERE other.user_id = u.id) = 1
      LIMIT 1`);
    assert.ok(rows.length, 'An existing single-household admin is required.');
    const admin = rows[0];
    pool.query = client.query.bind(client);
    const app = express();
    app.use(express.json());
    app.use('/api/chores', require('../src/routes/choreRoutes'));
    app.use('/api/admin/component04', require('../src/routes/adminComponent04Routes'));
    app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ message: error.message }));
    server = await new Promise(resolve => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const headers = { Authorization: `Bearer ${jwt.sign({ sub: admin.user_id }, process.env.JWT_SECRET, { expiresIn: '5m' })}`, 'Content-Type': 'application/json' };
    const call = (path, method = 'GET', body) => fetch(base + path, {
      method, headers, ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const progress = async range => {
      const response = await call(`/api/admin/component04/progress?family_id=${admin.family_id}&range=${range}`);
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.categories.reduce((sum, c) => sum + c.count, 0), data.summary.total);
      assert.equal(data.summary.completed, data.chores.filter(c => c.bucket === 'completed').length);
      return data;
    };
    const baseline = await progress('today');
    const before = baseline.members.find(m => m.id === admin.user_id);
    const ids = [];
    for (let i = 0; i < 4; i++) {
      const response = await call('/api/chores', 'POST', { title: 'Member progress regression fixture', assigned_to: admin.user_id });
      assert.equal(response.status, 201);
      ids.push((await response.json()).chore.id);
    }
    for (const id of ids.slice(0, 2)) {
      assert.equal((await call(`/api/chores/${id}/complete`, 'PATCH')).status, 200);
    }
    let data = await progress('today');
    let member = data.members.find(m => m.id === admin.user_id);
    assert.equal(member.total, before.total + 4);
    assert.equal(member.completed, before.completed + 2);
    assert.equal(member.percentage, Math.round(member.completed / member.total * 100));
    assert.equal((await call(`/api/chores/${ids[2]}/complete`, 'PATCH')).status, 200);
    const other = baseline.members.find(m => m.id !== admin.user_id);
    assert.ok(other, 'A second existing household member is required.');
    // Different real database counts for a second real member, rolled back below.
    await client.query(`INSERT INTO chores (family_id, created_by, assigned_to, title, status)
      VALUES ($1, $2, $3, 'Member progress second-person fixture', 'completed'),
             ($1, $2, $3, 'Member progress second-person fixture', 'pending')`,
    [admin.family_id, admin.user_id, other.id]);
    for (const range of ['today', 'week', 'month']) {
      data = await progress(range);
      member = data.members.find(m => m.id === admin.user_id);
      assert.ok(member.completed >= before.completed + 3);
      assert.equal(member.percentage, Math.round(member.completed / member.total * 100));
      const db = await client.query(`SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
        FROM chores WHERE family_id = $1 AND assigned_to = $2
        AND COALESCE(due_date, created_at) >= date_trunc($3, CURRENT_TIMESTAMP)
        AND COALESCE(due_date, created_at) < date_trunc($3, CURRENT_TIMESTAMP) + ('1 ' || $3)::interval`,
      [admin.family_id, admin.user_id, range === 'today' ? 'day' : range]);
      assert.equal(member.total, db.rows[0].total);
      assert.equal(member.completed, db.rows[0].completed);
      const second = data.members.find(m => m.id === other.id);
      if (range === 'today') {
        assert.equal(second.total, other.total + 2);
        assert.equal(second.completed, other.completed + 1);
      }
      assert.equal(second.percentage, Math.round(second.completed / second.total * 100));
      console.log(JSON.stringify({ range, member: second.name, total: second.total, completed: second.completed, percentage: second.percentage }));
      console.log(JSON.stringify({ range, member: member.name, total: member.total, completed: member.completed, percentage: member.percentage }));
    }
    const outsiders = await client.query(`SELECT id FROM users WHERE id NOT IN
      (SELECT user_id FROM family_members WHERE family_id = $1) LIMIT 1`, [admin.family_id]);
    assert.ok(outsiders.rows.length, 'An existing outside user is required.');
    const assigned_to = outsiders.rows[0].id;
    assert.equal((await call('/api/chores', 'POST', { title: 'Invalid assignment', assigned_to })).status, 400);
    assert.equal((await call(`/api/chores/${ids[0]}`, 'PUT', { assigned_to })).status, 400);
    assert.equal((await call('/api/admin/component04/progress?family_id=00000000-0000-0000-0000-000000000000&range=month')).status, 403);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    pool.query = originalQuery;
    await client.query('ROLLBACK');
    client.release();
    await pool.end();
  }
});

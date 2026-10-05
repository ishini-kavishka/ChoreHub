const express = require('express');
const { pool } = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { getCompletedChores } = require('../controllers/progressController');
const router = express.Router();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.use(requireAuth, requireAdmin);
router.get('/context', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT f.id, f.name FROM families f
      JOIN family_members fm ON fm.family_id = f.id
      WHERE fm.user_id = $1 AND fm.role = 'admin' ORDER BY fm.joined_at, f.id`, [req.userId]);
    if (!result.rows.length) return res.status(403).json({ message: 'Household admin membership is required.' });
    res.json({ households: result.rows });
  } catch (error) { next(error); }
});

router.use(async (req, res, next) => {
  try {
    if (typeof req.query.family_id !== 'string' || !uuid.test(req.query.family_id)) return res.status(400).json({ message: 'A valid household is required.' });
    const result = await pool.query(`SELECT f.id, f.name FROM families f
      JOIN family_members fm ON fm.family_id = f.id
      WHERE f.id = $1 AND fm.user_id = $2 AND fm.role = 'admin'`, [req.query.family_id, req.userId]);
    if (!result.rows.length) return res.status(403).json({ message: 'Household admin membership is required.' });
    req.adminFamily = result.rows[0];
    next();
  } catch (error) { next(error); }
});

router.get('/progress', async (req, res, next) => {
  try {
    const { range = 'week' } = req.query;
    if (!['today', 'week', 'month'].includes(range)) return res.status(400).json({ message: 'Invalid progress range.' });
    // One statement/snapshot and one bounded date predicate feed every section and drill-down.
    // Database timezone; due date (creation date for unscheduled chores); calendar periods.
    const unit = range === 'today' ? 'day' : range;
    const result = await pool.query(`WITH bounds AS (
      SELECT date_trunc($2, CURRENT_TIMESTAMP) AS start_at,
        date_trunc($2, CURRENT_TIMESTAMP) + ('1 ' || $2)::interval AS end_at
    ), scoped AS (
      SELECT c.id, c.title, c.category, c.assigned_to, c.status, c.due_date,
        CASE WHEN c.status = 'completed' THEN 'completed'
          WHEN c.due_date < CURRENT_TIMESTAMP THEN 'overdue' ELSE 'pending' END AS bucket
      FROM chores c, bounds b WHERE c.family_id = $1
        AND COALESCE(c.due_date, c.created_at) >= b.start_at
        AND COALESCE(c.due_date, c.created_at) < b.end_at
    ) SELECT
      (SELECT COALESCE(json_agg(s ORDER BY s.due_date NULLS LAST, s.id), '[]') FROM scoped s) AS chores,
      (SELECT COALESCE(json_agg(m ORDER BY m.name), '[]') FROM (
        SELECT u.id, u.full_name AS name, u.profile_image_url AS avatar
        FROM family_members fm JOIN users u ON u.id = fm.user_id WHERE fm.family_id = $1
      ) m) AS members`, [req.adminFamily.id, unit]);
    const { chores, members } = result.rows[0];
    const total = chores.length;
    const count = (bucket) => chores.filter(c => c.bucket === bucket).length;
    const completed = count('completed');
    const categories = new Map();
    chores.forEach(c => categories.set(c.category || 'General', (categories.get(c.category || 'General') || 0) + 1));
    res.json({ household: req.adminFamily, range,
      summary: { total, completed, pending: count('pending'), overdue: count('overdue'), percentage: total ? Math.round(completed / total * 100) : 0 },
      members: members.map(m => { const assigned = chores.filter(c => c.assigned_to === m.id); const done = assigned.filter(c => c.bucket === 'completed').length;
        return { ...m, total: assigned.length, completed: done, percentage: assigned.length ? Math.round(done / assigned.length * 100) : 0 }; }),
      categories: Array.from(categories, ([name, count]) => ({ name, count })), chores });
  } catch (error) { next(error); }
});

router.get('/completed', getCompletedChores);
router.patch('/household', async (req, res, next) => {
  try {
    const { name } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) return res.status(400).json({ message: 'Household name must contain 1–100 characters.' });
    const result = await pool.query(`UPDATE families f SET name = $1 WHERE f.id = $2
      AND EXISTS (SELECT 1 FROM family_members fm WHERE fm.family_id = f.id AND fm.user_id = $3 AND fm.role = 'admin') RETURNING f.id, f.name`, [name.trim(), req.adminFamily.id, req.userId]);
    if (!result.rows.length) return res.status(403).json({ message: 'Household admin membership is required.' });
    res.json({ household: result.rows[0] });
  } catch (error) { next(error); }
});
module.exports = router;

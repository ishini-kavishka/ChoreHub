const router = require('express').Router();
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');
const { uuid, fail, text, schedule } = require('../utils/component04Validation');
router.use(requireAuth);
const eligible = `c.assigned_to = $1 AND c.status = 'pending' AND
  (c.family_id IS NULL OR EXISTS (SELECT 1 FROM family_members fm WHERE fm.user_id = $1 AND fm.family_id = c.family_id))`;
const read = `SELECT r.*, c.title AS chore_name,
  CASE WHEN c.id IS NULL OR c.assigned_to <> r.user_id OR c.assigned_to IS NULL OR c.status <> 'pending'
    OR (c.family_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM family_members fm WHERE fm.user_id = r.user_id AND fm.family_id = c.family_id))
    THEN 'unavailable' WHEN r.remind_at <= now() THEN 'past' ELSE 'pending' END AS status
  FROM personal_reminders r LEFT JOIN chores c ON c.id = r.chore_id`;
router.get('/chores', async (req, res, next) => {
  try { res.json({ chores: (await pool.query(`SELECT c.id, c.title FROM chores c WHERE ${eligible} ORDER BY c.title`, [req.userId])).rows }); }
  catch (e) { next(e); }
});
router.get('/', async (req, res, next) => {
  try { res.json({ reminders: (await pool.query(`${read} WHERE r.user_id = $1 ORDER BY r.remind_at`, [req.userId])).rows }); }
  catch (e) { next(e); }
});
router.get('/:id', async (req, res, next) => {
  try {
    uuid(req.params.id);
    const row = (await pool.query(`${read} WHERE r.user_id = $1 AND r.id = $2`, [req.userId, req.params.id])).rows[0];
    if (!row) throw fail('Reminder not found.', 404);
    res.json({ reminder: row });
  } catch (e) { next(e); }
});
router.post('/', async (req, res, next) => {
  try {
    const b = req.body || {}; uuid(b.chore_id);
    const title = text(b.title, 'Title', 200), note = text(b.note === undefined ? '' : b.note, 'Note', 2000, true), time = schedule(b.remind_at);
    // A single statement locks the eligible chore while validating assignment and inserting.
    const result = await pool.query(`WITH authorized AS (SELECT c.id FROM chores c WHERE ${eligible} AND c.id = $2 FOR UPDATE)
      INSERT INTO personal_reminders(user_id, chore_id, title, note, remind_at)
      SELECT $1, id, $3, $4, $5 FROM authorized RETURNING *`, [req.userId, b.chore_id, title, note, time]);
    if (!result.rowCount) throw fail('Choose a pending chore assigned to you.', 403);
    res.status(201).json({ reminder: result.rows[0] });
  } catch (e) { next(e); }
});
router.patch('/:id', async (req, res, next) => {
  let client;
  try {
    uuid(req.params.id); client = await pool.connect(); await client.query('BEGIN');
    const row = (await client.query('SELECT * FROM personal_reminders WHERE id = $1 AND user_id = $2 FOR UPDATE', [req.params.id, req.userId])).rows[0];
    if (!row) throw fail('Reminder not found.', 404);
    if (new Date(row.remind_at) <= new Date()) throw fail('Only pending reminders can be edited.', 409);
    const chore = await client.query(`SELECT c.id FROM chores c WHERE ${eligible} AND c.id = $2 FOR UPDATE`, [req.userId, row.chore_id]);
    if (!chore.rowCount) throw fail('This chore is completed, deleted or no longer assigned to you.', 409);
    const b = req.body || {};
    const result = await client.query(`UPDATE personal_reminders SET title=$3, note=$4, remind_at=$5, updated_at=now()
      WHERE id=$1 AND user_id=$2 RETURNING *`, [row.id, req.userId, text(b.title === undefined ? row.title : b.title, 'Title', 200), text(b.note === undefined ? row.note : b.note, 'Note', 2000, true), schedule(b.remind_at === undefined ? new Date(row.remind_at).toISOString() : b.remind_at)]);
    await client.query('COMMIT'); res.json({ reminder: result.rows[0] });
  } catch (e) { if (client) await client.query('ROLLBACK'); next(e); } finally { if (client) client.release(); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    uuid(req.params.id);
    const result = await pool.query('DELETE FROM personal_reminders WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.userId]);
    if (!result.rowCount) throw fail('Reminder not found.', 404);
    // No delivery jobs exist; deleting the saved schedule removes all pending reminder state.
    res.json({ id: req.params.id });
  } catch (e) { next(e); }
});
module.exports = router;

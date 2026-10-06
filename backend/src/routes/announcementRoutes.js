const router = require('express').Router();
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');
const { fail, uuid, text } = require('../utils/component04Validation');
router.use(requireAuth);
async function membership(db, userId, familyId, mutate = false) {
  const rows = (await db.query(`SELECT fm.family_id, fm.role, u.role AS account_role FROM family_members fm
    JOIN users u ON u.id=fm.user_id WHERE fm.user_id=$1 AND fm.family_id=$2 FOR SHARE OF fm, u`, [userId, familyId])).rows;
  const row = rows[0];
  if (!row || (mutate && (row.role !== 'admin' || row.account_role !== 'admin'))) throw fail('Household access denied.', 403);
  return row.role === 'admin' && row.account_role === 'admin';
}
function state(value) { if (!['draft', 'published'].includes(value)) throw fail('Choose Draft or Published.'); return value; }
async function publish(db, row) {
  await db.query(`INSERT INTO notifications(user_id, title, message, type, announcement_id)
    SELECT fm.user_id, $2, $3, 'announcement', $1 FROM family_members fm
    JOIN notification_settings ns ON ns.user_id=fm.user_id AND ns.announcements=TRUE
    WHERE fm.family_id=$4 ON CONFLICT (announcement_id, user_id) WHERE announcement_id IS NOT NULL DO NOTHING`, [row.id, row.title, row.message, row.family_id]);
}
router.get('/', async (req, res, next) => {
  try {
    // Selected household is only a selector; membership and role are resolved server-side.
    const family = uuid(req.query.family_id), admin = await membership(pool, req.userId, family);
    res.json({ can_manage: admin, announcements: (await pool.query(`SELECT a.* FROM household_announcements a
      JOIN family_members fm ON fm.family_id=a.family_id JOIN users u ON u.id=fm.user_id
      WHERE a.family_id=$1 AND fm.user_id=$2 AND (a.status='published' OR (fm.role='admin' AND u.role='admin'))
      ${admin ? '' : "AND status='published'"} ORDER BY a.created_at DESC`, [family, req.userId])).rows });
  } catch (e) { next(e); }
});
router.get('/:id', async (req, res, next) => {
  try {
    uuid(req.params.id);
    const row = (await pool.query(`SELECT a.* FROM household_announcements a JOIN family_members fm ON fm.family_id=a.family_id
      JOIN users u ON u.id=fm.user_id WHERE a.id=$1 AND fm.user_id=$2 AND
      (a.status='published' OR (fm.role='admin' AND u.role='admin'))`, [req.params.id, req.userId])).rows[0];
    if (!row) throw fail('Announcement not found.', 404);
    res.json({ announcement: row });
  } catch (e) { next(e); }
});
// Transactions serialize edits/publication, so first publication notifies exactly once.
for (const method of ['post', 'patch', 'delete']) router[method](method === 'post' ? '/' : '/:id', async (req, res, next) => {
  let db;
  try {
    const b = req.body || {};
    if (method !== 'post') uuid(req.params.id);
    db = await pool.connect(); await db.query('BEGIN');
    let existing;
    if (method !== 'post') {
      existing = (await db.query('SELECT * FROM household_announcements WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
      if (!existing) throw fail('Announcement not found.', 404);
    }
    const family = existing?.family_id || uuid(req.query.family_id);
    await membership(db, req.userId, family, true);
    if (method === 'delete') {
      await db.query('DELETE FROM household_announcements WHERE id=$1', [existing.id]);
      await db.query('COMMIT'); return res.json({ id: existing.id });
    }
    const title = text(b.title === undefined ? existing?.title : b.title, 'Title', 200), message = text(b.message === undefined ? existing?.message : b.message, 'Message', 5000);
    const status = state(b.status === undefined ? existing?.status || 'draft' : b.status);
    // Publication is permanent; edits cannot reset publication and trigger duplicate alerts.
    if (existing?.published_at && status !== 'published') throw fail('Published announcements cannot return to draft.', 409);
    const first = status === 'published' && !existing?.published_at;
    const result = method === 'post'
      ? await db.query(`INSERT INTO household_announcements(family_id,created_by,title,message,status,published_at) VALUES($1,$2,$3,$4,$5,CASE WHEN $5='published' THEN now() END) RETURNING *`, [family, req.userId, title, message, status])
      : await db.query(`UPDATE household_announcements SET title=$2,message=$3,status=$4,published_at=CASE WHEN $4='published' THEN COALESCE(published_at,now()) ELSE NULL END,updated_at=now() WHERE id=$1 RETURNING *`, [existing.id, title, message, status]);
    if (first) await publish(db, result.rows[0]);
    await db.query('COMMIT'); res.status(method === 'post' ? 201 : 200).json({ announcement: result.rows[0] });
  } catch (e) { if (db) await db.query('ROLLBACK'); next(e); } finally { if (db) db.release(); }
});
module.exports = router;

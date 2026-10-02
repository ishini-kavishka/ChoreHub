const { pool } = require('../config/db');

/**
 * GET /api/progress/summary
 * Returns { total, completed, pending, percentage } for the user's family (week scope).
 */
async function getProgressSummary(req, res, next) {
  try {
    const userId = req.userId;

    // Get user's family
    const familyResult = await pool.query(
      'SELECT family_id FROM family_members WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    const familyId = familyResult.rows[0]?.family_id || null;

    let statsQuery;
    let queryParams;

    if (familyId) {
      statsQuery = `
        SELECT
          COUNT(*)::int AS total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending
        FROM chores
        WHERE family_id = $1
          AND created_at >= date_trunc('week', CURRENT_DATE)
      `;
      queryParams = [familyId];
    } else {
      statsQuery = `
        SELECT
          COUNT(*)::int AS total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending
        FROM chores
        WHERE (created_by = $1 OR assigned_to = $1)
          AND created_at >= date_trunc('week', CURRENT_DATE)
      `;
      queryParams = [userId];
    }

    const result = await pool.query(statsQuery, queryParams);
    const row = result.rows[0] || { total: 0, completed: 0, pending: 0 };

    const total = Number(row.total) || 0;
    const completed = Number(row.completed) || 0;
    const pending = Number(row.pending) || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.json({ total, completed, pending, percentage });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/progress/members
 * Returns per-member completion percentage for the user's family.
 */
async function getProgressMembers(req, res, next) {
  try {
    const userId = req.userId;

    const familyResult = await pool.query(
      'SELECT family_id FROM family_members WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    const familyId = familyResult.rows[0]?.family_id || null;

    let membersQuery;
    let queryParams;

    if (familyId) {
      membersQuery = `
        SELECT
          u.id,
          u.full_name AS name,
          u.profile_image_url AS avatar,
          COUNT(DISTINCT c.id)::int AS total,
          COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END)::int AS completed
        FROM family_members fm
        JOIN users u ON u.id = fm.user_id
        LEFT JOIN chores c ON c.assigned_to = u.id AND c.family_id = $1
          AND c.created_at >= date_trunc('week', CURRENT_DATE)
        WHERE fm.family_id = $1
        GROUP BY u.id, u.full_name, u.profile_image_url
        ORDER BY completed DESC, u.full_name ASC
      `;
      queryParams = [familyId];
    } else {
      // Solo user – return just themselves
      membersQuery = `
        SELECT
          u.id,
          u.full_name AS name,
          u.profile_image_url AS avatar,
          COUNT(c.id)::int AS total,
          COUNT(CASE WHEN c.status = 'completed' THEN 1 END)::int AS completed
        FROM users u
        LEFT JOIN chores c ON c.assigned_to = u.id
          AND c.created_at >= date_trunc('week', CURRENT_DATE)
        WHERE u.id = $1
        GROUP BY u.id, u.full_name, u.profile_image_url
      `;
      queryParams = [userId];
    }

    const result = await pool.query(membersQuery, queryParams);

    const members = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      total: Number(row.total) || 0,
      completed: Number(row.completed) || 0,
      percentage: Number(row.total) > 0
        ? Math.round((Number(row.completed) / Number(row.total)) * 100)
        : 0,
    }));

    return res.json({ members });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/chores/completed?range=all|today|week|month&q=<search>
 * Returns completed chores filtered by date range and search query.
 */
async function getCompletedChores(req, res, next) {
  try {
    const userId = req.userId;
    const { range = 'all', q = '' } = req.query;
    if (!['all', 'today', 'week', 'month'].includes(range) || typeof q !== 'string' || q.length > 100) return res.status(400).json({ message: 'Invalid completed chore filter.' });

    const familyResult = await pool.query(
      'SELECT family_id FROM family_members WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    const familyId = familyResult.rows[0]?.family_id || null;

    let dateFilter = '';
    if (range === 'today') {
      dateFilter = `AND COALESCE(c.completed_at, c.updated_at)::date = CURRENT_DATE`;
    } else if (range === 'week') {
      dateFilter = `AND COALESCE(c.completed_at, c.updated_at) >= date_trunc('week', CURRENT_DATE)`;
    } else if (range === 'month') {
      dateFilter = `AND COALESCE(c.completed_at, c.updated_at) >= date_trunc('month', CURRENT_DATE)`;
    }

    const searchFilter = q.trim() ? `AND c.title ILIKE $SEARCH_PARAM` : '';

    const baseWhere = familyId
      ? `(c.family_id = $1 OR c.assigned_to = $1 OR c.created_by = $1)`
      : `(c.assigned_to = $1 OR c.created_by = $1)`;

    const values = [familyId || userId];
    if (q.trim()) values.push(`%${q.trim()}%`);

    const query = `
      SELECT
        c.*,
        u_assignee.full_name AS assignee_name,
        u_assignee.profile_image_url AS assignee_avatar,
        u_creator.full_name AS creator_name
      FROM chores c
      LEFT JOIN users u_assignee ON c.assigned_to = u_assignee.id
      LEFT JOIN users u_creator ON c.created_by = u_creator.id
      WHERE ${baseWhere}
        AND c.status = 'completed'
        ${dateFilter}
        ${searchFilter.replace('$SEARCH_PARAM', `$${values.length}`)}
      ORDER BY COALESCE(c.completed_at, c.updated_at) DESC, c.created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query, values);
    return res.json({ chores: result.rows });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getProgressSummary, getProgressMembers, getCompletedChores };

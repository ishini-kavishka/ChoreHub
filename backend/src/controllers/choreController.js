const { pool } = require('../config/db');

const appError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

async function getUserFamilyId(userId) {
  const result = await pool.query(
    'SELECT family_id FROM family_members WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  return result.rows[0]?.family_id || null;
}

// Household progress only includes current household members.
async function validateAssignee(familyId, assigneeId) {
  if (!assigneeId) return;
  const userResult = await pool.query(
    'SELECT 1 FROM users WHERE id = $1 AND is_active IS DISTINCT FROM FALSE',
    [assigneeId]
  );
  if (!userResult.rows.length) throw appError('Assignee user not found or inactive.');

  if (familyId) {
    await pool.query(
      `INSERT INTO family_members (family_id, user_id, role, relationship)
       VALUES ($1, $2, 'member', 'Other')
       ON CONFLICT (family_id, user_id) DO NOTHING`,
      [familyId, assigneeId]
    );
  }
}

async function createChore(req, res, next) {
  try {
    const userId = req.userId;
    const {
      title,
      description,
      category = 'General',
      priority = 'medium',
      due_date,
      assigned_to,
      recurrence = 'none',
    } = req.body || {};

    if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) {
      throw appError('Chore title is required and must be 200 characters or fewer.');
    }

    const validPriorities = ['low', 'medium', 'high'];
    const selectedPriority = validPriorities.includes(priority) ? priority : 'medium';

    const validRecurrence = ['none', 'daily', 'weekly', 'monthly'];
    const selectedRecurrence = validRecurrence.includes(recurrence) ? recurrence : 'none';

    const familyId = await getUserFamilyId(userId);
    await validateAssignee(familyId, assigned_to);

    const query = `
      INSERT INTO chores (
        title, description, category, priority, due_date,
        assigned_to, created_by, family_id, recurrence, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *
    `;

    const values = [
      title.trim(),
      description ? description.trim() : null,
      category ? category.trim() : 'General',
      selectedPriority,
      due_date ? new Date(due_date) : null,
      assigned_to || null,
      userId,
      familyId,
      selectedRecurrence,
    ];

    const result = await pool.query(query, values);
    const chore = result.rows[0];

    // Create notification if assigned to another user
    if (assigned_to && assigned_to !== userId) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, chore_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          assigned_to,
          'New Chore Assigned',
          `You have been assigned to: "${chore.title}"`,
          'chore_assigned',
          chore.id,
        ]
      );
    }

    return res.status(201).json({ chore });
  } catch (error) {
    return next(error);
  }
}

async function getChores(req, res, next) {
  try {
    const userId = req.userId;
    const familyId = await getUserFamilyId(userId);
    const { today, status, assigned_to } = req.query;

    let query = `
      SELECT c.*, 
             u_assignee.full_name AS assignee_name, 
             u_assignee.profile_image_url AS assignee_avatar,
             u_creator.full_name AS creator_name
      FROM chores c
      LEFT JOIN users u_assignee ON c.assigned_to = u_assignee.id
      LEFT JOIN users u_creator ON c.created_by = u_creator.id
      WHERE (c.created_by = $1 OR c.assigned_to = $1 ${familyId ? 'OR c.family_id = $2' : ''})
    `;

    const values = familyId ? [userId, familyId] : [userId];
    let paramIndex = values.length + 1;

    if (status === 'pending' || status === 'completed') {
      query += ` AND c.status = $${paramIndex++}`;
      values.push(status);
    }

    if (assigned_to) {
      query += ` AND c.assigned_to = $${paramIndex++}`;
      values.push(assigned_to);
    }

    if (today === 'true') {
      query += ` AND (c.due_date IS NULL OR c.due_date::date <= CURRENT_DATE)`;
    }

    query += ` ORDER BY c.status ASC, c.due_date ASC NULLS LAST, c.created_at DESC`;

    const result = await pool.query(query, values);
    return res.json({ chores: result.rows });
  } catch (error) {
    return next(error);
  }
}

async function getChoreStats(req, res, next) {
  try {
    const userId = req.userId;
    const familyId = await getUserFamilyId(userId);

    const baseWhere = familyId
      ? `(created_by = $1 OR assigned_to = $1 OR family_id = $2)`
      : `(created_by = $1 OR assigned_to = $1)`;

    const queryParams = familyId ? [userId, familyId] : [userId];

    const statsQuery = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending,
        COUNT(CASE WHEN status = 'pending' AND due_date < NOW() THEN 1 END)::int AS overdue
      FROM chores
      WHERE ${baseWhere}
    `;

    const statsResult = await pool.query(statsQuery, queryParams);
    const row = statsResult.rows[0] || { total: 0, completed: 0, pending: 0, overdue: 0 };

    const total = Number(row.total) || 0;
    const completed = Number(row.completed) || 0;
    const pending = Number(row.pending) || 0;
    const overdue = Number(row.overdue) || 0;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Retrieve today's chores (up to 20)
    const todaysChoresQuery = `
      SELECT c.*, 
             u_assignee.full_name AS assignee_name, 
             u_assignee.profile_image_url AS assignee_avatar
      FROM chores c
      LEFT JOIN users u_assignee ON c.assigned_to = u_assignee.id
      WHERE ${baseWhere}
        AND (c.due_date IS NULL OR c.due_date::date <= CURRENT_DATE)
      ORDER BY c.status ASC, c.due_date ASC NULLS LAST, c.created_at DESC
      LIMIT 20
    `;

    const todaysChoresResult = await pool.query(todaysChoresQuery, queryParams);

    return res.json({
      stats: {
        completed,
        pending,
        overdue,
        total,
        completionPercentage,
      },
      todaysChores: todaysChoresResult.rows,
    });
  } catch (error) {
    return next(error);
  }
}

async function getChoreById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const familyId = await getUserFamilyId(userId);

    const query = `
      SELECT c.*, 
             u_assignee.full_name AS assignee_name, 
             u_assignee.profile_image_url AS assignee_avatar,
             u_creator.full_name AS creator_name
      FROM chores c
      LEFT JOIN users u_assignee ON c.assigned_to = u_assignee.id
      LEFT JOIN users u_creator ON c.created_by = u_creator.id
      WHERE c.id = $1 AND (c.created_by = $2 OR c.assigned_to = $2 ${familyId ? 'OR c.family_id = $3' : ''})
    `;

    const values = familyId ? [id, userId, familyId] : [id, userId];
    const result = await pool.query(query, values);

    if (!result.rows[0]) throw appError('Chore not found.', 404);
    return res.json({ chore: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

async function updateChore(req, res, next) {
  let db;
  try {
    db = await pool.connect();
    await db.query('BEGIN');
    const { id } = req.params;
    const userId = req.userId;
    const {
      title,
      description,
      category,
      priority,
      due_date,
      assigned_to,
      recurrence,
      status,
    } = req.body || {};

    const existing = await db.query('SELECT * FROM chores WHERE id = $1 FOR UPDATE', [id]);
    if (!existing.rows[0]) throw appError('Chore not found.', 404);

    const chore = existing.rows[0];
    // Assignees retain completion controls but cannot reassign/edit an admin's
    // chore to bypass private-request ownership or schedule approval.
    const { responsibleOwner } = require('../services/choreTimeRequestService');
    const canManage = chore.created_by === userId || await responsibleOwner(db, chore) === userId;
    const managementFields = ['title','description','category','priority','due_date','assigned_to','recurrence'];
    if (!canManage && (chore.assigned_to !== userId || managementFields.some(key => Object.prototype.hasOwnProperty.call(req.body || {}, key)))) {
      throw appError('Only the creator or responsible owner can edit this chore. Request a time change instead.', 403);
    }

    const updatedTitle = typeof title === 'string' && title.trim() ? title.trim() : chore.title;
    const updatedDesc = description !== undefined ? (description ? description.trim() : null) : chore.description;
    const updatedCat = category !== undefined ? category : chore.category;
    const updatedPriority = ['low', 'medium', 'high'].includes(priority) ? priority : chore.priority;
    const updatedDueDate = due_date !== undefined ? (due_date ? new Date(due_date) : null) : chore.due_date;
    const updatedAssigned = assigned_to !== undefined ? (assigned_to || null) : chore.assigned_to;
    if (updatedAssigned !== chore.assigned_to) {
      await validateAssignee(chore.family_id, updatedAssigned);
    }
    const updatedRecurrence = ['none', 'daily', 'weekly', 'monthly'].includes(recurrence) ? recurrence : chore.recurrence;
    const updatedStatus = ['pending', 'completed'].includes(status) ? status : chore.status;

    let completedAt = chore.completed_at;
    let completedBy = chore.completed_by;
    if (updatedStatus === 'completed' && chore.status !== 'completed') {
      completedAt = new Date();
      completedBy = req.userId;
    } else if (updatedStatus === 'pending') {
      completedAt = null;
      completedBy = null;
    }

    const query = `
      UPDATE chores SET
        title = $1,
        description = $2,
        category = $3,
        priority = $4,
        due_date = $5,
        assigned_to = $6,
        recurrence = $7,
        status = $8,
        completed_at = $9,
        completed_by = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;

    const result = await db.query(query, [
      updatedTitle,
      updatedDesc,
      updatedCat,
      updatedPriority,
      updatedDueDate,
      updatedAssigned,
      updatedRecurrence,
      updatedStatus,
      completedAt,
      completedBy,
      id,
    ]);

    const updatedChore = result.rows[0];

    // Notify assigned user when chore is newly assigned via edit
    if (updatedAssigned && updatedAssigned !== chore.assigned_to && updatedAssigned !== userId) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, chore_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          updatedAssigned,
          'New Chore Assigned',
          `You have been assigned to: "${updatedChore.title}"`,
          'chore_assigned',
          updatedChore.id,
        ]
      );
    }

    // Notify creator when chore is marked completed (if completer ≠ creator)
    if (updatedStatus === 'completed' && chore.status !== 'completed' && chore.created_by && chore.created_by !== userId) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         SELECT $1, $2, $3, $4
         WHERE COALESCE((SELECT chore_completions FROM notification_settings WHERE user_id=$1), TRUE)`,
        [
          chore.created_by,
          'Chore Completed',
          `"${updatedChore.title}" has been marked as completed`,
          'chore_completed',
        ]
      );
    }

    await db.query('COMMIT');
    return res.json({ chore: updatedChore });
  } catch (error) {
    if (db) await db.query('ROLLBACK');
    return next(error);
  } finally { db?.release(); }
}

async function toggleChoreComplete(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM chores WHERE id = $1', [id]);
    if (!existing.rows[0]) throw appError('Chore not found.', 404);

    const chore = existing.rows[0];
    const newStatus = chore.status === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date() : null;

    const result = await pool.query(
      `UPDATE chores SET
        status = $1,
        completed_at = $2,
        completed_by = $4,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [newStatus, completedAt, id, newStatus === 'completed' ? req.userId : null]
    );

    const updatedChore = result.rows[0];

    // Notify the creator when a chore is marked completed (if completer ≠ creator)
    if (newStatus === 'completed' && updatedChore.created_by && updatedChore.created_by !== req.userId) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type)
         SELECT $1, $2, $3, $4
         WHERE COALESCE((SELECT chore_completions FROM notification_settings WHERE user_id=$1), TRUE)`,
        [
          updatedChore.created_by,
          'Chore Completed',
          `"${updatedChore.title}" has been marked as completed`,
          'chore_completed',
        ]
      ).catch(() => {});
    }

    return res.json({ chore: updatedChore });
  } catch (error) {
    return next(error);
  }
}

async function getMemberChores(req, res, next) {
  try {
    const userId = req.userId;

    // Stats: only chores assigned to this member
    const statsResult = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed,
         COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending,
         COUNT(CASE WHEN status = 'pending' AND due_date < NOW() THEN 1 END)::int AS overdue
       FROM chores
       WHERE assigned_to = $1`,
      [userId]
    );
    const row = statsResult.rows[0] || { total: 0, completed: 0, pending: 0, overdue: 0 };
    const total = Number(row.total) || 0;
    const completed = Number(row.completed) || 0;
    const pending = Number(row.pending) || 0;
    const overdue = Number(row.overdue) || 0;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // All chores assigned to this member
    const choresResult = await pool.query(
      `SELECT c.*,
              u_creator.full_name AS creator_name
       FROM chores c
       LEFT JOIN users u_creator ON c.created_by = u_creator.id
       WHERE c.assigned_to = $1
       ORDER BY c.status ASC, c.due_date ASC NULLS LAST, c.created_at DESC`,
      [userId]
    );

    return res.json({
      stats: { completed, pending, overdue, total, completionPercentage },
      chores: choresResult.rows,
    });
  } catch (error) {
    return next(error);
  }
}

async function getAdminChoreStats(req, res, next) {
  try {
    const userId = req.userId;
    const familyId = await getUserFamilyId(userId);

    const baseWhere = familyId
      ? `(family_id = $1 OR family_id IS NULL OR 1=1)`
      : `1=1`;

    const queryParams = familyId ? [familyId] : [];

    const statsQuery = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending,
        COUNT(CASE WHEN status = 'pending' AND due_date < NOW() THEN 1 END)::int AS overdue
      FROM chores
      WHERE ${baseWhere}
    `;

    const statsResult = await pool.query(statsQuery, queryParams);
    const row = statsResult.rows[0] || { total: 0, completed: 0, pending: 0, overdue: 0 };

    const total = Number(row.total) || 0;
    const completed = Number(row.completed) || 0;
    const pending = Number(row.pending) || 0;
    const overdue = Number(row.overdue) || 0;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const allChoresQuery = `
      SELECT c.*, 
             u_assignee.full_name AS assignee_name, 
             u_assignee.profile_image_url AS assignee_avatar,
             u_creator.full_name AS creator_name
      FROM chores c
      LEFT JOIN users u_assignee ON c.assigned_to = u_assignee.id
      LEFT JOIN users u_creator ON c.created_by = u_creator.id
      WHERE ${baseWhere}
      ORDER BY c.status ASC, c.due_date ASC NULLS LAST, c.created_at DESC
    `;

    const allChoresResult = await pool.query(allChoresQuery, queryParams);

    return res.json({
      stats: {
        completed,
        pending,
        overdue,
        total,
        completionPercentage,
      },
      chores: allChoresResult.rows,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteChore(req, res, next) {
  try {
    const { id } = req.params;
    const chore = (await pool.query('SELECT * FROM chores WHERE id=$1', [id])).rows[0];
    if (!chore) throw appError('Chore not found.', 404);
    const { responsibleOwner } = require('../services/choreTimeRequestService');
    if (chore.created_by !== req.userId && await responsibleOwner(pool, chore) !== req.userId) throw appError('Only the creator or responsible owner can delete this chore.', 403);
    const result = await pool.query('DELETE FROM chores WHERE id = $1 RETURNING id', [id]);
    if (!result.rows[0]) throw appError('Chore not found.', 404);
    return res.json({ message: 'Chore deleted successfully.', id });
  } catch (error) {
    return next(error);
  }
}

async function getAdminAllUsers(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         u.id,
         u.full_name AS name,
         u.email,
         u.profile_image_url AS avatar,
         u.role,
         u.phone,
         fm.role AS family_role,
         f.name AS family_name
       FROM users u
       LEFT JOIN family_members fm ON fm.user_id = u.id
       LEFT JOIN families f ON fm.family_id = f.id
       ORDER BY u.created_at ASC`
    );
    return res.json({ users: result.rows });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createChore,
  getChores,
  getChoreStats,
  getMemberChores,
  getAdminChoreStats,
  getAdminAllUsers,
  getChoreById,
  updateChore,
  toggleChoreComplete,
  deleteChore,
};


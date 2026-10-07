const { pool } = require('../config/db');

/**
 * GET /api/notifications?filter=all|unread|read
 */
async function getNotifications(req, res, next) {
  try {
    const userId = req.userId;
    const { filter = 'all' } = req.query;
    if (!['all', 'unread', 'read'].includes(filter)) return res.status(400).json({ message: 'Invalid notification filter.' });

    await require('../services/notificationDeliveryService').processDueReminders({ userId });
    let filterClause = '';
    if (filter === 'unread') filterClause = 'AND n.is_read = FALSE';
    else if (filter === 'read') filterClause = 'AND n.is_read = TRUE';

    const result = await pool.query(
      `SELECT n.*, c.title AS chore_title, c.due_date AS chore_due_date,
         (c.assigned_to=n.user_id AND c.status='pending' AND c.due_date IS NOT NULL) AS can_request_time,
         creator.full_name AS assigned_by, sender.full_name AS sender_name,
         CASE WHEN r.id IS NOT NULL THEN to_jsonb(r) || jsonb_build_object('can_review',r.recipient_id=$1,'chore_title',c.title,'current_due_date',c.due_date,'requester_name',requester.full_name,'recipient_name',recipient.full_name) ELSE NULL END AS time_request
       FROM notifications n
       LEFT JOIN chores c ON c.id=n.chore_id
       LEFT JOIN users creator ON creator.id=c.created_by
       LEFT JOIN users sender ON sender.id=n.sender_id
       LEFT JOIN chore_time_requests r ON r.id=n.time_request_id AND (r.requester_id=$1 OR r.recipient_id=$1)
       LEFT JOIN users requester ON requester.id=r.requester_id
       LEFT JOIN users recipient ON recipient.id=r.recipient_id
       WHERE n.user_id = $1 ${filterClause}
       ORDER BY n.created_at DESC
       LIMIT 100`,
      [userId]
    );
    return res.json({ notifications: result.rows });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/notifications/:id/read
 */
async function markNotificationRead(req, res, next) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Notification not found.' });
    return res.json({ message: 'Notification marked as read.', id });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/notifications/read-all
 */
async function markAllRead(req, res, next) {
  try {
    const userId = req.userId;
    const result = await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE RETURNING id`,
      [userId]
    );
    return res.json({
      message: 'All notifications marked as read.',
      count: result.rowCount,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/notifications/unread-count
 */
async function getUnreadCount(req, res, next) {
  try {
    const userId = req.userId;
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return res.json({ count: result.rows[0]?.count ?? 0 });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/notifications/:id
 */
async function deleteNotification(req, res, next) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const pending = await pool.query(`SELECT 1 FROM notifications n JOIN chore_time_requests r ON r.id=n.time_request_id
      WHERE n.id=$1 AND n.user_id=$2 AND r.recipient_id=$2 AND r.status='PENDING'`, [id,userId]);
    if (pending.rowCount) return res.status(409).json({ message: 'Review this pending request before clearing it.' });
    const result = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Notification not found.' });
    return res.json({ message: 'Notification deleted.', id });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/notifications/reminders
 * Creates a personal reminder for the authenticated user.
 */
async function createReminder(req, res, next) {
  try {
    const userId = req.userId;
    const { title, message, reminder_at } = req.body || {};

    if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) {
      return res.status(400).json({ message: 'Title is required and must be 200 characters or fewer.' });
    }
    if (typeof message !== 'string' || !message.trim() || message.trim().length > 1000) {
      return res.status(400).json({ message: 'Message is required and must be 1000 characters or fewer.' });
    }

    let parsedAt = null;
    if (reminder_at) {
      parsedAt = new Date(reminder_at);
      if (isNaN(parsedAt.getTime())) return res.status(400).json({ message: 'Invalid reminder_at date.' });
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, reminder_at)
       SELECT $1, $2, $3, 'personal_reminder', $4
       WHERE COALESCE((SELECT chore_reminders FROM notification_settings WHERE user_id=$1), TRUE)
       RETURNING *`,
      [userId, title.trim(), message.trim(), parsedAt]
    );
    if (!result.rowCount) return res.status(409).json({ message: 'Chore reminders are disabled for your account.' });
    return res.status(201).json({ notification: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/notifications/reminders/:id
 * Updates title, message, and/or reminder_at of the user's own personal reminder.
 */
async function updateReminder(req, res, next) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title, message, reminder_at } = req.body || {};

    if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) {
      return res.status(400).json({ message: 'Title is required and must be 200 characters or fewer.' });
    }
    if (typeof message !== 'string' || !message.trim() || message.trim().length > 1000) {
      return res.status(400).json({ message: 'Message is required and must be 1000 characters or fewer.' });
    }

    let parsedAt = null;
    if (reminder_at) {
      parsedAt = new Date(reminder_at);
      if (isNaN(parsedAt.getTime())) return res.status(400).json({ message: 'Invalid reminder_at date.' });
    }

    const result = await pool.query(
      `UPDATE notifications
       SET title = $1, message = $2, reminder_at = $3
       WHERE id = $4 AND user_id = $5 AND type = 'personal_reminder'
       RETURNING *`,
      [title.trim(), message.trim(), parsedAt, id, userId]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Reminder not found or not editable.' });
    return res.json({ notification: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

// A private inbox entry, never a chore mutation or approval request.
async function messageRecipient(db, chore, senderId) {
  // Prefer the assigning Admin. Exclude self before considering household owners.
  const creator = await db.query(`SELECT u.id FROM users u WHERE u.id=$1 AND u.role='admin' AND u.id<>$2
    AND EXISTS (SELECT 1 FROM family_members sender
      JOIN families f ON f.id=sender.family_id
      WHERE sender.user_id=$2 AND ($3::uuid IS NULL OR f.id=$3)
        AND (f.created_by=u.id OR EXISTS (
          SELECT 1 FROM family_members recipient WHERE recipient.family_id=f.id AND recipient.user_id=u.id)))`,
    [chore.created_by,senderId,chore.family_id]);
  if (creator.rowCount) return creator.rows[0].id;
  // Legacy Chores may have no family_id; use only the sender's real memberships.
  const owners = await db.query(`SELECT DISTINCT f.created_by AS id FROM families f
    JOIN family_members fm ON fm.family_id=f.id AND fm.user_id=$1
    JOIN users owner ON owner.id=f.created_by AND owner.role='admin'
    WHERE ($2::uuid IS NULL OR f.id=$2) AND f.created_by<>$1`, [senderId,chore.family_id]);
  if (owners.rowCount === 1) return owners.rows[0].id;
  if (owners.rowCount > 1) return null; // Never guess between unrelated households.
  const admins = await db.query(`SELECT DISTINCT u.id FROM family_members sender
    JOIN family_members admin ON admin.family_id=sender.family_id
    JOIN users u ON u.id=admin.user_id
    WHERE sender.user_id=$1 AND u.id<>$1 AND ($2::uuid IS NULL OR sender.family_id=$2)
      AND u.role='admin'`, [senderId,chore.family_id]);
  return admins.rowCount === 1 ? admins.rows[0].id : null;
}

async function createChoreMessage(req, res, next) {
  const { uuid, text, fail } = require('../utils/component04Validation');
  let db;
  try {
    const choreId = uuid(req.body?.chore_id);
    if (typeof req.body?.message === 'string' && req.body.message.length > 500) throw fail('Message must be 500 characters or fewer.');
    const message = text(req.body?.message, 'Message', 500);
    db = await pool.connect();
    await db.query('BEGIN');
    const chore = (await db.query('SELECT * FROM chores WHERE id=$1 FOR UPDATE', [choreId])).rows[0];
    if (!chore || chore.assigned_to !== req.userId) throw Object.assign(fail('This Chore is no longer assigned to you.', 404), {code:'CHORE_NOT_ASSIGNED'});
    if (chore.family_id && !(await db.query('SELECT 1 FROM family_members WHERE family_id=$1 AND user_id=$2', [chore.family_id,req.userId])).rowCount) throw Object.assign(fail('This Chore is no longer assigned to you.',404), {code:'CHORE_NOT_ASSIGNED'});
    const recipientId = await messageRecipient(db,chore,req.userId);
    if (!recipientId) throw Object.assign(fail('No separate Admin is available for this household.',409), {code:'ADMIN_UNAVAILABLE'});
    const result = await db.query(`INSERT INTO notifications(user_id,sender_id,chore_id,title,message,type)
      VALUES($1,$2,$3,'Client Message',$4,'client_chore_message') RETURNING id,created_at`, [recipientId,req.userId,chore.id,message]);
    await db.query('COMMIT');
    return res.status(201).json({message:'Message sent to Admin',notification:result.rows[0]});
  } catch(error) {
    if(db) await db.query('ROLLBACK').catch(()=>{});
    if (process.env.NODE_ENV !== 'production') console.warn('Chore message send failed', {
      endpoint:'/api/notifications/chore-messages',status:error.statusCode || 500,
      code:error.code || 'MESSAGE_SAVE_FAILED',
    });
    if (error.code==='ADMIN_UNAVAILABLE' || error.code==='CHORE_NOT_ASSIGNED') return res.status(error.statusCode).json({message:error.message,code:error.code});
    return next(error);
  } finally { if(db) db.release(); }
}

module.exports = {
  createChoreMessage,
  getNotifications,
  markNotificationRead,
  markAllRead,
  getUnreadCount,
  deleteNotification,
  createReminder,
  updateReminder,
};

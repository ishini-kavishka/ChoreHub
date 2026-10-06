const { pool } = require('../config/db');

/**
 * GET /api/notifications?filter=all|unread|read
 */
async function getNotifications(req, res, next) {
  try {
    const userId = req.userId;
    const { filter = 'all' } = req.query;
    if (!['all', 'unread', 'read'].includes(filter)) return res.status(400).json({ message: 'Invalid notification filter.' });

    let filterClause = '';
    if (filter === 'unread') filterClause = 'AND is_read = FALSE';
    else if (filter === 'read') filterClause = 'AND is_read = TRUE';

    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1 ${filterClause}
       ORDER BY created_at DESC
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
       VALUES ($1, $2, $3, 'personal_reminder', $4)
       RETURNING *`,
      [userId, title.trim(), message.trim(), parsedAt]
    );
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

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllRead,
  getUnreadCount,
  deleteNotification,
  createReminder,
  updateReminder,
};

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

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllRead,
  getUnreadCount,
};

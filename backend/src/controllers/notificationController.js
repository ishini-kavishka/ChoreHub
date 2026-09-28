const { pool } = require('../config/db');

async function getNotifications(req, res, next) {
  try {
    const userId = req.userId;
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );
    return res.json({ notifications: result.rows });
  } catch (error) {
    return next(error);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return res.json({ message: 'Notification marked as read.', id });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
};

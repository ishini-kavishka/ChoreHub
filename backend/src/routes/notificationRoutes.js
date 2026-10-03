const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markNotificationRead,
  markAllRead,
  getUnreadCount,
  deleteNotification,
  createReminder,
  updateReminder,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(requireAuth);

// ── Static / prefixed routes first (must come before /:id patterns) ──
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.post('/reminders', createReminder);
router.put('/reminders/:id', updateReminder);

// ── General list & per-id operations ──
router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

module.exports = router;

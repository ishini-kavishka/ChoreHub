const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markNotificationRead,
  markAllRead,
  getUnreadCount,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(requireAuth);

router.get('/', getNotifications);
// Keep static paths above /:id routes.
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markNotificationRead);

module.exports = router;

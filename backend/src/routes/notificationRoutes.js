const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { getNotifications, markNotificationRead } = require('../controllers/notificationController');

const router = express.Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);

module.exports = router;

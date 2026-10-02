const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getNotificationSettings,
  updateNotificationSettings,
  getPreferences,
  updatePreferences,
} = require('../controllers/settingsController');

const router = express.Router();

router.use(requireAuth);

router.get('/notifications', getNotificationSettings);
router.put('/notifications', updateNotificationSettings);

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

module.exports = router;

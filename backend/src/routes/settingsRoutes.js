const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const {
  getNotificationSettings,
  updateNotificationSettings,
  getPreferences,
  updatePreferences,
  getSupportedLanguages,
  updateSupportedLanguage,
} = require('../controllers/settingsController');

const router = express.Router();

router.use(requireAuth);

router.get('/notifications', getNotificationSettings);
router.put('/notifications', updateNotificationSettings);

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

router.get('/languages', getSupportedLanguages);
router.put('/languages', requireAdmin, updateSupportedLanguage);

module.exports = router;

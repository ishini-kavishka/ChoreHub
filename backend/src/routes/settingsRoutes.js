const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const {
  getNotificationSettings,
  updateNotificationSettings,
  getPreferences,
  updatePreferences,
  getSupportedLanguages,
  updateSupportedLanguage,
  addSupportedLanguage,
} = require('../controllers/settingsController');

const router = express.Router();

// Language availability contains no private user information and is needed before login.
router.get('/languages', getSupportedLanguages);
router.use(requireAuth);

router.get('/notifications', getNotificationSettings);
router.put('/notifications', updateNotificationSettings);

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

router.post('/languages', requireAdmin, addSupportedLanguage);
router.put('/languages', requireAdmin, updateSupportedLanguage);

module.exports = router;

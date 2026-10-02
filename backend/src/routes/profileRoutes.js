const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, changePassword, updateProfileImage, deleteProfile } = require('../controllers/profileController');

const router = express.Router();
router.use(requireAuth);
router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/change-password', changePassword);
router.put('/image', updateProfileImage);
router.delete('/', deleteProfile);

module.exports = router;

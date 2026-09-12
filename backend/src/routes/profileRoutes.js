const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, changePassword, updateProfileImage } = require('../controllers/profileController');

const router = express.Router();
router.use(requireAuth);
router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/change-password', changePassword);
router.put('/image', updateProfileImage);

module.exports = router;

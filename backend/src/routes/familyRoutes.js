const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const {
  createFamily,
  joinFamily,
  getMyFamily,
  searchUserByEmail,
  addFamilyMember,
} = require('../controllers/familyController');

const router = express.Router();

router.use(requireAuth);

router.post('/', requireAdmin, createFamily);
router.post('/join', joinFamily);
router.get('/my-family', getMyFamily);
router.get('/search-user', requireAdmin, searchUserByEmail);
router.post('/add-member', requireAdmin, addFamilyMember);

module.exports = router;

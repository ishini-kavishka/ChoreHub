const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  createFamily,
  joinFamily,
  getMyFamily,
  searchUserByEmail,
  addFamilyMember,
} = require('../controllers/familyController');

const router = express.Router();

router.use(requireAuth);

router.post('/', createFamily);
router.post('/join', joinFamily);
router.get('/my-family', getMyFamily);
router.get('/search-user', searchUserByEmail);
router.post('/add-member', addFamilyMember);

module.exports = router;

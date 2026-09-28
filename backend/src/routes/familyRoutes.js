const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { createFamily, joinFamily, getMyFamily } = require('../controllers/familyController');

const router = express.Router();

router.use(requireAuth);

router.post('/', createFamily);
router.post('/join', joinFamily);
router.get('/my-family', getMyFamily);

module.exports = router;

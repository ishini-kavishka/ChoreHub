const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  createChore,
  getChores,
  getChoreStats,
  getChoreById,
  updateChore,
  toggleChoreComplete,
  deleteChore,
} = require('../controllers/choreController');

const router = express.Router();

router.use(requireAuth);

router.post('/', createChore);
router.get('/', getChores);
router.get('/stats', getChoreStats);
router.get('/:id', getChoreById);
router.put('/:id', updateChore);
router.patch('/:id/complete', toggleChoreComplete);
router.delete('/:id', deleteChore);

module.exports = router;

const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const {
  createChore,
  getChores,
  getChoreStats,
  getMemberChores,
  getAdminChoreStats,
  getAdminAllUsers,
  getChoreById,
  updateChore,
  toggleChoreComplete,
  deleteChore,
} = require('../controllers/choreController');

const router = express.Router();

router.use(requireAuth);

router.get('/admin/stats', requireAdmin, getAdminChoreStats);
router.get('/admin/users', requireAdmin, getAdminAllUsers);
router.get('/my-chores', getMemberChores);

router.post('/', createChore);
router.get('/', getChores);
router.get('/stats', getChoreStats);
router.get('/:id', getChoreById);
router.put('/:id', updateChore);
router.patch('/:id/complete', toggleChoreComplete);
router.delete('/:id', deleteChore);

module.exports = router;


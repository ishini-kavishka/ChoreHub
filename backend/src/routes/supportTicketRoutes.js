const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const {
  getTickets,
  getUserTickets,
  createTicket,
  updateUserTicket,
  updateTicketStatus,
  deleteTicket,
} = require('../controllers/supportTicketController');

const router = express.Router();
router.use(requireAuth);
router.get('/my', getUserTickets);
router.get('/', requireAdmin, getTickets);
router.post('/', createTicket);
router.patch('/:id/status', requireAdmin, updateTicketStatus);
router.put('/:id', updateUserTicket);
router.delete('/:id', deleteTicket);

module.exports = router;
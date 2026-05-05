const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getServiceHistory,
} = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

// All booking routes are private (require authentication)
router.post('/', authMiddleware, createBooking);
router.get('/my', authMiddleware, getMyBookings);
router.put('/:id/cancel', authMiddleware, cancelBooking);
router.get('/history', authMiddleware, getServiceHistory);

module.exports = router;

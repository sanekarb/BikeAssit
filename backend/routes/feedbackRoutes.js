const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getEligibleBookings,
} = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');

// All feedback routes are private
// Static paths MUST come before parameterized paths
router.get('/eligible', authMiddleware, getEligibleBookings);
router.post('/:bookingId', authMiddleware, submitFeedback);

module.exports = router;

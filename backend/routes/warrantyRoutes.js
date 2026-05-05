const express = require('express');
const router = express.Router();
const {
  getWarranties,
  raiseClaim,
} = require('../controllers/warrantyController');
const authMiddleware = require('../middleware/authMiddleware');

// All warranty routes are private
router.get('/', authMiddleware, getWarranties);
router.post('/claim/:bookingId', authMiddleware, raiseClaim);

module.exports = router;

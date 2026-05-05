const express = require('express');
const router = express.Router();
const { getLoyaltyData } = require('../controllers/loyaltyController');
const authMiddleware = require('../middleware/authMiddleware');

// All loyalty routes are private
router.get('/', authMiddleware, getLoyaltyData);

module.exports = router;

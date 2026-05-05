const express = require('express');
const router = express.Router();
const {
  getUserBikes,
  addBike,
  updateBike,
  deleteBike,
} = require('../controllers/bikeController');
const authMiddleware = require('../middleware/authMiddleware');

// All bike routes are private (require authentication)
router.get('/', authMiddleware, getUserBikes);
router.post('/', authMiddleware, addBike);
router.put('/:id', authMiddleware, updateBike);
router.delete('/:id', authMiddleware, deleteBike);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  acceptBooking,
  rejectBooking,
  assignPickup,
  updateBookingStatus,
  getPendingBookings,
  getRejectedBookings,
  getCancelledBookings,
  getActiveBookings,
  getCompletedBookings,
  getDashboardStats,
  generateBill,
  updatePaymentStatus,
  getWarrantyClaims,
  acceptWarrantyClaim,
  rejectWarrantyClaim,
  updateClaimWorkflow,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Booking listings
router.get('/bookings/pending', getPendingBookings);
router.get('/bookings/rejected', getRejectedBookings);
router.get('/bookings/cancelled', getCancelledBookings);
router.get('/bookings/active', getActiveBookings);
router.get('/bookings/completed', getCompletedBookings);

// Booking actions
router.put('/bookings/:id/accept', acceptBooking);
router.put('/bookings/:id/reject', rejectBooking);
router.put('/bookings/:id/assign-pickup', assignPickup);
router.put('/bookings/:id/status', updateBookingStatus);
router.post('/bookings/:id/generate-bill', generateBill);
router.put('/bookings/:id/payment-status', updatePaymentStatus);

// Warranty claim management
router.get('/warranty-claims', getWarrantyClaims);
router.put('/warranty-claims/:id/accept', acceptWarrantyClaim);
router.put('/warranty-claims/:id/reject', rejectWarrantyClaim);
router.put('/warranty-claims/:id/workflow', updateClaimWorkflow);

module.exports = router;

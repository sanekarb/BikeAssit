const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Feedback = require('../models/Feedback');

const FEEDBACK_ELIGIBLE_STATUSES = [
  'Service Completed',
  'Ready For Delivery',
  'Delivered',
  'Completed',
];

// @desc    Submit feedback for a booking
// @route   POST /api/feedback/:bookingId
// @access  Private (User)
const submitFeedback = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, serviceQuality, pickupExperience, deliveryExperience, additionalComments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rating (1-5)',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Ensure the user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit feedback for this booking',
      });
    }

    // Business Rule #8: Feedback only for eligible statuses
    if (!FEEDBACK_ELIGIBLE_STATUSES.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Feedback can only be submitted when booking status is: ${FEEDBACK_ELIGIBLE_STATUSES.join(', ')}`,
        currentStatus: booking.status,
      });
    }

    // Check if feedback already submitted
    const existingFeedback = await Feedback.findOne({ booking: booking._id });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback has already been submitted for this booking',
      });
    }

    const feedback = await Feedback.create({
      booking: booking._id,
      user: req.user._id,
      rating,
      serviceQuality,
      pickupExperience,
      deliveryExperience,
      additionalComments,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message,
    });
  }
};

// @desc    Get bookings eligible for feedback (no feedback yet, eligible status)
// @route   GET /api/feedback/eligible
// @access  Private (User)
const getEligibleBookings = async (req, res) => {
  try {
    // Find user's bookings in eligible statuses
    const bookings = await Booking.find({
      user: req.user._id,
      status: { $in: FEEDBACK_ELIGIBLE_STATUSES },
    })
      .populate('bike', 'brand model registrationNumber')
      .sort({ createdAt: -1 });

    // Find bookings that already have feedback
    const feedbacks = await Feedback.find({ user: req.user._id });
    const feedbackBookingIds = feedbacks.map(f => f.booking.toString());

    // Filter out bookings that already have feedback
    const eligible = bookings.filter(
      b => !feedbackBookingIds.includes(b._id.toString())
    );

    res.status(200).json({
      success: true,
      count: eligible.length,
      bookings: eligible,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch eligible bookings',
      error: error.message,
    });
  }
};

module.exports = {
  submitFeedback,
  getEligibleBookings,
};

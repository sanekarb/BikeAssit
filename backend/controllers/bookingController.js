const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Bike = require('../models/Bike');
const generateBookingId = require('../utils/generateBookingId');

const CANCELLABLE_STATUSES = ['Pending', 'Accepted', 'Pickup Assigned'];

const CANCELLATION_REASONS = [
  'Booked By Mistake',
  'Change of Plan',
  'Found Another Service Provider',
  'Pickup Time Not Suitable',
  'Service No Longer Required',
  'Other',
];

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (User)
const createBooking = async (req, res) => {
  try {
    const { bikeId, pickupAddress, preferredPickupDate, preferredPickupTime, issueDescription } = req.body;

    // Validate required fields
    if (!bikeId || !pickupAddress || !preferredPickupDate || !preferredPickupTime || !issueDescription) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bikeId, pickupAddress, preferredPickupDate, preferredPickupTime, and issueDescription',
      });
    }

    // Validate bikeId format
    if (!mongoose.Types.ObjectId.isValid(bikeId)) {
      return res.status(404).json({
        success: false,
        message: 'Bike not found',
      });
    }

    // Validate bike exists and belongs to the user
    const bike = await Bike.findById(bikeId);
    if (!bike) {
      return res.status(404).json({
        success: false,
        message: 'Bike not found',
      });
    }

    if (bike.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This bike does not belong to you',
      });
    }

    // Generate unique booking ID
    const bookingId = await generateBookingId();

    // Create booking with bike snapshot (Business Rule #12)
    const booking = await Booking.create({
      bookingId,
      user: req.user._id,
      bike: bike._id,
      bikeSnapshot: {
        brand: bike.brand,
        model: bike.model,
        registrationNumber: bike.registrationNumber,
        manufacturingYear: bike.manufacturingYear,
      },
      pickupAddress,
      preferredPickupDate,
      preferredPickupTime,
      issueDescription,
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  }
};

// @desc    Get user's bookings (active/current)
// @route   GET /api/bookings/my
// @access  Private (User)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('bike', 'brand model registrationNumber manufacturingYear')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message,
    });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (User)
const cancelBooking = async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!cancellationReason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a cancellation reason',
      });
    }

    // Validate cancellation reason
    if (!CANCELLATION_REASONS.includes(cancellationReason)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cancellation reason',
        validReasons: CANCELLATION_REASONS,
      });
    }

    const booking = await Booking.findById(req.params.id);

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
        message: 'Not authorized to cancel this booking',
      });
    }

    // Check if booking can be cancelled (Business Rule #1)
    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be cancelled. Cancellation is only allowed when status is: ${CANCELLABLE_STATUSES.join(', ')}`,
        currentStatus: booking.status,
      });
    }

    booking.status = 'Cancelled';
    booking.cancellationReason = cancellationReason;
    booking.cancelledBy = 'user';

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
};

// @desc    Get service history (completed + cancelled bookings)
// @route   GET /api/bookings/history
// @access  Private (User)
const getServiceHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
      status: { $in: ['Completed', 'Cancelled', 'Rejected'] },
    })
      .populate('bike', 'brand model registrationNumber manufacturingYear')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service history',
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  getServiceHistory,
};

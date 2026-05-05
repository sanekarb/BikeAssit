const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const WarrantyClaim = require('../models/WarrantyClaim');

// @desc    Get warranty records for current user (active, claimed, expired)
// @route   GET /api/warranty
// @access  Private (User)
const getWarranties = async (req, res) => {
  try {
    const now = new Date();

    // Find all bookings where warranty was activated
    const bookings = await Booking.find({
      user: req.user._id,
      warrantyActivated: true,
    }).sort({ deliveredAt: -1 });

    // Find all warranty claims for this user
    const claims = await WarrantyClaim.find({ user: req.user._id });
    const claimedBookingIds = claims.map(c => c.booking.toString());

    const active = [];
    const claimed = [];
    const expired = [];

    for (const booking of bookings) {
      const hasClaim = claimedBookingIds.includes(booking._id.toString());
      const claim = hasClaim
        ? claims.find(c => c.booking.toString() === booking._id.toString())
        : null;

      const record = {
        bookingId: booking.bookingId,
        bookingObjectId: booking._id,
        bikeSnapshot: booking.bikeSnapshot,
        deliveredAt: booking.deliveredAt,
        warrantyExpiry: booking.warrantyExpiry,
        remainingDays: Math.max(0, Math.ceil((booking.warrantyExpiry - now) / (1000 * 60 * 60 * 24))),
      };

      if (hasClaim) {
        // Claimed: WarrantyClaim exists for this booking (regardless of claim status)
        claimed.push({
          ...record,
          claim: {
            _id: claim._id,
            status: claim.status,
            claimDescription: claim.claimDescription,
            rejectionReason: claim.rejectionReason,
            claimWorkflowStatus: claim.claimWorkflowStatus,
            pickupPerson: claim.pickupPerson,
            createdAt: claim.createdAt,
          },
        });
      } else if (booking.warrantyExpiry > now) {
        // Active: warrantyActivated=true AND warrantyExpiry > now AND no claim raised
        active.push(record);
      } else {
        // Expired: warrantyExpiry < now
        expired.push(record);
      }
    }

    res.status(200).json({
      success: true,
      active,
      claimed,
      expired,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warranty records',
      error: error.message,
    });
  }
};

// @desc    Raise a warranty claim
// @route   POST /api/warranty/claim/:bookingId
// @access  Private (User)
const raiseClaim = async (req, res) => {
  try {
    const { claimDescription } = req.body;
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!claimDescription) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a claim description',
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
        message: 'Not authorized to raise claim for this booking',
      });
    }

    // Check warranty is activated
    if (!booking.warrantyActivated) {
      return res.status(400).json({
        success: false,
        message: 'Warranty has not been activated for this booking',
      });
    }

    // Check warranty hasn't expired
    if (booking.warrantyExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Warranty period has expired for this booking',
      });
    }

    // Business Rule #5: 1 warranty claim per booking
    const existingClaim = await WarrantyClaim.findOne({ booking: booking._id });
    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: 'A warranty claim has already been raised for this booking. Only one claim per booking is allowed.',
      });
    }

    const claim = await WarrantyClaim.create({
      booking: booking._id,
      user: req.user._id,
      claimDescription,
    });

    res.status(201).json({
      success: true,
      message: 'Warranty claim raised successfully',
      claim,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to raise warranty claim',
      error: error.message,
    });
  }
};

module.exports = {
  getWarranties,
  raiseClaim,
};

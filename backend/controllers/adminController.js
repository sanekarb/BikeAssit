const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const WarrantyClaim = require('../models/WarrantyClaim');
const { sendEmail, templates } = require('../services/emailService');
const { creditLoyaltyPoints } = require('./loyaltyController');

const REJECTION_REASONS = [
  'Outside Service Area',
  'Service Not Available',
  'Incomplete Information',
  'Invalid Request',
  'Other',
];

const WARRANTY_REJECTION_REASONS = [
  'Issue Not Covered Under Warranty',
  'Warranty Period Expired',
  'Physical Damage Found',
  'Terms & Conditions Violation',
  'Other',
];

// Valid status transitions for the generic status update endpoint
// Accept, Reject, Assign Pickup have their own dedicated endpoints
const VALID_TRANSITIONS = {
  'Pickup Assigned': 'Bike Picked Up',
  'Bike Picked Up': 'Service In Progress',
  'Service In Progress': 'Service Completed',
  'Service Completed': 'Ready For Delivery',
  'Ready For Delivery': 'Delivered',
  'Delivered': 'Completed',
};

// @desc    Accept a booking
// @route   PUT /api/admin/bookings/:id/accept
// @access  Admin
const acceptBooking = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = await Booking.findById(req.params.id).populate('user', 'email name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept booking. Current status is '${booking.status}', expected 'Pending'`,
      });
    }

    booking.status = 'Accepted';
    await booking.save();

    // Send email notification
    const pickupDate = new Date(booking.preferredPickupDate).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const emailData = templates.bookingAccepted({
      bookingId: booking.bookingId,
      bikeDetails: `${booking.bikeSnapshot.brand} ${booking.bikeSnapshot.model} (${booking.bikeSnapshot.registrationNumber})`,
      pickupDate,
      pickupTime: booking.preferredPickupTime,
    });

    await sendEmail({
      to: booking.user.email,
      subject: emailData.subject,
      html: emailData.html,
    });

    res.status(200).json({
      success: true,
      message: 'Booking accepted successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to accept booking',
      error: error.message,
    });
  }
};

// @desc    Reject a booking with reason
// @route   PUT /api/admin/bookings/:id/reject
// @access  Admin
const rejectBooking = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rejection reason',
      });
    }

    if (!REJECTION_REASONS.includes(rejectionReason)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rejection reason',
        validReasons: REJECTION_REASONS,
      });
    }

    const booking = await Booking.findById(req.params.id).populate('user', 'email name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject booking. Current status is '${booking.status}', expected 'Pending'`,
      });
    }

    booking.status = 'Rejected';
    booking.rejectionReason = rejectionReason;
    await booking.save();

    // Send email notification
    const emailData = templates.bookingRejected({
      bookingId: booking.bookingId,
      rejectionReason,
    });

    await sendEmail({
      to: booking.user.email,
      subject: emailData.subject,
      html: emailData.html,
    });

    res.status(200).json({
      success: true,
      message: 'Booking rejected',
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject booking',
      error: error.message,
    });
  }
};

// @desc    Assign pickup person to a booking
// @route   PUT /api/admin/bookings/:id/assign-pickup
// @access  Admin
const assignPickup = async (req, res) => {
  try {
    const { name, mobile, vehicleNumber } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!name || !mobile || !vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide pickup person name, mobile, and vehicle number',
      });
    }

    const booking = await Booking.findById(req.params.id).populate('user', 'email name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status !== 'Accepted') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign pickup. Current status is '${booking.status}', expected 'Accepted'`,
      });
    }

    booking.pickupPerson = { name, mobile, vehicleNumber };
    booking.status = 'Pickup Assigned';
    await booking.save();

    // Send email notification
    const emailData = templates.pickupAssigned({
      bookingId: booking.bookingId,
      pickupPerson: { name, mobile, vehicleNumber },
    });

    await sendEmail({
      to: booking.user.email,
      subject: emailData.subject,
      html: emailData.html,
    });

    res.status(200).json({
      success: true,
      message: 'Pickup person assigned successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to assign pickup person',
      error: error.message,
    });
  }
};

// @desc    Update booking status (generic status transition)
// @route   PUT /api/admin/bookings/:id/status
// @access  Admin
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the new status',
      });
    }

    const booking = await Booking.findById(req.params.id).populate('user', 'email name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Validate transition
    const expectedNext = VALID_TRANSITIONS[booking.status];
    if (!expectedNext) {
      return res.status(400).json({
        success: false,
        message: `Status '${booking.status}' cannot be updated via this endpoint. Use the dedicated accept/reject/assign-pickup endpoints.`,
      });
    }

    if (status !== expectedNext) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition. From '${booking.status}', the next valid status is '${expectedNext}'`,
      });
    }

    // Business Rule #11: Bill must be generated before moving to Ready For Delivery
    if (status === 'Ready For Delivery' && booking.paymentStatus === 'Not Generated') {
      return res.status(400).json({
        success: false,
        message: 'Cannot move to Ready For Delivery. Bill must be generated first.',
      });
    }

    // Set deliveredAt when marking as Delivered
    if (status === 'Delivered') {
      booking.deliveredAt = new Date();
    }

    // Update status
    booking.status = status;
    await booking.save();

    // Send status update email
    const emailData = templates.statusUpdated({
      bookingId: booking.bookingId,
      newStatus: status,
    });

    await sendEmail({
      to: booking.user.email,
      subject: emailData.subject,
      html: emailData.html,
    });

    // Phase 4: Loyalty points + warranty activation on 'Completed'
    if (status === 'Completed') {
      // Credit +100 loyalty points (Business Rule #9)
      if (!booking.loyaltyPointsCredited) {
        const loyalty = await creditLoyaltyPoints(booking.user._id, booking.bookingId);
        booking.loyaltyPointsCredited = true;
        await booking.save();

        // Send loyalty points email
        if (loyalty) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 90);
          const loyaltyEmail = templates.loyaltyPointsCredited({
            pointsAdded: 100,
            expiryDate: expiryDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
            availablePoints: loyalty.availablePoints,
          });
          await sendEmail({
            to: booking.user.email,
            subject: loyaltyEmail.subject,
            html: loyaltyEmail.html,
          });
        }
      }

      // Activate 7-day warranty (Business Rule #4)
      if (!booking.warrantyActivated && booking.deliveredAt) {
        const warrantyExpiry = new Date(booking.deliveredAt);
        warrantyExpiry.setDate(warrantyExpiry.getDate() + 7);

        booking.warrantyActivated = true;
        booking.warrantyExpiry = warrantyExpiry;
        await booking.save();

        // Send warranty activated email
        const warrantyEmail = templates.warrantyActivated({
          bookingId: booking.bookingId,
          warrantyStartDate: booking.deliveredAt.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
          warrantyEndDate: warrantyExpiry.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
        });
        await sendEmail({
          to: booking.user.email,
          subject: warrantyEmail.subject,
          html: warrantyEmail.html,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Booking status updated to '${status}'`,
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message,
    });
  }
};

// @desc    Get pending bookings
// @route   GET /api/admin/bookings/pending
// @access  Admin
const getPendingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'Pending' })
      .populate('user', 'name email mobile')
      .populate('bike', 'brand model registrationNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending bookings',
      error: error.message,
    });
  }
};

// @desc    Get rejected bookings (Business Rule #6: never deleted)
// @route   GET /api/admin/bookings/rejected
// @access  Admin
const getRejectedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'Rejected' })
      .populate('user', 'name email mobile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rejected bookings',
      error: error.message,
    });
  }
};

// @desc    Get cancelled bookings (Business Rule #7)
// @route   GET /api/admin/bookings/cancelled
// @access  Admin
const getCancelledBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'Cancelled' })
      .populate('user', 'name email mobile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cancelled bookings',
      error: error.message,
    });
  }
};

// @desc    Get active bookings (all statuses between Accepted and Delivered)
// @route   GET /api/admin/bookings/active
// @access  Admin
const getActiveBookings = async (req, res) => {
  try {
    const activeStatuses = [
      'Accepted', 'Pickup Assigned', 'Bike Picked Up',
      'Service In Progress', 'Service Completed',
      'Ready For Delivery', 'Delivered',
    ];

    const bookings = await Booking.find({ status: { $in: activeStatuses } })
      .populate('user', 'name email mobile')
      .populate('bike', 'brand model registrationNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active bookings',
      error: error.message,
    });
  }
};

// @desc    Get completed bookings
// @route   GET /api/admin/bookings/completed
// @access  Admin
const getCompletedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'Completed' })
      .populate('user', 'name email mobile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completed bookings',
      error: error.message,
    });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Admin
const getDashboardStats = async (req, res) => {
  try {
    const [totalBookings, completedBookings, cancelledBookings, earningsResult] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'Completed' }),
      Booking.countDocuments({ status: 'Cancelled' }),
      Booking.aggregate([
        {
          $match: {
            paymentStatus: { $in: ['Paid Online', 'Paid On Delivery'] },
          },
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$bill.totalAmount' },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalEarnings: earningsResult.length > 0 ? earningsResult[0].totalEarnings : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message,
    });
  }
};

// @desc    Generate bill for a booking
// @route   POST /api/admin/bookings/:id/generate-bill
// @access  Admin
const generateBill = async (req, res) => {
  try {
    const { serviceCost, partsCost, additionalCharges } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // serviceCost and partsCost are required, additionalCharges is optional
    if (serviceCost === undefined || serviceCost === null || partsCost === undefined || partsCost === null) {
      return res.status(400).json({
        success: false,
        message: 'Please provide serviceCost and partsCost',
      });
    }

    if (Number(serviceCost) < 0 || Number(partsCost) < 0 || (additionalCharges !== undefined && Number(additionalCharges) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cost values cannot be negative',
      });
    }

    const booking = await Booking.findById(req.params.id).populate('user', 'email name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Bill can only be generated when status is 'Service Completed'
    if (booking.status !== 'Service Completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot generate bill. Current status is '${booking.status}', expected 'Service Completed'`,
      });
    }

    // Check if bill was already generated
    if (booking.paymentStatus !== 'Not Generated') {
      return res.status(400).json({
        success: false,
        message: 'Bill has already been generated for this booking',
      });
    }

    const additional = Number(additionalCharges) || 0;
    const totalAmount = Number(serviceCost) + Number(partsCost) + additional;

    booking.bill = {
      serviceCost: Number(serviceCost),
      partsCost: Number(partsCost),
      additionalCharges: additional,
      totalAmount,
      generatedAt: new Date(),
    };
    booking.paymentStatus = 'Pending';

    await booking.save();

    // Send bill generated email
    const emailData = templates.billGenerated({
      bookingId: booking.bookingId,
      serviceCost: Number(serviceCost),
      partsCost: Number(partsCost),
      additionalCharges: additional,
      totalAmount,
    });

    await sendEmail({
      to: booking.user.email,
      subject: emailData.subject,
      html: emailData.html,
    });

    res.status(200).json({
      success: true,
      message: 'Bill generated successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate bill',
      error: error.message,
    });
  }
};

// @desc    Update payment status (admin marks as Paid On Delivery)
// @route   PUT /api/admin/bookings/:id/payment-status
// @access  Admin
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Please provide paymentStatus',
      });
    }

    // Only 'Paid On Delivery' can be set by admin
    // 'Paid Online' is set automatically via Razorpay verification
    if (paymentStatus !== 'Paid On Delivery') {
      return res.status(400).json({
        success: false,
        message: "Admin can only set payment status to 'Paid On Delivery'. Online payments are handled via Razorpay.",
      });
    }

    const booking = await Booking.findById(req.params.id).populate('user', 'email name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Business Rule #11: Bill must be generated before payment status can be updated
    if (booking.paymentStatus === 'Not Generated') {
      return res.status(400).json({
        success: false,
        message: 'Bill must be generated before updating payment status',
      });
    }

    // Don't allow changing if already paid
    if (booking.paymentStatus === 'Paid Online' || booking.paymentStatus === 'Paid On Delivery') {
      return res.status(400).json({
        success: false,
        message: `Payment has already been recorded as '${booking.paymentStatus}'`,
      });
    }

    booking.paymentStatus = 'Paid On Delivery';
    await booking.save();

    // Send payment received email
    const emailData = templates.paymentReceived({
      bookingId: booking.bookingId,
      amountPaid: booking.bill.totalAmount,
      paymentMethod: 'Cash On Delivery',
    });

    await sendEmail({
      to: booking.user.email,
      subject: emailData.subject,
      html: emailData.html,
    });

    res.status(200).json({
      success: true,
      message: 'Payment status updated to Paid On Delivery',
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message,
    });
  }
};

// ==========================================
// Warranty Claim Management (Admin)
// ==========================================

// @desc    Get all warranty claims
// @route   GET /api/admin/warranty-claims
// @access  Admin
const getWarrantyClaims = async (req, res) => {
  try {
    const claims = await WarrantyClaim.find()
      .populate('user', 'name email mobile')
      .populate({
        path: 'booking',
        select: 'bookingId bikeSnapshot deliveredAt warrantyExpiry',
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: claims.length,
      claims,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warranty claims',
      error: error.message,
    });
  }
};

// @desc    Accept warranty claim and assign pickup person
// @route   PUT /api/admin/warranty-claims/:id/accept
// @access  Admin
const acceptWarrantyClaim = async (req, res) => {
  try {
    const { name, mobile, vehicleNumber } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Warranty claim not found' });
    }

    const claim = await WarrantyClaim.findById(req.params.id)
      .populate({
        path: 'booking',
        select: 'bookingId',
      });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Warranty claim not found',
      });
    }

    if (claim.status !== 'Claim Under Review') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept claim. Current status is '${claim.status}', expected 'Claim Under Review'`,
      });
    }

    claim.status = 'Claim Accepted';

    // Assign pickup person if provided
    if (name && mobile && vehicleNumber) {
      claim.pickupPerson = { name, mobile, vehicleNumber };
      claim.claimWorkflowStatus = 'Pickup Assigned';
    }

    await claim.save();

    // Get user email for notification
    const claimWithUser = await WarrantyClaim.findById(claim._id).populate('user', 'email name');

    // Send warranty claim accepted email
    const emailData = templates.warrantyClaimAccepted({
      claimId: claim._id,
      pickupPerson: claim.pickupPerson || null,
    });

    await sendEmail({
      to: claimWithUser.user.email,
      subject: emailData.subject,
      html: emailData.html,
    });

    res.status(200).json({
      success: true,
      message: 'Warranty claim accepted',
      claim,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to accept warranty claim',
      error: error.message,
    });
  }
};

// @desc    Reject warranty claim with reason
// @route   PUT /api/admin/warranty-claims/:id/reject
// @access  Admin
const rejectWarrantyClaim = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Warranty claim not found' });
    }

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rejection reason',
      });
    }

    if (!WARRANTY_REJECTION_REASONS.includes(rejectionReason)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rejection reason',
        validReasons: WARRANTY_REJECTION_REASONS,
      });
    }

    const claim = await WarrantyClaim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Warranty claim not found',
      });
    }

    if (claim.status !== 'Claim Under Review') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject claim. Current status is '${claim.status}', expected 'Claim Under Review'`,
      });
    }

    claim.status = 'Claim Rejected';
    claim.rejectionReason = rejectionReason;
    await claim.save();

    // Get user email for notification
    const claimWithUser = await WarrantyClaim.findById(claim._id).populate('user', 'email name');

    // Send warranty claim rejected email
    const emailData = templates.warrantyClaimRejected({
      claimId: claim._id,
      rejectionReason,
    });

    await sendEmail({
      to: claimWithUser.user.email,
      subject: emailData.subject,
      html: emailData.html,
    });

    res.status(200).json({
      success: true,
      message: 'Warranty claim rejected',
      claim,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject warranty claim',
      error: error.message,
    });
  }
};

// @desc    Update warranty claim workflow status
// @route   PUT /api/admin/warranty-claims/:id/workflow
// @access  Admin
const updateClaimWorkflow = async (req, res) => {
  try {
    const { claimWorkflowStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Warranty claim not found' });
    }

    const validWorkflowStatuses = ['Pending', 'Pickup Assigned', 'Bike Picked Up', 'Issue Resolution', 'Bike Delivered'];

    if (!claimWorkflowStatus || !validWorkflowStatuses.includes(claimWorkflowStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid claimWorkflowStatus',
        validStatuses: validWorkflowStatuses,
      });
    }

    const claim = await WarrantyClaim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Warranty claim not found',
      });
    }

    if (claim.status !== 'Claim Accepted') {
      return res.status(400).json({
        success: false,
        message: `Cannot update workflow. Claim must be in 'Claim Accepted' status, current is '${claim.status}'`,
      });
    }

    claim.claimWorkflowStatus = claimWorkflowStatus;
    await claim.save();

    res.status(200).json({
      success: true,
      message: `Claim workflow status updated to '${claimWorkflowStatus}'`,
      claim,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update claim workflow status',
      error: error.message,
    });
  }
};

module.exports = {
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
};

const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const { sendEmail, templates } = require('../services/emailService');

// Lazy-initialize Razorpay instance (env vars may not be loaded at require time)
let razorpayInstance = null;
const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

// @desc    Create Razorpay order for a booking
// @route   POST /api/payment/create-order
// @access  Private (User)
const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
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
        message: 'Not authorized to pay for this booking',
      });
    }

    // Bill must be generated (paymentStatus must be 'Pending')
    if (booking.paymentStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: booking.paymentStatus === 'Not Generated'
          ? 'Bill has not been generated yet'
          : `Payment has already been made (${booking.paymentStatus})`,
      });
    }

    // Create Razorpay order (amount in paise)
    const options = {
      amount: Math.round(booking.bill.totalAmount * 100),
      currency: 'INR',
      receipt: booking.bookingId,
    };

    const order = await getRazorpay().orders.create(options);

    // Save Razorpay order ID to booking
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId: booking.bookingId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payment/verify
// @access  Private (User)
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Please provide razorpay_order_id, razorpay_payment_id, and razorpay_signature',
      });
    }

    // Verify signature using HMAC SHA256
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    // Find booking by Razorpay order ID
    const booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id })
      .populate('user', 'email name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found for this payment order',
      });
    }

    // Idempotency: if already paid, return success without re-processing
    if (booking.paymentStatus === 'Paid Online') {
      return res.status(200).json({
        success: true,
        message: 'Payment was already verified',
        booking: {
          bookingId: booking.bookingId,
          paymentStatus: booking.paymentStatus,
          amountPaid: booking.bill.totalAmount,
        },
      });
    }

    // Update payment status
    booking.paymentStatus = 'Paid Online';
    booking.razorpayPaymentId = razorpay_payment_id;
    await booking.save();

    // Send payment received email
    const emailData = templates.paymentReceived({
      bookingId: booking.bookingId,
      amountPaid: booking.bill.totalAmount,
      paymentMethod: 'Online (Razorpay)',
    });

    await sendEmail({
      to: booking.user.email,
      subject: emailData.subject,
      html: emailData.html,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      booking: {
        bookingId: booking.bookingId,
        paymentStatus: booking.paymentStatus,
        amountPaid: booking.bill.totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};

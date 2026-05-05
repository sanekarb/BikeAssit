const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },     // Auto-generated: BSP-YYYYMMDD-XXXX
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bike: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true },

  // Bike snapshot (in case bike details change later)
  bikeSnapshot: {
    brand: String,
    model: String,
    registrationNumber: String,
    manufacturingYear: Number,
  },

  pickupAddress: { type: String, required: true },
  preferredPickupDate: { type: Date, required: true },
  preferredPickupTime: { type: String, required: true },
  issueDescription: { type: String, required: true },

  status: {
    type: String,
    enum: [
      'Pending', 'Accepted', 'Rejected', 'Cancelled',
      'Pickup Assigned', 'Bike Picked Up', 'Service In Progress',
      'Service Completed', 'Ready For Delivery', 'Delivered', 'Completed'
    ],
    default: 'Pending'
  },

  // Admin fields
  rejectionReason: { type: String },
  cancellationReason: { type: String },
  cancelledBy: { type: String, enum: ['user', 'admin'] },

  pickupPerson: {
    name: String,
    mobile: String,
    vehicleNumber: String,
  },

  // Billing
  bill: {
    serviceCost: { type: Number, default: 0 },
    partsCost: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    generatedAt: Date,
  },

  // Payment
  paymentStatus: {
    type: String,
    enum: ['Not Generated', 'Pending', 'Paid Online', 'Paid On Delivery'],
    default: 'Not Generated'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,

  // Loyalty
  loyaltyPointsCredited: { type: Boolean, default: false },

  // Warranty
  warrantyActivated: { type: Boolean, default: false },
  warrantyExpiry: { type: Date },

  // Delivery date
  deliveredAt: { type: Date },

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);

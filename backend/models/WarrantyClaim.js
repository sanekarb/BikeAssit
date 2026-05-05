const mongoose = require('mongoose');

const warrantyClaimSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  claimDescription: { type: String, required: true },

  status: {
    type: String,
    enum: ['Claim Under Review', 'Claim Accepted', 'Claim Rejected'],
    default: 'Claim Under Review'
  },

  rejectionReason: String,

  pickupPerson: {
    name: String,
    mobile: String,
    vehicleNumber: String,
  },

  claimWorkflowStatus: {
    type: String,
    enum: ['Pending', 'Pickup Assigned', 'Bike Picked Up', 'Issue Resolution', 'Bike Delivered'],
    default: 'Pending'
  },

}, { timestamps: true });

module.exports = mongoose.model('WarrantyClaim', warrantyClaimSchema);

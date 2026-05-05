const mongoose = require('mongoose');

const loyaltySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  availablePoints: { type: Number, default: 0 },

  transactions: [{
    type: { type: String, enum: ['earned', 'redeemed', 'expired'] },
    points: Number,
    bookingId: String,
    description: String,
    expiryDate: Date,        // Only for 'earned' entries
    isExpired: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Virtual: earnedPoints — total ever earned (including expired)
loyaltySchema.virtual('earnedPoints').get(function () {
  return this.transactions
    .filter(t => t.type === 'earned')
    .reduce((sum, t) => sum + t.points, 0);
});

// Virtual: redeemedPoints (computed from transactions)
loyaltySchema.virtual('redeemedPoints').get(function () {
  return this.transactions
    .filter(t => t.type === 'redeemed')
    .reduce((sum, t) => sum + t.points, 0);
});

// Virtual: expiredPoints (earned transactions marked as expired by cron)
loyaltySchema.virtual('expiredPoints').get(function () {
  return this.transactions
    .filter(t => t.type === 'earned' && t.isExpired)
    .reduce((sum, t) => sum + t.points, 0);
});

// Ensure virtuals are included in JSON and Object output
loyaltySchema.set('toJSON', { virtuals: true });
loyaltySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('LoyaltyPoints', loyaltySchema);

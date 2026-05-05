const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  rating: { type: Number, min: 1, max: 5, required: true },
  serviceQuality: { type: String },
  pickupExperience: { type: String },
  deliveryExperience: { type: String },
  additionalComments: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);

const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  registrationNumber: { type: String, required: true, uppercase: true },
  manufacturingYear: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Bike', bikeSchema);

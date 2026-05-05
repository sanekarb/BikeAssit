const mongoose = require('mongoose');
const Bike = require('../models/Bike');

// @desc    Get all bikes for logged-in user
// @route   GET /api/bikes
// @access  Private (User)
const getUserBikes = async (req, res) => {
  try {
    const bikes = await Bike.find({ owner: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bikes.length,
      bikes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bikes',
      error: error.message,
    });
  }
};

// @desc    Add a new bike
// @route   POST /api/bikes
// @access  Private (User)
const addBike = async (req, res) => {
  try {
    const { brand, model, registrationNumber, manufacturingYear } = req.body;

    // Validate required fields
    if (!brand || !model || !registrationNumber || !manufacturingYear) {
      return res.status(400).json({
        success: false,
        message: 'Please provide brand, model, registration number, and manufacturing year',
      });
    }

    const bike = await Bike.create({
      owner: req.user._id,
      brand,
      model,
      registrationNumber,
      manufacturingYear,
    });

    res.status(201).json({
      success: true,
      message: 'Bike added successfully',
      bike,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add bike',
      error: error.message,
    });
  }
};

// @desc    Update a bike
// @route   PUT /api/bikes/:id
// @access  Private (User)
const updateBike = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Bike not found' });
    }

    const bike = await Bike.findById(req.params.id);

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: 'Bike not found',
      });
    }

    // Ensure the user owns this bike
    if (bike.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this bike',
      });
    }

    const { brand, model, registrationNumber, manufacturingYear } = req.body;

    if (brand) bike.brand = brand;
    if (model) bike.model = model;
    if (registrationNumber) bike.registrationNumber = registrationNumber;
    if (manufacturingYear) bike.manufacturingYear = manufacturingYear;

    await bike.save();

    res.status(200).json({
      success: true,
      message: 'Bike updated successfully',
      bike,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update bike',
      error: error.message,
    });
  }
};

// @desc    Delete a bike
// @route   DELETE /api/bikes/:id
// @access  Private (User)
const deleteBike = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Bike not found' });
    }

    const bike = await Bike.findById(req.params.id);

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: 'Bike not found',
      });
    }

    // Ensure the user owns this bike
    if (bike.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this bike',
      });
    }

    await Bike.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Bike deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete bike',
      error: error.message,
    });
  }
};

module.exports = {
  getUserBikes,
  addBike,
  updateBike,
  deleteBike,
};

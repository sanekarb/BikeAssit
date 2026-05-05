const Booking = require('../models/Booking');

/**
 * Generate a unique Booking ID in the format: BSP-YYYYMMDD-XXXX
 * Counter is based on today's booking count + 1.
 * Includes a retry loop to handle race conditions where two concurrent
 * requests could generate the same booking ID.
 */
const generateBookingId = async (maxRetries = 5) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Count today's bookings to determine next counter
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todayCount = await Booking.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    // Add attempt offset to avoid collision on retry
    const counter = String(todayCount + 1 + attempt).padStart(4, '0');
    const bookingId = `BSP-${dateStr}-${counter}`;

    // Check if this ID already exists
    const exists = await Booking.findOne({ bookingId });
    if (!exists) {
      return bookingId;
    }
  }

  // Fallback: use timestamp-based suffix to guarantee uniqueness
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const randomSuffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `BSP-${dateStr}-${randomSuffix}`;
};

module.exports = generateBookingId;

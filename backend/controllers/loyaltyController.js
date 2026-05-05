const LoyaltyPoints = require('../models/LoyaltyPoints');

// @desc    Get loyalty data for current user
// @route   GET /api/loyalty
// @access  Private (User)
const getLoyaltyData = async (req, res) => {
  try {
    let loyalty = await LoyaltyPoints.findOne({ user: req.user._id });

    if (!loyalty) {
      // Return empty loyalty record if none exists yet
      return res.status(200).json({
        success: true,
        loyalty: {
          availablePoints: 0,
          earnedPoints: 0,
          redeemedPoints: 0,
          expiredPoints: 0,
          transactions: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      loyalty: {
        availablePoints: loyalty.availablePoints,
        earnedPoints: loyalty.earnedPoints,
        redeemedPoints: loyalty.redeemedPoints,
        expiredPoints: loyalty.expiredPoints,
        transactions: loyalty.transactions.sort((a, b) => b.createdAt - a.createdAt),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loyalty data',
      error: error.message,
    });
  }
};

/**
 * Credit loyalty points to a user (called internally, not an API endpoint)
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} bookingId - The booking's bookingId string (e.g., BSP-20240815-0042)
 */
const creditLoyaltyPoints = async (userId, bookingId) => {
  try {
    let loyalty = await LoyaltyPoints.findOne({ user: userId });

    if (!loyalty) {
      loyalty = await LoyaltyPoints.create({
        user: userId,
        availablePoints: 0,
        transactions: [],
      });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90); // 90-day expiry

    loyalty.transactions.push({
      type: 'earned',
      points: 100,
      bookingId,
      description: `Earned 100 points for completed service (${bookingId})`,
      expiryDate,
      isExpired: false,
    });

    loyalty.availablePoints += 100;
    await loyalty.save();

    return loyalty;
  } catch (error) {
    console.error(`Failed to credit loyalty points for user ${userId}:`, error.message);
    // Don't throw — loyalty failure should not break the booking flow
    return null;
  }
};

/**
 * Run daily expiry check for all loyalty points (called by cron job)
 * Marks earned transactions older than 90 days as expired and recalculates availablePoints
 */
const expireLoyaltyPoints = async () => {
  try {
    const now = new Date();
    const allLoyalty = await LoyaltyPoints.find({});

    let totalExpired = 0;

    for (const loyalty of allLoyalty) {
      let pointsToExpire = 0;

      for (const txn of loyalty.transactions) {
        if (
          txn.type === 'earned' &&
          !txn.isExpired &&
          txn.expiryDate &&
          txn.expiryDate <= now
        ) {
          txn.isExpired = true;
          pointsToExpire += txn.points;
          totalExpired++;
        }
      }

      if (pointsToExpire > 0) {
        // Recalculate availablePoints from non-expired earned minus redeemed
        const totalEarned = loyalty.transactions
          .filter(t => t.type === 'earned' && !t.isExpired)
          .reduce((sum, t) => sum + t.points, 0);

        const totalRedeemed = loyalty.transactions
          .filter(t => t.type === 'redeemed')
          .reduce((sum, t) => sum + t.points, 0);

        loyalty.availablePoints = Math.max(0, totalEarned - totalRedeemed);
        await loyalty.save();
      }
    }

    console.log(`[Cron] Loyalty expiry check complete. ${totalExpired} transaction(s) expired.`);
  } catch (error) {
    console.error('[Cron] Loyalty expiry check failed:', error.message);
  }
};

module.exports = {
  getLoyaltyData,
  creditLoyaltyPoints,
  expireLoyaltyPoints,
};

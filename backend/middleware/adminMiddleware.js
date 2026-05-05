const adminMiddleware = (req, res, next) => {
  // Must be used AFTER authMiddleware
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
};

module.exports = adminMiddleware;

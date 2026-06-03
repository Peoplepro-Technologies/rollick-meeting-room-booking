import db from '../lib/db.js';

const requireActive = async (req, res, next) => {
  try {
    // Get user from request (attached by authenticateToken)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_USER',
          message: 'No user found in request'
        }
      });
    }

    // Check if user is active
    const user = await db.user.findUnique({
      where: { id: req.user.userId },
      select: { active: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account has been deactivated. Please contact administrator.'
        }
      });
    }

    // Add active user info to request
    req.user.active = true;
    next();
  } catch (error) {
    console.error('Active check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

export default requireActive;
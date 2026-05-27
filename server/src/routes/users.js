import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../lib/db.js';

const router = express.Router();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'No token provided'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    });
  }
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required'
      }
    });
  }
  next();
};

// Get all users
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Create new user
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Username and email are required'
        }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format'
        }
      });
    }

    if (!password && role !== 'user') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Password is required for admin users'
        }
      });
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    try {
      const user = await db.user.create({
        data: {
          username,
          email: email.toLowerCase(),
          passwordHash,
          role: role || 'user'
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      res.json({
        success: true,
        data: {
          user
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_USER',
            message: 'Username or email already exists'
          }
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Update user
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;

    // Prevent self-modification of role
    if (parseInt(id) === req.user.userId && role !== undefined) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You cannot change your own role'
        }
      });
    }

    const existingUser = await db.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email format'
          }
        });
      }
      updateData.email = email.toLowerCase();
    }
    if (password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    if (role !== undefined) updateData.role = role;

    const updatedUser = await db.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_USER',
          message: 'Username or email already exists'
        }
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Delete user
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You cannot delete your own account'
        }
      });
    }

    const deletedUser = await db.user.delete({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        email: true
      }
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        user: deletedUser
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

export default router;
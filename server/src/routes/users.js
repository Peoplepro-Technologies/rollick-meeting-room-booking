import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../database.js';

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
    const db = getDb();
    const users = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC',
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
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

    const db = getDb();
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    try {
      const result = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
          [username, email.toLowerCase(), passwordHash, role || 'user'],
          function(err) {
            if (err) {
              reject(err);
              return;
            }
            resolve({ id: this.lastID });
          }
        );
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: result.id,
            username,
            email: email.toLowerCase(),
            role: role || 'user'
          }
        }
      });
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_USER',
            message: 'Username or email already exists'
          }
        });
      }
      throw err;
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

    const db = getDb();

    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) { reject(err); return; }
        resolve(row);
      });
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

    const fields = [];
    const params = [];

    if (username !== undefined) {
      fields.push('username = ?');
      params.push(username);
    }

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
      fields.push('email = ?');
      params.push(email.toLowerCase());
    }

    if (password) {
      fields.push('password_hash = ?');
      params.push(await bcrypt.hash(password, 10));
    }

    if (role !== undefined) {
      fields.push('role = ?');
      params.push(role);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    try {
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
          params,
          function(err) {
            if (err) {
              reject(err);
              return;
            }
            resolve({ changes: this.changes });
          }
        );
      });

      const updatedUser = await new Promise((resolve, reject) => {
        db.get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [id], (err, row) => {
          if (err) { reject(err); return; }
          resolve(row);
        });
      });

      res.json({
        success: true,
        data: { user: updatedUser }
      });
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_USER',
            message: 'Username or email already exists'
          }
        });
      }
      throw err;
    }
  } catch (error) {
    console.error('Update user error:', error);
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

    const db = getDb();

    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) { reject(err); return; }
        resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) { reject(err); return; }
        resolve({ changes: this.changes });
      });
    });

    // Also delete user's bookings
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM bookings WHERE user_id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(null);
      });
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
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

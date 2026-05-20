import express from 'express';
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

// Get all rooms
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const rooms = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM rooms ORDER BY name',
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
        rooms
      }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Get room by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDb();
    const room = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM rooms WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        room
      }
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Create new room (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, capacity, location, description } = req.body;
    
    if (!name || !capacity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Name and capacity are required'
        }
      });
    }
    
    const db = getDb();
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO rooms (name, capacity, location, description) VALUES (?, ?, ?, ?)',
        [name, capacity, location || null, description || null],
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
        room: {
          id: result.id,
          name,
          capacity,
          location,
          description
        }
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Update room (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, location, description } = req.body;
    
    if (!name || !capacity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Name and capacity are required'
        }
      });
    }
    
    const db = getDb();
    const result = await new Promise((resolve, reject) => {
      db.run(
        'UPDATE rooms SET name = ?, capacity = ?, location = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, capacity, location || null, description || null, id],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        room: {
          id: parseInt(id),
          name,
          capacity,
          location,
          description
        }
      }
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Delete room (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDb();
    const result = await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM rooms WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found'
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
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
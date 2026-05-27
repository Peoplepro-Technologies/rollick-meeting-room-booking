import express from 'express';
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

// Get all rooms
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rooms = await db.room.findMany({
      orderBy: { name: 'asc' }
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

    const room = await db.room.findUnique({
      where: { id: parseInt(id) }
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

    const room = await db.room.create({
      data: {
        name,
        capacity: parseInt(capacity),
        location,
        description
      }
    });

    res.json({
      success: true,
      data: {
        room
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

    const room = await db.room.update({
      where: { id: parseInt(id) },
      data: {
        name,
        capacity: parseInt(capacity),
        location,
        description
      }
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

    const deletedRoom = await db.room.delete({
      where: { id: parseInt(id) }
    });

    if (!deletedRoom) {
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
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

// Get all bookings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { room_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT b.*, u.username, r.name as room_name 
      FROM bookings b 
      JOIN users u ON b.user_id = u.id 
      JOIN rooms r ON b.room_id = r.id
    `;
    const params = [];
    
    if (room_id) {
      query += ' WHERE b.room_id = ?';
      params.push(room_id);
    }
    
    if (start_date && end_date) {
      query += room_id ? ' AND' : ' WHERE';
      query += ' b.start_time >= ? AND b.end_time <= ?';
      params.push(start_date, end_date);
    }
    
    query += ' ORDER BY b.start_time';
    
    const db = getDb();
    const bookings = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: {
        bookings
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Get booking by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDb();
    const booking = await new Promise((resolve, reject) => {
      db.get(
        `SELECT b.*, u.username, r.name as room_name 
         FROM bookings b 
         JOIN users u ON b.user_id = u.id 
         JOIN rooms r ON b.room_id = r.id 
         WHERE b.id = ?`,
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
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        booking
      }
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Check availability
router.get('/availability/check', async (req, res) => {
  try {
    const { room_id, start_time, end_time } = req.query;
    
    if (!room_id || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Room ID, start time, and end time are required'
        }
      });
    }
    
    const db = getDb();
    const conflictingBookings = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM bookings 
         WHERE room_id = ? 
         AND status = 'confirmed'
         AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
        [room_id, end_time, start_time, end_time, start_time],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
    
    const isAvailable = conflictingBookings.length === 0;
    
    res.json({
      success: true,
      data: {
        available: isAvailable,
        conflicting_bookings: conflictingBookings
      }
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Create new booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { room_id, title, start_time, end_time } = req.body;
    const user_id = req.user.userId;
    
    if (!room_id || !title || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'All fields are required'
        }
      });
    }
    
    // Check if room exists
    const db = getDb();
    const room = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM rooms WHERE id = ?',
        [room_id],
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
    
    // Check availability
    const conflictingBookings = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM bookings 
         WHERE room_id = ? 
         AND status = 'confirmed'
         AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
        [room_id, end_time, start_time, end_time, start_time],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
    
    if (conflictingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ROOM_NOT_AVAILABLE',
          message: 'Room is not available for the selected time slot'
        }
      });
    }
    
    // Create booking
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO bookings (room_id, user_id, title, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
        [room_id, user_id, title, start_time, end_time],
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
        booking: {
          id: result.id,
          room_id,
          user_id,
          title,
          start_time,
          end_time,
          status: 'confirmed'
        }
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Update booking
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { room_id, title, start_time, end_time } = req.body;
    
    const db = getDb();
    
    // Check if booking exists
    const booking = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM bookings WHERE id = ?',
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
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        }
      });
    }
    
    // Check availability (excluding current booking)
    const conflictingBookings = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM bookings 
         WHERE room_id = ? 
         AND status = 'confirmed'
         AND id != ?
         AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
        [room_id || booking.room_id, id, end_time || booking.end_time, start_time || booking.start_time, end_time || booking.end_time, start_time || booking.start_time],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
    
    if (conflictingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ROOM_NOT_AVAILABLE',
          message: 'Room is not available for the selected time slot'
        }
      });
    }
    
    // Update booking
    const result = await new Promise((resolve, reject) => {
      db.run(
        'UPDATE bookings SET room_id = ?, title = ?, start_time = ?, end_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [room_id || booking.room_id, title || booking.title, start_time || booking.start_time, end_time || booking.end_time, id],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
    
    res.json({
      success: true,
      data: {
        booking: {
          id: parseInt(id),
          room_id: room_id || booking.room_id,
          user_id: booking.user_id,
          title: title || booking.title,
          start_time: start_time || booking.start_time,
          end_time: end_time || booking.end_time,
          status: booking.status
        }
      }
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Delete booking
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDb();
    const result = await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM bookings WHERE id = ?',
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
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Delete booking error:', error);
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
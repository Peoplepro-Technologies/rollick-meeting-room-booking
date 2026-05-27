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

// Get all bookings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { room_id, start_date, end_date } = req.query;

    const whereClause = {};
    if (room_id) whereClause.roomId = parseInt(room_id);
    if (start_date && end_date) {
      whereClause.startTime = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      };
    }

    const bookings = await db.booking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            username: true
          }
        },
        room: {
          select: {
            name: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
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

    const booking = await db.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            username: true
          }
        },
        room: {
          select: {
            name: true
          }
        }
      }
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

// Create new booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { room_id, title, start_time, end_time } = req.body;

    if (!room_id || !title || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Room ID, title, start time, and end time are required'
        }
      });
    }

    // Convert dates
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

    // Validate date format
    if (isNaN(startTime) || isNaN(endTime)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format'
        }
      });
    }

    // Check if end time is after start time
    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TIME_RANGE',
          message: 'End time must be after start time'
        }
      });
    }

    // Check if room exists
    const room = await db.room.findUnique({
      where: { id: parseInt(room_id) }
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
    const conflictingBooking = await db.booking.findFirst({
      where: {
        roomId: parseInt(room_id),
        status: 'confirmed',
        id: {
          not: req.body.id ? parseInt(req.body.id) : undefined
        },
        OR: [
          {
            startTime: {
              lte: endTime,
              gte: startTime
            }
          },
          {
            endTime: {
              lte: endTime,
              gte: startTime
            }
          },
          {
            startTime: {
              lte: startTime
            },
            endTime: {
              gte: endTime
            }
          }
        ]
      }
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ROOM_NOT_AVAILABLE',
          message: 'Room is not available for the selected time slot'
        }
      });
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        roomId: parseInt(room_id),
        userId: req.user.userId,
        title,
        startTime,
        endTime,
        status: 'confirmed'
      },
      include: {
        user: {
          select: {
            username: true
          }
        },
        room: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        booking
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

    // Get existing booking
    const existingBooking = await db.booking.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        }
      });
    }

    // Check ownership
    if (existingBooking.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only modify your own bookings'
        }
      });
    }

    // Prepare update data
    const updateData = {
      title: title || existingBooking.title
    };

    if (room_id !== undefined || start_time !== undefined || end_time !== undefined) {
      const roomId = room_id !== undefined ? parseInt(room_id) : existingBooking.roomId;
      const startTime = start_time ? new Date(start_time) : existingBooking.startTime;
      const endTime = end_time ? new Date(end_time) : existingBooking.endTime;

      // Validate dates
      if (isNaN(startTime) || isNaN(endTime)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: 'Invalid date format'
          }
        });
      }

      if (endTime <= startTime) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TIME_RANGE',
            message: 'End time must be after start time'
          }
        });
      }

      // Check availability (excluding current booking)
      const conflictingBooking = await db.booking.findFirst({
        where: {
          roomId: roomId,
          status: 'confirmed',
          id: {
            not: parseInt(id)
          },
          OR: [
            {
              startTime: {
                lte: endTime,
                gte: startTime
              }
            },
            {
              endTime: {
                lte: endTime,
                gte: startTime
              }
            },
            {
              startTime: {
                lte: startTime
              },
              endTime: {
                gte: endTime
              }
            }
          ]
        }
      });

      if (conflictingBooking) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ROOM_NOT_AVAILABLE',
            message: 'Room is not available for the selected time slot'
          }
        });
      }

      updateData.roomId = roomId;
      updateData.startTime = startTime;
      updateData.endTime = endTime;
    }

    // Update booking
    const updatedBooking = await db.booking.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            username: true
          }
        },
        room: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        booking: updatedBooking
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

    // Check ownership before deleting
    const booking = await db.booking.findUnique({
      where: { id: parseInt(id) }
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

    // Check ownership
    if (booking.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own bookings'
        }
      });
    }

    await db.booking.delete({
      where: { id: parseInt(id) }
    });

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

    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

    // Validate date format
    if (isNaN(startTime) || isNaN(endTime)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format'
        }
      });
    }

    const conflictingBookings = await db.booking.findMany({
      where: {
        roomId: parseInt(room_id),
        status: 'confirmed',
        OR: [
          {
            startTime: {
              lte: endTime,
              gte: startTime
            }
          },
          {
            endTime: {
              lte: endTime,
              gte: startTime
            }
          },
          {
            startTime: {
              lte: startTime
            },
            endTime: {
              gte: endTime
            }
          }
        ]
      }
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

export default router;
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import userRoutes from './routes/users.js';
import bookingRoutes from './routes/bookings.js';
import themeRoutes from './routes/theme.js';

// Import database
import db from './lib/db.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const FRONTEND_URL = process.env.FRONTEND_URL;
const ALLOWED_LAN_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no Origin header (curl, server-to-server, same-origin)
    if (!origin) return callback(null, true);

    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In production, accept requests from:
    //   1. The configured FRONTEND_URL (exact match)
    //   2. Same-host origins (e.g. http://<lan-ip>:5000 when served by this container)
    //   3. Any extra origins listed in CORS_ALLOWED_ORIGINS (comma-separated)
    if (FRONTEND_URL && origin === FRONTEND_URL) return callback(null, true);
    if (ALLOWED_LAN_ORIGINS.includes(origin)) return callback(null, true);

    try {
      const reqUrl = new URL(origin);
      const forwardedHost = req.headers?.host; // only used when present
      // Same-host: origin's host matches the request's Host header
      if (forwardedHost && reqUrl.host === forwardedHost) {
        return callback(null, true);
      }
    } catch {
      // ignore parse errors
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'meeting-room-booking' });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/theme', themeRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong!'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await db.$connect();
    console.log('Database connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
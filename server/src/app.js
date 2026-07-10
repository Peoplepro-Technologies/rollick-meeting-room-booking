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
    // Allow requests with no Origin header (curl, server-to-server, same-origin GETs)
    if (!origin) return callback(null, true);

    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In production, accept requests from:
    //   1. The configured FRONTEND_URL (exact match)
    //   2. Any origin listed in CORS_ALLOWED_ORIGINS (comma-separated)
    // Same-host origins are handled by allowSameHost() below — it needs
    // req.headers.host, which the cors library does NOT expose to its
    // origin callback. So we wire the same-host check in as a middleware
    // that runs *before* this cors() call.
    if (FRONTEND_URL && origin === FRONTEND_URL) return callback(null, true);
    if (ALLOWED_LAN_ORIGINS.includes(origin)) return callback(null, true);

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

// Permits origins whose host:port matches the request's Host header.
// This is the typical "browser opens the SPA at http://<lan-ip>:5000" case
// where the API and the SPA are served from the same process.
//
// The cors middleware that runs immediately after this does NOT expose
// `req.headers.host` to its origin callback, so we resolve same-host
// matches here, set the CORS response headers ourselves, and strip the
// Origin header from the request so cors()'s "no origin" branch lets
// the request through instead of rejecting it.
function allowSameHost(req, res, next) {
  const origin = req.headers.origin;
  if (!origin) return next();

  let reqUrl;
  try {
    reqUrl = new URL(origin);
  } catch {
    return next();
  }

  const hostHeader = req.headers.host;
  if (!hostHeader || reqUrl.host !== hostHeader) {
    return next(); // not same-host — let cors() decide
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    const reqHeaders = req.headers['access-control-request-headers'];
    const reqMethod = req.headers['access-control-request-method'];
    if (reqMethod) res.setHeader('Access-Control-Allow-Methods', reqMethod);
    if (reqHeaders) res.setHeader('Access-Control-Allow-Headers', reqHeaders);
    return res.status(204).end();
  }

  // Same-host actual request: hand off to the next middleware but trick
  // the cors() that follows into treating this as a no-origin (same-origin)
  // request, so its allowlist check is bypassed.
  delete req.headers.origin;
  return next();
}

app.use(allowSameHost);
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
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
import { seedDatabase } from '../prisma/seed.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, only allow the configured frontend URL
    if (origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// API routes
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

    // Check if database has been seeded before
    const adminUser = await db.user.findUnique({
      where: { email: 'admin@meetingroom.com' }
    });

    if (!adminUser) {
      await seedDatabase();
      console.log('Database seeded with default admin user');
    } else {
      console.log('Database already seeded');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
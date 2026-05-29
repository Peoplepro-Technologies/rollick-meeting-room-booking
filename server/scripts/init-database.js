#!/usr/bin/env node

// Database initialization script
import db from '../src/lib/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Initializing database...');

async function initializeDatabase() {
  try {
    // Connect to database (this will create tables and seed data)
    await db.$connect();
    
    console.log('✅ Database initialized successfully!');
    console.log('📁 Database file location:', path.join(__dirname, '../database.sqlite'));
    console.log('👤 Default admin user: admin / Admin@1234 (email: admin@rollick.co.in)');
    console.log('🏢 Sample rooms and bookings have been created');
    
    // Close connection
    await db.$disconnect();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase();
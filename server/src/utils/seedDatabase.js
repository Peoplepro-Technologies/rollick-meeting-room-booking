import bcrypt from 'bcryptjs';
import { getDb } from '../database.js';

export const seedDatabase = async () => {
  const db = getDb();
  
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        ['admin', adminPassword, 'admin'],
        (err) => {
          if (err) reject(err);
          else resolve(null);
        }
      );
    });

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        ['user', userPassword, 'user'],
        (err) => {
          if (err) reject(err);
          else resolve(null);
        }
      );
    });

    // Create sample rooms
    const rooms = [
      { name: 'Conference Room A', capacity: 10, location: '1st Floor', description: 'Large conference room with projector' },
      { name: 'Conference Room B', capacity: 6, location: '1st Floor', description: 'Small meeting room' },
      { name: 'Conference Room C', capacity: 8, location: '2nd Floor', description: 'Medium meeting room with whiteboard' },
      { name: 'Board Room', capacity: 12, location: '2nd Floor', description: 'Executive board room' },
    ];

    for (const room of rooms) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO rooms (name, capacity, location, description) VALUES (?, ?, ?, ?)',
          [room.name, room.capacity, room.location, room.description],
          (err) => {
            if (err) reject(err);
            else resolve(null);
          }
        );
      });
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
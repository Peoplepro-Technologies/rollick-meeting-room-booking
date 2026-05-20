import bcrypt from 'bcryptjs';
import { getDb } from '../database.js';

export const seedDatabase = async () => {
  const db = getDb();

  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@meetingroom.com', adminPassword, 'admin'],
        (err) => {
          if (err) reject(err);
          else resolve(null);
        }
      );
    });

    console.log('Default admin user ensured (admin@meetingroom.com / admin123)');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

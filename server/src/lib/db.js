import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database path from environment or use default
const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../database.sqlite');

class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.initializeTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async initializeTables() {
    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        username TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Rooms table
      `CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        location TEXT,
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Bookings table
      `CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        roomId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        startTime DATETIME NOT NULL,
        endTime DATETIME NOT NULL,
        status TEXT DEFAULT 'confirmed',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (roomId) REFERENCES rooms (id),
        FOREIGN KEY (userId) REFERENCES users (id)
      )`,
      
      // Themes table
      `CREATE TABLE IF NOT EXISTS themes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        primaryColor TEXT DEFAULT '#1976d2',
        secondaryColor TEXT DEFAULT '#dc004e',
        backgroundColor TEXT DEFAULT '#ffffff',
        paletteIndex INTEGER DEFAULT 0,
        textColorIndex INTEGER DEFAULT 0,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_bookings_room_time ON bookings(roomId, startTime, endTime)`,
      `CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(userId)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    ];

    for (const query of queries) {
      await this.run(query);
    }

    // Seed database if empty
    try {
      await this.seedDatabase();
    } catch (error) {
      console.log('Database seeding skipped (already seeded or error):', error.message);
    }
  }

  async seedDatabase() {
    // Check if admin user exists
    const adminUser = await this.get('SELECT id FROM users WHERE email = ?', ['admin@meetingroom.com']);
    
    if (!adminUser) {
      console.log('Seeding database with initial data...');
      
      // Hash password for admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Insert admin user
      await this.run(
        `INSERT INTO users (email, password, username, role) VALUES (?, ?, ?, ?)`,
        ['admin@rollick.co.in', hashedPassword, 'admin', 'admin']
      );
      
      // Insert sample rooms
      await this.run(
        `INSERT INTO rooms (name, capacity, location, description) VALUES 
         ('Conference Room A', 10, 'Floor 1', 'Large conference room with projector'),
         ('Meeting Room B', 6, 'Floor 2', 'Small meeting room'),
         ('Training Room', 20, 'Floor 3', 'Large training room with whiteboards')`
      );
      
      // Insert sample booking
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setHours(11, 0, 0, 0);
      
      await this.run(
        `INSERT INTO bookings (title, roomId, userId, startTime, endTime) VALUES 
         ('Team Meeting', 1, 1, ?, ?)`,
        [tomorrow.toISOString(), endTime.toISOString()]
      );
      
      // Insert default theme
      await this.run(
        `INSERT INTO themes (name, primaryColor, secondaryColor, backgroundColor, paletteIndex, textColorIndex, isActive) VALUES 
         ('default', '#1976d2', '#dc004e', '#ffffff', 0, 0, 1)`
      );
      
      console.log('Database seeded successfully');
    } else {
      console.log('Database already seeded');
    }
  }

  // Helper method for running queries
  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Helper method for getting single row
  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Helper method for getting multiple rows
  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // User operations
  user = {
    findMany: async (options = {}) => {
      let query = 'SELECT * FROM users';
      const params = [];
      
      if (options.orderBy?.username === 'asc') {
        query += ' ORDER BY username ASC';
      }
      
      const rows = await this.all(query, params);
      return rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
    },
    
    findUnique: async (options) => {
      let query = 'SELECT * FROM users WHERE';
      const params = [];
      
      if (options.where?.id) {
        query += ' id = ?';
        params.push(options.where.id);
      } else if (options.where?.email) {
        query += ' email = ?';
        params.push(options.where.email);
      } else {
        return null;
      }
      
      const row = await this.get(query, params);
      if (!row) return null;
      
      return {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      };
    },
    
    create: async (options) => {
      const { id, createdAt, updatedAt, ...data } = options.data;
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      const result = await this.run(
        `INSERT INTO users (email, password, username, role) VALUES (?, ?, ?, ?)`,
        [data.email, hashedPassword, data.username, data.role || 'user']
      );
      
      return this.user.findUnique({ where: { id: result.id } });
    },
    
    update: async (options) => {
      const { id, createdAt, updatedAt, ...data } = options.data;
      const setClause = [];
      const params = [];
      
      if (data.email) {
        setClause.push('email = ?');
        params.push(data.email);
      }
      if (data.password) {
        setClause.push('password = ?');
        params.push(await bcrypt.hash(data.password, 10));
      }
      if (data.username) {
        setClause.push('username = ?');
        params.push(data.username);
      }
      if (data.role) {
        setClause.push('role = ?');
        params.push(data.role);
      }
      
      if (setClause.length === 0) {
        return this.user.findUnique({ where: { id: options.where.id } });
      }
      
      params.push(options.where.id);
      
      await this.run(
        `UPDATE users SET ${setClause.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        params
      );
      
      return this.user.findUnique({ where: { id: options.where.id } });
    },
    
    delete: async (options) => {
      const result = await this.run('DELETE FROM users WHERE id = ?', [options.where.id]);
      return result.changes > 0 ? { id: options.where.id } : null;
    }
  };

  // Room operations
  room = {
    findMany: async (options = {}) => {
      let query = 'SELECT * FROM rooms';
      const params = [];
      
      if (options.orderBy?.name === 'asc') {
        query += ' ORDER BY name ASC';
      }
      
      const rows = await this.all(query, params);
      return rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
    },
    
    findUnique: async (options) => {
      const row = await this.get('SELECT * FROM rooms WHERE id = ?', [options.where.id]);
      if (!row) return null;
      
      return {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      };
    },
    
    create: async (options) => {
      const { id, createdAt, updatedAt, ...data } = options.data;
      
      const result = await this.run(
        `INSERT INTO rooms (name, capacity, location, description) VALUES (?, ?, ?, ?)`,
        [data.name, data.capacity, data.location || null, data.description || null]
      );
      
      return this.room.findUnique({ where: { id: result.id } });
    },
    
    update: async (options) => {
      const { id, createdAt, updatedAt, ...data } = options.data;
      const setClause = [];
      const params = [];
      
      if (data.name) {
        setClause.push('name = ?');
        params.push(data.name);
      }
      if (data.capacity) {
        setClause.push('capacity = ?');
        params.push(data.capacity);
      }
      if (data.location !== undefined) {
        setClause.push('location = ?');
        params.push(data.location || null);
      }
      if (data.description !== undefined) {
        setClause.push('description = ?');
        params.push(data.description || null);
      }
      
      if (setClause.length === 0) {
        return this.room.findUnique({ where: { id: options.where.id } });
      }
      
      params.push(options.where.id);
      
      await this.run(
        `UPDATE rooms SET ${setClause.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        params
      );
      
      return this.room.findUnique({ where: { id: options.where.id } });
    },
    
    delete: async (options) => {
      const result = await this.run('DELETE FROM rooms WHERE id = ?', [options.where.id]);
      return result.changes > 0 ? { id: options.where.id } : null;
    }
  };

  // Booking operations
  booking = {
    findMany: async (options = {}) => {
      let query = 'SELECT * FROM bookings';
      const params = [];
      const conditions = [];
      
      if (options.where?.roomId) {
        conditions.push('roomId = ?');
        params.push(options.where.roomId);
      }
      
      if (options.where?.userId) {
        conditions.push('userId = ?');
        params.push(options.where.userId);
      }
      
      if (options.where?.startTime?.gte && options.where?.endTime?.lte) {
        conditions.push('(startTime >= ? AND endTime <= ?)');
        params.push(
          new Date(options.where.startTime.gte).toISOString(),
          new Date(options.where.endTime.lte).toISOString()
        );
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      const rows = await this.all(query, params);
      return rows.map(row => ({
        ...row,
        startTime: new Date(row.startTime),
        endTime: new Date(row.endTime),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
    },
    
    findFirst: async (options = {}) => {
      let query = 'SELECT * FROM bookings';
      const params = [];
      const conditions = [];
      
      if (options.where?.roomId) {
        conditions.push('roomId = ?');
        params.push(options.where.roomId);
      }
      
      if (options.where?.userId) {
        conditions.push('userId = ?');
        params.push(options.where.userId);
      }
      
      if (options.where?.status) {
        conditions.push('status = ?');
        params.push(options.where.status);
      }
      
      if (options.where?.id) {
        if (options.where.id.not !== undefined) {
          conditions.push('id != ?');
          params.push(options.where.id.not);
        } else {
          conditions.push('id = ?');
          params.push(options.where.id);
        }
      }
      
      if (options.where?.OR) {
        const orConditions = [];
        for (const orCondition of options.where.OR) {
          const orClause = [];
          if (orCondition.startTime?.lte && orCondition.startTime?.gte) {
            orClause.push('(startTime <= ? AND startTime >= ?)');
            params.push(
              new Date(orCondition.startTime.lte).toISOString(),
              new Date(orCondition.startTime.gte).toISOString()
            );
          }
          if (orCondition.endTime?.lte && orCondition.endTime?.gte) {
            orClause.push('(endTime <= ? AND endTime >= ?)');
            params.push(
              new Date(orCondition.endTime.lte).toISOString(),
              new Date(orCondition.endTime.gte).toISOString()
            );
          }
          if (orCondition.startTime?.lte && orCondition.endTime?.gte) {
            orClause.push('(startTime <= ? AND endTime >= ?)');
            params.push(
              new Date(orCondition.startTime.lte).toISOString(),
              new Date(orCondition.endTime.gte).toISOString()
            );
          }
          if (orClause.length > 0) {
            orConditions.push('(' + orClause.join(' AND ') + ')');
          }
        }
        if (orConditions.length > 0) {
          conditions.push('(' + orConditions.join(' OR ') + ')');
        }
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' LIMIT 1';
      
      const row = await this.get(query, params);
      if (!row) return null;
      
      return {
        ...row,
        startTime: new Date(row.startTime),
        endTime: new Date(row.endTime),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      };
    },
    
    findUnique: async (options) => {
      const row = await this.get('SELECT * FROM bookings WHERE id = ?', [options.where.id]);
      if (!row) return null;
      
      return {
        ...row,
        startTime: new Date(row.startTime),
        endTime: new Date(row.endTime),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      };
    },
    
    create: async (options) => {
      const { id, createdAt, updatedAt, ...data } = options.data;
      
      const result = await this.run(
        `INSERT INTO bookings (title, roomId, userId, startTime, endTime, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.title,
          data.roomId,
          data.userId,
          data.startTime.toISOString(),
          data.endTime.toISOString(),
          data.status || 'confirmed'
        ]
      );
      
      return this.booking.findUnique({ where: { id: result.id } });
    },
    
    update: async (options) => {
      const { id, createdAt, updatedAt, ...data } = options.data;
      const setClause = [];
      const params = [];
      
      if (data.title) {
        setClause.push('title = ?');
        params.push(data.title);
      }
      if (data.roomId) {
        setClause.push('roomId = ?');
        params.push(data.roomId);
      }
      if (data.userId) {
        setClause.push('userId = ?');
        params.push(data.userId);
      }
      if (data.startTime) {
        setClause.push('startTime = ?');
        params.push(data.startTime.toISOString());
      }
      if (data.endTime) {
        setClause.push('endTime = ?');
        params.push(data.endTime.toISOString());
      }
      if (data.status) {
        setClause.push('status = ?');
        params.push(data.status);
      }
      
      if (setClause.length === 0) {
        return this.booking.findUnique({ where: { id: options.where.id } });
      }
      
      params.push(options.where.id);
      
      await this.run(
        `UPDATE bookings SET ${setClause.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        params
      );
      
      return this.booking.findUnique({ where: { id: options.where.id } });
    },
    
    delete: async (options) => {
      const result = await this.run('DELETE FROM bookings WHERE id = ?', [options.where.id]);
      return result.changes > 0 ? { id: options.where.id } : null;
    }
  };

  // Theme operations
  theme = {
    findMany: async (options = {}) => {
      const rows = await this.all('SELECT * FROM themes', []);
      return rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
    },
    
    findUnique: async (options) => {
      const row = await this.get('SELECT * FROM themes WHERE id = ?', [options.where.id]);
      if (!row) return null;
      
      return {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      };
    },
    
    findFirst: async (options = {}) => {
      let query = 'SELECT * FROM themes';
      const params = [];
      const conditions = [];
      
      if (options.where?.id) {
        conditions.push('id = ?');
        params.push(options.where.id);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' LIMIT 1';
      
      const row = await this.get(query, params);
      if (!row) return null;
      
      return {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      };
    },
    
    upsert: async (options) => {
      const { where, create, update } = options;
      
      // First try to find the record
      const existing = await this.theme.findUnique({ where });
      
      if (existing) {
        // Update existing record
        return await this.theme.update({
          where,
          data: { ...update, id: where.id }
        });
      } else {
        // Create new record
        return await this.theme.create({
          data: { ...create, id: where.id }
        });
      }
    },
    
    create: async (options) => {
      const { id, createdAt, updatedAt, ...data } = options.data;
      
      const result = await this.run(
        `INSERT INTO themes (name, primaryColor, secondaryColor, backgroundColor, paletteIndex, textColorIndex, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.name || 'default',
          data.primaryColor || '#1976d2',
          data.secondaryColor || '#dc004e',
          data.backgroundColor || '#ffffff',
          data.paletteIndex || 0,
          data.textColorIndex || 0,
          data.isActive !== undefined ? data.isActive : 1
        ]
      );
      
      return this.theme.findUnique({ where: { id: result.id } });
    },
    
    update: async (options) => {
      const { id, createdAt, updatedAt, ...data } = options.data;
      const setClause = [];
      const params = [];
      
      if (data.name) {
        setClause.push('name = ?');
        params.push(data.name);
      }
      if (data.primaryColor) {
        setClause.push('primaryColor = ?');
        params.push(data.primaryColor);
      }
      if (data.secondaryColor) {
        setClause.push('secondaryColor = ?');
        params.push(data.secondaryColor);
      }
      if (data.backgroundColor) {
        setClause.push('backgroundColor = ?');
        params.push(data.backgroundColor);
      }
      if (data.paletteIndex !== undefined) {
        setClause.push('paletteIndex = ?');
        params.push(data.paletteIndex);
      }
      if (data.textColorIndex !== undefined) {
        setClause.push('textColorIndex = ?');
        params.push(data.textColorIndex);
      }
      if (data.isActive !== undefined) {
        setClause.push('isActive = ?');
        params.push(data.isActive ? 1 : 0);
      }
      
      if (setClause.length === 0) {
        return this.theme.findUnique({ where: { id: options.where.id } });
      }
      
      params.push(options.where.id);
      
      await this.run(
        `UPDATE themes SET ${setClause.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        params
      );
      
      return this.theme.findUnique({ where: { id: options.where.id } });
    },
    
    delete: async (options) => {
      const result = await this.run('DELETE FROM themes WHERE id = ?', [options.where.id]);
      return result.changes > 0 ? { id: options.where.id } : null;
    }
  };

  // Connection methods
  async $connect() {
    await this.connect();
  }

  async $disconnect() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// Create and export singleton instance
const db = new Database();
export default db;
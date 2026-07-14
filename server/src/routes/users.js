import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import db from '../lib/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOADS_DIR
      ? process.env.UPLOADS_DIR
      : path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `users-${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv') ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV or Excel files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload users from CSV or Excel
router.post('/upload', authenticateToken, requireAdmin, upload.single('file'), (req, res) => {
  // Handle multer errors
  if (req.fileValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE',
        message: req.fileValidationError
      }
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE',
        message: 'No file provided'
      }
    });
  }

  const results = [];
  const filePath = path.join(__dirname, '../../uploads', req.file.filename);

  // Read and parse file based on extension
  const fileExt = path.extname(filePath).toLowerCase();
  const isExcel = fileExt === '.xlsx' || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (isExcel) {
    // Parse Excel file
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet);

      // Process each row
      jsonData.forEach((data) => {
        // Convert all values to strings before trimming to handle Excel numbers/types
        const toString = (val) => val == null ? '' : String(val);
        // Accept either 'Status' (template) or 'active' for backward compat
        const statusRaw = toString(data.Status ?? data.active).trim().toLowerCase();
        const row = {
          username: toString(data.username).trim(),
          email: toString(data.email).trim().toLowerCase(),
          password: data.password == null ? null : toString(data.password).trim(),
          role: (toString(data.role).trim() || 'user').toLowerCase(),
          active: statusRaw !== 'false' && statusRaw !== '0' && statusRaw !== ''
        };

        // Validate required fields
        if (row.username && row.email) {
          results.push(row);
        }
      });

      // Process results for Excel
      processExcelResults(results, filePath, res);
    } catch (error) {
      console.error('Excel parse error:', error);
      fs.unlinkSync(filePath);
      res.status(500).json({
        success: false,
        error: {
          code: 'EXCEL_PARSE_ERROR',
          message: 'Failed to parse Excel file'
        }
      });
    }
  } else {
    // Parse CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Process each row
        // Accept either 'Status' (template) or 'active' for backward compat
        const statusRaw = (data.Status ?? data.active)?.trim().toLowerCase();
        const row = {
          username: data.username?.trim(),
          email: data.email?.trim().toLowerCase(),
          password: data.password?.trim() || null,
          role: (data.role?.trim() || 'user').toLowerCase(),
          active: statusRaw !== 'false' && statusRaw !== '0'
        };

        // Validate required fields
        if (row.username && row.email) {
          results.push(row);
        }
      })
      .on('end', () => processExcelResults(results, filePath, res))
      .on('error', (error) => {
        console.error('CSV read error:', error);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(500).json({
          success: false,
          error: {
            code: 'CSV_PARSE_ERROR',
            message: 'Failed to parse CSV file'
          }
        });
      });
  }
});

function processExcelResults(results, filePath, res) {
  // Clear existing users except admin
  db.user.deleteMany({
    where: {
      role: {
        not: 'admin'
      }
    }
  }).then((result) => {
    // Insert new users
    const hashedPasswords = {};
    const usersToInsert = results.map(row => {
      const passwordStr = String(row.password || '').trim();
      const password = passwordStr ? (hashedPasswords[passwordStr] || (hashedPasswords[passwordStr] = bcrypt.hashSync(passwordStr, 10))) : null;
      return {
        username: row.username,
        email: row.email,
        password: password,
        role: row.role === 'admin' ? 'admin' : 'user',
        active: Boolean(row.active)
      };
    });

    // Insert users one by one to avoid unique constraint issues
    let insertedCount = 0;
    const insertPromises = usersToInsert.map(user =>
      db.user.create({
        data: {
          username: user.username,
          email: user.email,
          password: user.password || 'no-password',
          role: user.role,
          active: user.active
        }
      }).catch(error => {
        // Continue with other users even if one fails (duplicate emails)
        return null;
      }).then(result => {
        if (result) {
          insertedCount++;
        }
        return result;
      })
    );

    Promise.all(insertPromises).then(() => {
      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: `Successfully imported ${insertedCount} users (skipped duplicates)`,
        data: {
          importedCount: insertedCount,
          attemptedCount: usersToInsert.length,
          skippedCount: usersToInsert.length - insertedCount
        }
      });
    }).catch(error => {
      console.error('Insert error:', error);
      console.error('Stack trace:', error.stack);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.status(500).json({
        success: false,
        error: {
          code: 'INSERT_FAILED',
          message: `Failed to insert users: ${error.message}`
        }
      });
    });
  }).catch(error => {
    console.error('Delete error:', error);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete existing users'
      }
    });
  });
}

// Get all users
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Create new user
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Username and email are required'
        }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format'
        }
      });
    }

    if (!password && role !== 'user') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Password is required for admin users'
        }
      });
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    try {
      const user = await db.user.create({
        data: {
          username,
          email: email.toLowerCase(),
          password: passwordHash,
          role: role || 'user',
          active: true // New users are active by default
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          active: true,
          createdAt: true
        }
      });

      res.json({
        success: true,
        data: {
          user
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_USER',
            message: 'Username or email already exists'
          }
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Update user
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role, active } = req.body;

    // Prevent self-modification of role
    if (parseInt(id) === req.user.userId && role !== undefined) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You cannot change your own role'
        }
      });
    }

    const existingUser = await db.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Prevent self-deactivation
    if (parseInt(id) === req.user.userId && !active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You cannot deactivate your own account'
        }
      });
    }

    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email format'
          }
        });
      }
      updateData.email = email.toLowerCase();
    }
    if (password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    if (role !== undefined) updateData.role = role;
    if (active !== undefined) updateData.active = active;

    const updatedUser = await db.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_USER',
          message: 'Username or email already exists'
        }
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Update user status (active/inactive)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Active status must be a boolean value'
        }
      });
    }

    // Prevent self-deactivation
    if (parseInt(id) === req.user.userId && !active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You cannot deactivate your own account'
        }
      });
    }

    const updatedUser = await db.user.update({
      where: { id: parseInt(id) },
      data: { active }
    });

    res.json({
      success: true,
      data: {
        user: updatedUser,
        message: `User ${active ? 'activated' : 'deactivated'} successfully`
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Delete user
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You cannot delete your own account'
        }
      });
    }

    const deletedUser = await db.user.delete({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        email: true
      }
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        user: deletedUser
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Download user template
router.get('/template', (req, res) => {
  const templatePath = path.join(__dirname, '../../sample-users.csv');

  if (fs.existsSync(templatePath)) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="user-template.csv"');
    const fileStream = fs.createReadStream(templatePath);
    fileStream.pipe(res);
  } else {
    res.status(404).json({
      success: false,
      error: {
        code: 'TEMPLATE_NOT_FOUND',
        message: 'Template file not found'
      }
    });
  }
});

export default router;
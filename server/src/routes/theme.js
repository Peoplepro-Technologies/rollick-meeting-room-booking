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

// Get theme settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const theme = await db.theme.findUnique({
      where: { id: 1 }
    });

    // If no theme settings exist, create default
    if (!theme) {
      const defaultTheme = await db.theme.create({
        data: {
          id: 1,
          paletteIndex: 0,
          textColorIndex: 0
        }
      });

      return res.json({
        success: true,
        data: {
          theme: defaultTheme
        }
      });
    }

    res.json({
      success: true,
      data: {
        theme
      }
    });
  } catch (error) {
    console.error('Get theme settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Update theme settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { paletteIndex, textColorIndex } = req.body;

    if (paletteIndex === undefined || textColorIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Palette index and text color index are required'
        }
      });
    }

    const theme = await db.theme.upsert({
      where: { id: 1 },
      update: {
        paletteIndex,
        textColorIndex
      },
      create: {
        id: 1,
        paletteIndex,
        textColorIndex
      }
    });

    res.json({
      success: true,
      data: {
        theme
      }
    });
  } catch (error) {
    console.error('Update theme settings error:', error);
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
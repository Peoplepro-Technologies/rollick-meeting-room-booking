import express from 'express';
import { getDb } from '../database.js';

const router = express.Router();

// Get current theme settings
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const settings = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM theme_settings WHERE id = 1',
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!settings) {
      return res.json({
        success: true,
        data: {
          palette_index: 0,
          text_color_index: 0,
        },
      });
    }

    res.json({
      success: true,
      data: {
        palette_index: settings.palette_index,
        text_color_index: settings.text_color_index,
      },
    });
  } catch (error) {
    console.error('Get theme error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
});

// Update theme settings (admin only)
router.post('/', async (req, res) => {
  try {
    const { palette_index, text_color_index } = req.body;

    if (palette_index === undefined || text_color_index === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'palette_index and text_color_index are required',
        },
      });
    }

    const db = getDb();
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO theme_settings (id, palette_index, text_color_index, updated_at)
         VALUES (1, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           palette_index = excluded.palette_index,
           text_color_index = excluded.text_color_index,
           updated_at = excluded.updated_at`,
        [palette_index, text_color_index],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    res.json({
      success: true,
      data: {
        palette_index,
        text_color_index,
      },
    });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
});

export default router;

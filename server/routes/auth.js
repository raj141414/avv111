import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { validateAdminLogin } from '../middleware/validation.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin login
router.post('/login', validateAdminLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin by username
    const admin = await Admin.findOne({ username, isActive: true });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          lastLogin: admin.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Verify token
router.get('/verify', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      admin: {
        id: req.admin._id,
        username: req.admin.username
      }
    }
  });
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
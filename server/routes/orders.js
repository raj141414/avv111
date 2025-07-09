import express from 'express';
import Order from '../models/Order.js';
import upload, { handleUploadError } from '../middleware/upload.js';
import { validateOrder, validateStatusUpdate } from '../middleware/validation.js';
import { authenticateAdmin } from '../middleware/auth.js';
import fs from 'fs-extra';
import path from 'path';

const router = express.Router();

// Generate unique order ID
const generateOrderId = () => {
  return `ORD-${Date.now()}`;
};

// Create new order
router.post('/', upload.array('files', 10), handleUploadError, validateOrder, async (req, res) => {
  try {
    console.log('Creating new order...');
    console.log('Request body:', req.body);
    console.log('Uploaded files:', req.files?.map(f => ({ name: f.filename, original: f.originalname, size: f.size })));

    const {
      fullName,
      phoneNumber,
      printType,
      bindingColorType,
      copies,
      paperSize,
      printSide,
      selectedPages,
      colorPages,
      bwPages,
      specialInstructions
    } = req.body;

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one file is required'
      });
    }

    // Process uploaded files
    const files = req.files.map(file => ({
      name: file.filename,
      originalName: file.originalname,
      size: file.size,
      type: file.mimetype,
      path: file.path
    }));

    console.log('Processed files:', files);

    // Calculate total cost (you can implement your pricing logic here)
    let totalCost = 0;
    if (printType !== 'customPrint') {
      // Basic cost calculation - you can enhance this
      const baseCost = printType === 'color' ? 8 : 1.5;
      const pageCount = selectedPages === 'all' ? 10 : 5; // Simplified
      totalCost = baseCost * pageCount * (copies || 1);
      
      if (printType === 'spiralBinding') {
        totalCost += 25;
      } else if (printType === 'softBinding') {
        totalCost += 25;
      }
    }

    // Create order
    const orderData = {
      orderId: generateOrderId(),
      fullName,
      phoneNumber,
      printType,
      bindingColorType,
      copies: copies || 1,
      paperSize: paperSize || 'a4',
      printSide: printSide || 'single',
      selectedPages: selectedPages || 'all',
      colorPages: colorPages || '',
      bwPages: bwPages || '',
      specialInstructions: specialInstructions || '',
      files,
      totalCost,
      status: 'pending'
    };

    console.log('Creating order with data:', orderData);

    const order = new Order(orderData);
    const savedOrder = await order.save();

    console.log('Order saved successfully:', savedOrder._id);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: savedOrder.orderId,
        totalCost: savedOrder.totalCost,
        status: savedOrder.status,
        _id: savedOrder._id
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    
    // Clean up uploaded files if order creation fails
    if (req.files) {
      req.files.forEach(file => {
        fs.remove(file.path).catch(err => console.error('File cleanup error:', err));
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('Searching for order:', orderId);
    
    const order = await Order.findOne({ orderId }).select('-files.path');
    
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('Order found:', order._id);

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all orders (Admin only)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const sortBy = req.query.sortBy || 'orderDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    console.log('Fetching orders with params:', { page, limit, status, sortBy, sortOrder });

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    // Get total count
    const total = await Order.countDocuments(query);
    console.log('Total orders found:', total);

    // Get orders with pagination
    const orders = await Order.find(query)
      .select('-files.path') // Don't expose file paths
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    console.log('Orders retrieved:', orders.length);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update order status (Admin only)
router.patch('/:orderId/status', authenticateAdmin, validateStatusUpdate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log('Updating order status:', { orderId, status });

    const order = await Order.findOneAndUpdate(
      { orderId },
      { status, updatedAt: new Date() },
      { new: true }
    ).select('-files.path');

    if (!order) {
      console.log('Order not found for status update:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('Order status updated successfully:', order._id);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Download file (Admin only)
router.get('/:orderId/files/:fileName', authenticateAdmin, async (req, res) => {
  try {
    const { orderId, fileName } = req.params;

    console.log('File download request:', { orderId, fileName });

    const order = await Order.findOne({ orderId });
    if (!order) {
      console.log('Order not found for file download:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const file = order.files.find(f => f.name === fileName);
    if (!file) {
      console.log('File not found in order:', fileName);
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const filePath = path.resolve(file.path);
    console.log('Attempting to serve file:', filePath);
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      console.log('File not found on disk:', filePath);
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.type);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log('File download started:', fileName);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete order (Admin only)
router.delete('/:orderId', authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log('Deleting order:', orderId);

    const order = await Order.findOne({ orderId });
    if (!order) {
      console.log('Order not found for deletion:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Delete associated files
    for (const file of order.files) {
      try {
        await fs.remove(file.path);
        console.log('File deleted:', file.path);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }
    }

    // Delete order from database
    await Order.deleteOne({ orderId });
    console.log('Order deleted successfully:', orderId);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
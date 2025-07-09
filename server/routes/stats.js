import express from 'express';
import Order from '../models/Order.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics (Admin only)
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get various statistics
    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      monthRevenue
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderDate: { $gte: startOfDay } }),
      Order.countDocuments({ orderDate: { $gte: startOfWeek } }),
      Order.countDocuments({ orderDate: { $gte: startOfMonth } }),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'processing' }),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalCost' } } }
      ]),
      Order.aggregate([
        { 
          $match: { 
            status: 'completed',
            orderDate: { $gte: startOfMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalCost' } } }
      ])
    ]);

    // Get recent orders
    const recentOrders = await Order.find()
      .select('orderId fullName printType status orderDate totalCost')
      .sort({ orderDate: -1 })
      .limit(10);

    // Get orders by print type
    const ordersByType = await Order.aggregate([
      {
        $group: {
          _id: '$printType',
          count: { $sum: 1 },
          revenue: { $sum: '$totalCost' }
        }
      }
    ]);

    // Get daily orders for the last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const dayOrders = await Order.countDocuments({
        orderDate: { $gte: startOfDay, $lt: endOfDay }
      });

      last7Days.push({
        date: startOfDay.toISOString().split('T')[0],
        orders: dayOrders
      });
    }

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          todayOrders,
          weekOrders,
          monthOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          monthRevenue: monthRevenue[0]?.total || 0
        },
        orderStatus: {
          pending: pendingOrders,
          processing: processingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders
        },
        recentOrders,
        ordersByType,
        dailyOrders: last7Days
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics'
    });
  }
});

export default router;
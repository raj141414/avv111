import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  printType: {
    type: String,
    required: true,
    enum: ['blackAndWhite', 'color', 'custom', 'softBinding', 'spiralBinding', 'customPrint']
  },
  bindingColorType: {
    type: String,
    enum: ['blackAndWhite', 'color', 'custom'],
    default: null
  },
  copies: {
    type: Number,
    default: 1,
    min: 1
  },
  paperSize: {
    type: String,
    enum: ['a4', 'a3', 'letter', 'legal'],
    default: 'a4'
  },
  printSide: {
    type: String,
    enum: ['single', 'double'],
    default: 'single'
  },
  selectedPages: {
    type: String,
    default: 'all'
  },
  colorPages: {
    type: String,
    default: ''
  },
  bwPages: {
    type: String,
    default: ''
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  files: [fileSchema],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalCost: {
    type: Number,
    default: 0,
    min: 0
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field before saving
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderDate: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
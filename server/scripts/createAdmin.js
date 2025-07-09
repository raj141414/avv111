import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

const createDefaultAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Default admin already exists');
      process.exit(0);
    }

    // Create default admin
    const admin = new Admin({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'xerox123',
      email: 'admin@aishwaryaxerox.com'
    });

    await admin.save();
    console.log('Default admin created successfully');
    console.log(`Username: ${admin.username}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD || 'xerox123'}`);

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createDefaultAdmin();
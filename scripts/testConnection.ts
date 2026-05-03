import dotenv from 'dotenv';
import { connectDB } from '../lib/mongodb';

// Load environment variables
dotenv.config({ path: '.env.local' });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: '.env' });
}

async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    console.log(`📊 MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Found' : '❌ Not found'}`);
    
    await connectDB();
    console.log('✅ MongoDB connection successful!');
    
    // Test database operations
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collections = await db.listCollections().toArray();
    
    console.log(`📋 Found ${collections.length} collections:`);
    collections.forEach((collection) => {
      console.log(`   - ${collection.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

testConnection();

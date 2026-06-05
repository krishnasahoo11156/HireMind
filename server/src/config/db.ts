import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in environment variables.');
    return;
  }

  // Handle connection events
  mongoose.connection.on('connected', () => {
    console.log('Successfully connected to MongoDB Atlas');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB connection disconnected. Attempting reconnect...');
  });

  try {
    await mongoose.connect(uri, {
      autoIndex: true,
    });
  } catch (error) {
    console.error('Initial MongoDB connection failed:', error);
    // Exit process if unable to establish initial connection in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

import mongoose from 'mongoose';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }

  // Enable strict query and schema behaviors, and disable command buffering when disconnected
  mongoose.set('strict', true);
  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', false);

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

  const maxRetries = 3;
  const retryDelayMs = 5000;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`Attempting MongoDB connection... (Attempt ${attempt}/${maxRetries + 1})`);
      const conn = await mongoose.connect(uri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log('MongoDB connected');
      return conn;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, error);
      if (attempt <= maxRetries) {
        console.log(`Waiting ${retryDelayMs / 1000} seconds before retrying...`);
        await delay(retryDelayMs);
      } else {
        console.error('All MongoDB connection attempts failed.');
        throw error;
      }
    }
  }

  throw new Error('Connection failed');
}

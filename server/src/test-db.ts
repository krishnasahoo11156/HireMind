import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

dotenv.config();

async function runDiagnostics() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("ERROR: MONGODB_URI is not defined in environment variables.");
    process.exit(1);
  }

  // Obfuscate credentials for secure output logging
  const obfuscatedUri = uri.replace(/:([^@]+)@/, ':****@');
  console.log("Starting database diagnostics...");
  console.log(`Using MONGODB_URI: ${obfuscatedUri}`);

  try {
    console.log("Connecting to MongoDB via connectDB...");
    await connectDB();
    console.log("Successfully connected to MongoDB.");

    console.log("Fetching collection list...");
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Mongoose db connection is undefined");
    }

    const collections = await db.listCollections().toArray();
    console.log("Collections in the database:");
    if (collections.length === 0) {
      console.log(" (no collections found)");
    } else {
      collections.forEach((col) => {
        console.log(` - ${col.name}`);
      });
    }

    console.log("Closing database connection...");
    await mongoose.disconnect();
    console.log("Database connection closed. Diagnostics completed successfully.");
    process.exit(0);
  } catch (error: any) {
    console.error("Diagnostics failed with error:", error?.message || error);
    process.exit(1);
  }
}

runDiagnostics();

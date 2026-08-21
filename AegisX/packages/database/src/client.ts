import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri) {
    throw new Error("MONGODB_URI is missing from environment variables.");
  }

  if (!dbName) {
    throw new Error("MONGODB_DB_NAME is missing from environment variables.");
  }

  await mongoose.connect(uri, {
    dbName,
  });

  console.log(`✅ MongoDB connected: ${dbName}`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
const mongoose = require("mongoose");

/**
 * Connect to MongoDB. Works with both a local mongod instance and MongoDB Atlas
 * because the connection string is always read from the environment.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("✖ MONGO_URI is not defined. Copy .env.example to .env and set it.");
    process.exit(1);
  }

  try {
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✔ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`✖ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠ MongoDB disconnected");
  });
};

module.exports = connectDB;

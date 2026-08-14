const mongoose = require("mongoose");

let cachedPromise = null;

async function DBConnect(url) {
  if (!url) {
    throw new Error("MONGO_URL environment variable is missing in server environment");
  }

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(url, {
      serverSelectionTimeoutMS: 10000,
    }).then((m) => {
      console.log("✅ MongoDB is Connected");
      return m;
    }).catch((err) => {
      cachedPromise = null;
      console.error("❌ MongoDB Connection Error:", err.message);
      throw err;
    });
  }

  return cachedPromise;
}

module.exports = DBConnect;

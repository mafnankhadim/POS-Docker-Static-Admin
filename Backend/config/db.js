const mongoose = require("mongoose");

// Cached connection so Vercel serverless invocations reuse one Mongo
// connection across warm calls instead of opening a new one each time.
let cached = global.__mongooseConn;
if (!cached) cached = global.__mongooseConn = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false })
      .then((m) => {
        console.log("MongoDB Connected Successfully");
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error("MongoDB Connection Failed:", err.message);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;

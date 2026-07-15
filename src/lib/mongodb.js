// src/lib/mongodb.js
// Next.js-friendly Mongoose connection singleton.
// Replaces the one-shot `mongoose.connect(...)` call that used to sit at the
// top of the old Express app.js. In Next.js, route handler modules can be
// invoked many times (hot reload in dev, multiple lambda invocations in
// prod), so we cache the connection promise on `global` to avoid opening a
// new connection on every request.

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'YOUR_MONGODB_URI_HERE';

if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}
const cache = global._mongooseCache;

export async function connectToDatabase() {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    console.log(
      'MONGODB_URI config status:',
      MONGODB_URI && !MONGODB_URI.includes('YOUR_MONGODB_URI_HERE')
        ? 'using env'
        : 'MONGODB_URI not set - edit .env.local'
    );

    cache.promise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
      })
      .then((m) => {
        console.log('MongoDB connected successfully');
        return m;
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

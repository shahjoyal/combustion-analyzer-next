// src/lib/models.js
// Same schemas as the original app.js. Kept as flexible/strict:false for
// Coal (existing heterogeneous 'coals' collection) and a normal schema for
// User (trial/subscription tracking).

import mongoose from 'mongoose';

const flexibleSchema = new mongoose.Schema({}, { strict: false });

// Force Coal model to use 'coals' collection (as in the original DB)
export function getCoalModel() {
  return mongoose.models.Coal || mongoose.model('Coal', flexibleSchema, 'coals');
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    trialsLeft: { type: Number, default: 5 },
    lockedUntil: { type: Date, default: null },
    lastIP: { type: String, default: null },
    ipHistory: [{ ip: String, when: Date }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export function getUserModel() {
  return mongoose.models.User || mongoose.model('User', userSchema);
}

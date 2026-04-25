const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true, default: '' },
    photoURL: { type: String, default: '' },
    isAdmin: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    lastLogin: { type: Date, default: Date.now },
    budgetAlerts: { type: Boolean, default: true },
    emiReminders: { type: Boolean, default: true },
    fdAlerts: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');

// POST /api/auth/login — called after Firebase sign-in to sync user
router.post('/login', authLimiter, protect, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      _id: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
      isAdmin: user.isAdmin,
      lastLogin: user.lastLogin,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = req.user;
  res.json({
    _id: user._id,
    firebaseUid: user.firebaseUid,
    email: user.email,
    name: user.name,
    photoURL: user.photoURL,
    isAdmin: user.isAdmin,
    budgetAlerts: user.budgetAlerts,
    emiReminders: user.emiReminders,
    fdAlerts: user.fdAlerts,
    createdAt: user.createdAt,
  });
});

// PATCH /api/auth/profile
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, budgetAlerts, emiReminders, fdAlerts } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim().substring(0, 100);
    if (budgetAlerts !== undefined) update.budgetAlerts = budgetAlerts;
    if (emiReminders !== undefined) update.emiReminders = emiReminders;
    if (fdAlerts !== undefined) update.fdAlerts = fdAlerts;

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    }).select('-__v');

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

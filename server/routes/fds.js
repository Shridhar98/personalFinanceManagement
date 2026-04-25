const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const FD = require('../models/FD');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/fds
router.get('/', protect, async (req, res) => {
  try {
    const { isMatured } = req.query;
    const filter = { user: req.user._id };
    if (isMatured !== undefined) filter.isMatured = isMatured === 'true';

    const fds = await FD.find(filter).sort({ maturityDate: 1 });
    res.json(fds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/fds/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const fds = await FD.find({ user: req.user._id });
    let totalPrincipal = 0;
    let totalMaturityAmount = 0;
    let totalInterestEarned = 0;
    const upcomingMaturities = [];
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const fd of fds) {
      totalPrincipal += fd.principalAmount;
      totalMaturityAmount += fd.estimatedMaturityAmount;
      totalInterestEarned += fd.interestEarned;
      if (fd.maturityDate <= thirtyDaysLater && fd.maturityDate >= now && !fd.isMatured) {
        upcomingMaturities.push({
          _id: fd._id,
          bankName: fd.bankName,
          principalAmount: fd.principalAmount,
          maturityDate: fd.maturityDate,
          estimatedMaturityAmount: fd.estimatedMaturityAmount,
        });
      }
    }

    res.json({ totalPrincipal, totalMaturityAmount, totalInterestEarned, upcomingMaturities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/fds
router.post('/',
  protect,
  [
    body('bankName').notEmpty(),
    body('principalAmount').isFloat({ min: 1 }),
    body('interestRate').isFloat({ min: 0, max: 100 }),
    body('startDate').isISO8601(),
    body('maturityDate').isISO8601(),
  ],
  validate,
  async (req, res) => {
    try {
      const { bankName, principalAmount, interestRate, startDate, maturityDate, compoundingFrequency, notes } = req.body;

      if (new Date(maturityDate) <= new Date(startDate)) {
        return res.status(400).json({ message: 'Maturity date must be after start date' });
      }

      const fd = await FD.create({
        user: req.user._id,
        bankName: bankName.substring(0, 100),
        principalAmount,
        interestRate,
        startDate: new Date(startDate),
        maturityDate: new Date(maturityDate),
        compoundingFrequency,
        notes: notes?.substring(0, 500),
      });
      res.status(201).json(fd);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// PUT /api/fds/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const fd = await FD.findOne({ _id: req.params.id, user: req.user._id });
    if (!fd) return res.status(404).json({ message: 'FD not found' });

    const fields = ['bankName', 'principalAmount', 'interestRate', 'compoundingFrequency', 'isMatured', 'notes'];
    for (const field of fields) {
      if (req.body[field] !== undefined) fd[field] = req.body[field];
    }
    if (req.body.startDate) fd.startDate = new Date(req.body.startDate);
    if (req.body.maturityDate) fd.maturityDate = new Date(req.body.maturityDate);

    await fd.save();
    res.json(fd);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/fds/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const fd = await FD.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!fd) return res.status(404).json({ message: 'FD not found' });
    res.json({ message: 'FD deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Income = require('../models/Income');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/income
router.get('/', protect, async (req, res) => {
  try {
    const { month, year, startDate, endDate, source, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (month && year) {
      filter.date = { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59) };
    } else if (year) {
      filter.date = { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) };
    }

    if (source) filter.source = source;

    const skip = (Number(page) - 1) * Number(limit);
    const [incomes, total] = await Promise.all([
      Income.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Income.countDocuments(filter),
    ]);

    res.json({ incomes, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/income/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (month && year) {
      filter.date = { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59) };
    }

    const [sourceSummary, totalResult] = await Promise.all([
      Income.aggregate([
        { $match: filter },
        { $group: { _id: '$source', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Income.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({ total: totalResult[0]?.total || 0, sourceBreakdown: sourceSummary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/income/monthly-trend
router.get('/monthly-trend', protect, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const trend = await Income.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) },
        },
      },
      { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' } } },
      { $sort: { '_id': 1 } },
    ]);
    res.json(trend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/income
router.post('/',
  protect,
  [
    body('amount').isFloat({ min: 0.01 }),
    body('source').notEmpty(),
    body('date').isISO8601(),
  ],
  validate,
  async (req, res) => {
    try {
      const { amount, source, date, notes, isRecurring, recurringFrequency } = req.body;
      const income = await Income.create({
        user: req.user._id,
        amount,
        source,
        date: new Date(date),
        notes: notes?.substring(0, 500),
        isRecurring,
        recurringFrequency,
      });
      res.status(201).json(income);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// PUT /api/income/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, user: req.user._id });
    if (!income) return res.status(404).json({ message: 'Income record not found' });

    const { amount, source, date, notes, isRecurring, recurringFrequency } = req.body;
    if (amount !== undefined) income.amount = amount;
    if (source !== undefined) income.source = source;
    if (date !== undefined) income.date = new Date(date);
    if (notes !== undefined) income.notes = notes?.substring(0, 500);
    if (isRecurring !== undefined) income.isRecurring = isRecurring;
    if (recurringFrequency !== undefined) income.recurringFrequency = recurringFrequency;

    await income.save();
    res.json(income);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/income/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!income) return res.status(404).json({ message: 'Income record not found' });
    res.json({ message: 'Income record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

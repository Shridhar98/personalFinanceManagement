const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { body, query, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/expenses
router.get('/', protect, async (req, res) => {
  try {
    const { month, year, startDate, endDate, category, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    } else if (year) {
      filter.date = { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) };
    }

    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Expense.countDocuments(filter),
    ]);

    res.json({ expenses, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/expenses/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    const [categorySummary, totalResult] = await Promise.all([
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    // Check budget alerts for current month if applicable
    let budgetAlerts = [];
    if (month && year) {
      const budgets = await Budget.find({ user: req.user._id, month: Number(month), year: Number(year) });
      for (const budget of budgets) {
        const catExpense = categorySummary.find((c) => c._id === budget.category);
        const spent = catExpense ? catExpense.total : 0;
        if (spent >= budget.limitAmount * 0.8) {
          budgetAlerts.push({
            category: budget.category,
            limit: budget.limitAmount,
            spent,
            percentage: ((spent / budget.limitAmount) * 100).toFixed(1),
          });
        }
      }
    }

    res.json({
      total: totalResult[0]?.total || 0,
      categoryBreakdown: categorySummary,
      budgetAlerts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/expenses/monthly-trend
router.get('/monthly-trend', protect, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const trend = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: start, $lte: end } } },
      { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' } } },
      { $sort: { '_id': 1 } },
    ]);

    res.json(trend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/expenses
router.post('/',
  protect,
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').isISO8601().withMessage('Valid date required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { amount, category, date, notes, isRecurring, recurringFrequency, budgetLimit } = req.body;
      const expense = await Expense.create({
        user: req.user._id,
        amount,
        category,
        date: new Date(date),
        notes: notes?.substring(0, 500),
        isRecurring,
        recurringFrequency,
        budgetLimit,
      });
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// PUT /api/expenses/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const { amount, category, date, notes, isRecurring, recurringFrequency, budgetLimit } = req.body;
    if (amount !== undefined) expense.amount = amount;
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = new Date(date);
    if (notes !== undefined) expense.notes = notes?.substring(0, 500);
    if (isRecurring !== undefined) expense.isRecurring = isRecurring;
    if (recurringFrequency !== undefined) expense.recurringFrequency = recurringFrequency;
    if (budgetLimit !== undefined) expense.budgetLimit = budgetLimit;

    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Budget routes
// GET /api/expenses/budgets
router.get('/budgets', protect, async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    const budgets = await Budget.find({ user: req.user._id, month: Number(month), year: Number(year) });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/expenses/budgets
router.post('/budgets', protect, async (req, res) => {
  try {
    const { category, limitAmount, month, year } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month: Number(month), year: Number(year) },
      { limitAmount: Number(limitAmount) },
      { upsert: true, new: true }
    );
    res.status(201).json(budget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

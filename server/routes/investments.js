const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Investment = require('../models/Investment');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/investments
router.get('/', protect, async (req, res) => {
  try {
    const { type, isSold } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (isSold !== undefined) filter.isSold = isSold === 'true';

    const investments = await Investment.find(filter).sort({ buyDate: -1 });
    res.json(investments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/investments/portfolio-summary
router.get('/portfolio-summary', protect, async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user._id, isSold: false });

    let totalInvested = 0;
    let totalCurrentValue = 0;
    const allocation = {};

    for (const inv of investments) {
      totalInvested += inv.investedAmount;
      totalCurrentValue += inv.currentValue;
      allocation[inv.type] = (allocation[inv.type] || 0) + inv.currentValue;
    }

    res.json({
      totalInvested,
      totalCurrentValue,
      totalProfitLoss: totalCurrentValue - totalInvested,
      profitLossPercentage: totalInvested ? (((totalCurrentValue - totalInvested) / totalInvested) * 100).toFixed(2) : 0,
      allocation: Object.entries(allocation).map(([type, value]) => ({ type, value })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/investments
router.post('/',
  protect,
  [
    body('name').notEmpty().withMessage('Investment name required'),
    body('type').notEmpty(),
    body('quantity').isFloat({ min: 0.000001 }),
    body('buyPrice').isFloat({ min: 0 }),
    body('buyDate').isISO8601(),
  ],
  validate,
  async (req, res) => {
    try {
      const { type, name, ticker, quantity, buyPrice, currentPrice, buyDate, notes } = req.body;
      const investment = await Investment.create({
        user: req.user._id,
        type,
        name: name.substring(0, 100),
        ticker,
        quantity,
        buyPrice,
        currentPrice: currentPrice || null,
        buyDate: new Date(buyDate),
        notes: notes?.substring(0, 500),
      });
      res.status(201).json(investment);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// PUT /api/investments/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const investment = await Investment.findOne({ _id: req.params.id, user: req.user._id });
    if (!investment) return res.status(404).json({ message: 'Investment not found' });

    const fields = ['type', 'name', 'ticker', 'quantity', 'buyPrice', 'currentPrice',
                    'buyDate', 'sellPrice', 'sellDate', 'isSold', 'notes'];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        investment[field] = field === 'buyDate' || field === 'sellDate'
          ? new Date(req.body[field])
          : req.body[field];
      }
    }

    await investment.save();
    res.json(investment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/investments/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const investment = await Investment.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!investment) return res.status(404).json({ message: 'Investment not found' });
    res.json({ message: 'Investment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

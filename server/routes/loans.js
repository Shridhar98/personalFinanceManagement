const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Loan = require('../models/Loan');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/loans
router.get('/', protect, async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = { user: req.user._id };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const loans = await Loan.find(filter).sort({ endDate: 1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/loans/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user._id, isActive: true });
    let totalPrincipal = 0;
    let totalOutstanding = 0;
    let monthlyEMI = 0;

    for (const loan of loans) {
      totalPrincipal += loan.principalAmount;
      totalOutstanding += loan.outstandingAmount;
      monthlyEMI += loan.emiAmount;
    }

    const upcomingEMIs = loans
      .filter((l) => l.nextEmiDate)
      .sort((a, b) => a.nextEmiDate - b.nextEmiDate)
      .slice(0, 5)
      .map((l) => ({
        _id: l._id,
        loanType: l.loanType,
        lenderName: l.lenderName,
        emiAmount: l.emiAmount,
        nextEmiDate: l.nextEmiDate,
      }));

    res.json({ totalPrincipal, totalOutstanding, monthlyEMI, upcomingEMIs, activeLoans: loans.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/loans
router.post('/',
  protect,
  [
    body('loanType').notEmpty(),
    body('lenderName').notEmpty(),
    body('principalAmount').isFloat({ min: 1 }),
    body('interestRate').isFloat({ min: 0 }),
    body('emiAmount').isFloat({ min: 1 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
  ],
  validate,
  async (req, res) => {
    try {
      const { loanType, lenderName, principalAmount, interestRate, emiAmount,
              startDate, endDate, amountPaid, nextEmiDate, notes } = req.body;

      const loan = await Loan.create({
        user: req.user._id,
        loanType,
        lenderName: lenderName.substring(0, 100),
        principalAmount,
        interestRate,
        emiAmount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        amountPaid: amountPaid || 0,
        nextEmiDate: nextEmiDate ? new Date(nextEmiDate) : undefined,
        notes: notes?.substring(0, 500),
      });
      res.status(201).json(loan);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// PUT /api/loans/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, user: req.user._id });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    const fields = ['loanType', 'lenderName', 'principalAmount', 'interestRate',
                    'emiAmount', 'amountPaid', 'isActive', 'notes'];
    for (const field of fields) {
      if (req.body[field] !== undefined) loan[field] = req.body[field];
    }
    if (req.body.startDate) loan.startDate = new Date(req.body.startDate);
    if (req.body.endDate) loan.endDate = new Date(req.body.endDate);
    if (req.body.nextEmiDate) loan.nextEmiDate = new Date(req.body.nextEmiDate);

    await loan.save();
    res.json(loan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/loans/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const loan = await Loan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    res.json({ message: 'Loan deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

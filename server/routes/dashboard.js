const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Investment = require('../models/Investment');
const FD = require('../models/FD');
const Loan = require('../models/Loan');

// GET /api/dashboard/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Run all aggregates in parallel
    const [
      monthlyExpenseResult,
      monthlyIncomeResult,
      lastMonthExpenseResult,
      lastMonthIncomeResult,
      investments,
      fds,
      loans,
      recentExpenses,
      recentIncomes,
    ] = await Promise.all([
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Income.aggregate([
        { $match: { user: userId, date: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Income.aggregate([
        { $match: { user: userId, date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Investment.find({ user: userId, isSold: false }),
      FD.find({ user: userId, isMatured: false }),
      Loan.find({ user: userId, isActive: true }),
      Expense.find({ user: userId }).sort({ date: -1 }).limit(5),
      Income.find({ user: userId }).sort({ date: -1 }).limit(5),
    ]);

    const monthlyExpense = monthlyExpenseResult[0]?.total || 0;
    const monthlyIncome = monthlyIncomeResult[0]?.total || 0;
    const lastMonthExpense = lastMonthExpenseResult[0]?.total || 0;
    const lastMonthIncome = lastMonthIncomeResult[0]?.total || 0;

    // Portfolio
    let totalInvested = 0;
    let totalPortfolioValue = 0;
    for (const inv of investments) {
      totalInvested += inv.investedAmount;
      totalPortfolioValue += inv.currentValue;
    }

    // FD total
    let totalFDPrincipal = 0;
    let totalFDMaturity = 0;
    for (const fd of fds) {
      totalFDPrincipal += fd.principalAmount;
      totalFDMaturity += fd.estimatedMaturityAmount;
    }

    // Loans
    let totalOutstandingLoans = 0;
    let monthlyEMI = 0;
    for (const loan of loans) {
      totalOutstandingLoans += loan.outstandingAmount;
      monthlyEMI += loan.emiAmount;
    }

    // Net Worth = (Income + Portfolio + FD) - (Outstanding Loans)
    const totalAssets = totalPortfolioValue + totalFDPrincipal;
    const netWorth = totalAssets - totalOutstandingLoans;
    const monthlySavings = monthlyIncome - monthlyExpense;

    res.json({
      monthly: {
        income: monthlyIncome,
        expense: monthlyExpense,
        savings: monthlySavings,
      },
      lastMonth: {
        income: lastMonthIncome,
        expense: lastMonthExpense,
        savings: lastMonthIncome - lastMonthExpense,
      },
      investments: {
        totalInvested,
        totalCurrentValue: totalPortfolioValue,
        profitLoss: totalPortfolioValue - totalInvested,
      },
      fds: {
        totalPrincipal: totalFDPrincipal,
        totalMaturityValue: totalFDMaturity,
        count: fds.length,
      },
      loans: {
        totalOutstanding: totalOutstandingLoans,
        monthlyEMI,
        count: loans.length,
      },
      netWorth,
      recentTransactions: [
        ...recentExpenses.map((e) => ({ ...e.toObject(), transactionType: 'expense' })),
        ...recentIncomes.map((i) => ({ ...i.toObject(), transactionType: 'income' })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/dashboard/income-vs-expense
router.get('/income-vs-expense', protect, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    const userId = req.user._id;

    const [expenseTrend, incomeTrend] = await Promise.all([
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: start, $lte: end } } },
        { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' } } },
        { $sort: { '_id': 1 } },
      ]),
      Income.aggregate([
        { $match: { user: userId, date: { $gte: start, $lte: end } } },
        { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' } } },
        { $sort: { '_id': 1 } },
      ]),
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((month, i) => ({
      month,
      income: incomeTrend.find((t) => t._id === i + 1)?.total || 0,
      expense: expenseTrend.find((t) => t._id === i + 1)?.total || 0,
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    source: {
      type: String,
      required: true,
      enum: ['Salary', 'Freelance', 'Passive', 'Business', 'Rental', 'Dividend',
             'Bonus', 'Gift', 'Other'],
    },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', null],
      default: null,
    },
  },
  { timestamps: true }
);

incomeSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Income', incomeSchema);

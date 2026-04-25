const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['Stock', 'MutualFund', 'ETF', 'Crypto', 'Gold', 'RealEstate', 'Other'],
    },
    name: { type: String, required: true, trim: true },
    ticker: { type: String, trim: true, uppercase: true, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    buyPrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, default: null },
    buyDate: { type: Date, required: true },
    sellPrice: { type: Number, default: null },
    sellDate: { type: Date, default: null },
    isSold: { type: Boolean, default: false },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

investmentSchema.virtual('investedAmount').get(function () {
  return this.quantity * this.buyPrice;
});

investmentSchema.virtual('currentValue').get(function () {
  if (this.isSold && this.sellPrice) return this.quantity * this.sellPrice;
  return this.currentPrice ? this.quantity * this.currentPrice : this.quantity * this.buyPrice;
});

investmentSchema.virtual('profitLoss').get(function () {
  return this.currentValue - this.investedAmount;
});

investmentSchema.set('toJSON', { virtuals: true });
investmentSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Investment', investmentSchema);

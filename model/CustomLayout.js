const mongoose = require('mongoose');

const customLayoutSchema = new mongoose.Schema({
  restaurantId: {
    type: String,
    required: true,
    index: true
  },
  layout: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
customLayoutSchema.index({ restaurantId: 1 }, { unique: true });

module.exports = mongoose.model('CustomLayout', customLayoutSchema);


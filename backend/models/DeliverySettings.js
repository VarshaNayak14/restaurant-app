const mongoose = require('mongoose')

// Single-document settings — always upsert by key "main"
const deliverySettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },

    // Flat delivery charge (₹) applied when subtotal is below the free-delivery threshold
    deliveryFee: { type: Number, default: 49, min: 0 },

    // Order subtotal (₹) at or above which delivery becomes FREE
    freeDeliveryThreshold: { type: Number, default: 499, min: 0 },

    // Master switch — if false, delivery is always free regardless of subtotal
    freeDeliveryEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('DeliverySettings', deliverySettingsSchema)
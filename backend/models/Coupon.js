const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description:   { type: String, default: '' },

  discountType:  { type: String, enum: ['percentage', 'flat'], required: true },
  discountValue: { type: Number, required: true, min: 0 },

  // Sirf percentage type ke liye — max ₹ discount cap (optional)
  maxDiscount:   { type: Number, default: null },

  // Coupon apply hone ke liye minimum cart subtotal
  minOrderValue: { type: Number, default: 0 },

  // Agar khaali array hai to coupon poore cart pe chalega.
  // Agar dishes select ki hain, to discount SIRF un dishes ke subtotal pe lagega.
  applicableDishes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dish' }],

  // Total kitni baar coupon use ho sakta hai (null = unlimited)
  usageLimit:    { type: Number, default: null },
  usedCount:     { type: Number, default: 0 },

  // Ek user kitni baar use kar sakta hai
  perUserLimit:  { type: Number, default: 1 },
  usedBy:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  expiryDate:    { type: Date, required: true },
  active:        { type: Boolean, default: true },

  // Agar true, coupon site ke public "Offers" section me dikhega (copy-code ke saath).
  // Agar false, coupon sirf tab kaam karega jab customer ko code kahin aur se pata ho.
  isPublic:      { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Coupon', couponSchema)
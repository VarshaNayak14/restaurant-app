const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  id:    { type: String, required: true },
  name:  { type: String, required: true },
  price: { type: Number, required: true },
  qty:   { type: Number, required: true, min: 1 },
  image: { type: String },
  desc:  { type: String },
  cat:   { type: String },
}, { _id: false })

const addressSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  city:  { type: String, required: true },
  pin:   { type: String, required: true },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    default: () => 'HH' + Date.now() + Math.floor(Math.random() * 1000),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName:  { type: String },
  userEmail: { type: String },

  items:    { type: [orderItemSchema], required: true },
  address:  { type: addressSchema,   required: true },
  payment:  { type: String, enum: ['card', 'upi', 'wallet', 'cod'], required: true },

  subtotal: { type: Number, required: true },
  delivery: { type: Number, default: 0 },
  tax:      { type: Number, default: 0 },

  /* ── Coupon fields ── */
  couponCode: { type: String, default: null },
  discount:   { type: Number, default: 0 },

  total:    { type: Number, required: true },

  /* ── Razorpay fields ── */
  razorpayOrderId:   { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },

  status: {
    type: String,
    enum: ['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'confirmed',
  },
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema)
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const cartItemSchema = new mongoose.Schema({
  id:    { type: String, required: true },
  name:  { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  desc:  { type: String },
  cat:   { type: String },
  qty:   { type: Number, required: true, min: 1, default: 1 },
}, { _id: false })

const wishlistItemSchema = new mongoose.Schema({
  id:    { type: String, required: true },
  name:  { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  desc:  { type: String },
  cat:   { type: String },
}, { _id: false })

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    orders: {
      type: Array,
      default: [],
    },
    // ─── NEW: persistent cart & wishlist ───
    cart: {
      type: [cartItemSchema],
      default: [],
    },
    wishlist: {
      type: [wishlistItemSchema],
      default: [],
    },
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
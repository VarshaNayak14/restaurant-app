const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: { type: String },

  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },

  // Dish identifier as stored on the order item (order.items[].id)
  dishId:   { type: String, required: true },
  dishName: { type: String, required: true },
  dishImage:{ type: String },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  tasteRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  images: {
    type: [String], // base64 data URLs or hosted URLs
    default: [],
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
}, { timestamps: true })

// A user can review a given dish only once per order
reviewSchema.index({ user: 1, order: 1, dishId: 1 }, { unique: true })

module.exports = mongoose.model('Review', reviewSchema)
const mongoose = require('mongoose')

const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Dish name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be greater than 0'],
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
    },
    cat: {
      // Free text so admin can use any category (e.g. "South Indian", "Momos", "Desserts")
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    tag: {
      type: String,
      required: true,
      enum: ['Veg', 'Non-Veg'],
      default: 'Veg',
    },
    spice: {
      type: Number,
      min: 0,
      max: 4,
      default: 0,
    },
    desc: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    bestseller: {
      type: Boolean,
      default: false,
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      default: 0,
    },
    isAvailable: {
      // Lets admin mark a dish "out of stock" without deleting it
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

dishSchema.index({ cat: 1 })

module.exports = mongoose.model('Dish', dishSchema)
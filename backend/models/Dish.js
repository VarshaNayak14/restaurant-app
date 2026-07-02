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
      type: String,
      required: [true, 'Category is required'],
      enum: ['Starters', 'Main Course', 'Rice & Biryani', 'Breads', 'Desserts', 'Drinks'],
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
      // Optional flat ₹ amount cut from price. 0 / empty = no offer on this dish.
      type: Number,
      min: [0, 'Discount cannot be negative'],
      default: 0,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Dish', dishSchema)
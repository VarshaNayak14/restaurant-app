const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    img:   { type: String, required: true },
    link:  { type: String, default: '/menu' },
    order: { type: Number, default: 0 },
    active:{ type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Category', categorySchema)
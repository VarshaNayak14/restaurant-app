const mongoose = require('mongoose')

const testimonialSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true },
    role:   { type: String, required: true, trim: true },
    img:    { type: String, required: true },
    text:   { type: String, required: true, trim: true },
    stars:  { type: Number, min: 1, max: 5, default: 5 },
    active: { type: Boolean, default: true },
    order:  { type: Number, default: 0 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Testimonial', testimonialSchema)
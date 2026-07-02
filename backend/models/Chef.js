const mongoose = require('mongoose')

const chefSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    role:       { type: String, required: true, trim: true },
    img:        { type: String, required: true },
    facebook:   { type: String, default: '#' },
    instagram:  { type: String, default: '#' },
    twitter:    { type: String, default: '#' },
    youtube:    { type: String, default: '#' },
    order:      { type: Number, default: 0 },
    active:     { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Chef', chefSchema)
const mongoose = require('mongoose')

const gallerySchema = new mongoose.Schema(
  {
    label:    { type: String, required: true, trim: true },
    src:      { type: String, required: true },
    related:  [{ type: String }],
    order:    { type: Number, default: 0 },
    active:   { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Gallery', gallerySchema)
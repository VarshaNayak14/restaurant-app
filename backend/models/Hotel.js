const mongoose = require('mongoose')

const hotelSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    city:          { type: String, required: true, trim: true },
    address:       { type: String, default: '', trim: true },
    description:   { type: String, default: '' },
    image:         { type: String, default: '' },     // cover image (cards + first gallery photo)
    pricePerNight: { type: Number, required: true, min: 0 },
    rating:        { type: Number, default: 4, min: 0, max: 5 },   // admin value until guests review; then the average of reviews
    reviewCount:   { type: Number, default: 0 },
    baseRating:    { type: Number },                              // admin rating saved when the first review arrives
    totalRooms:    { type: Number, default: 10, min: 0 },
    amenities:     { type: [String], default: [] },
    isActive:      { type: Boolean, default: true },

    /* ── Detail page content (all set from Admin → Hotels) ── */
    images:        { type: [String], default: [] },   // extra gallery photos
    highlights:    { type: [String], default: [] },   // "Rooftop infinity pool", …
    policies:      { type: [String], default: [] },   // house rules
    nearby:        { type: [String], default: [] },   // "Calangute Beach — 300 m"
    checkInTime:   { type: String, default: '12:00 PM' },
    checkOutTime:  { type: String, default: '11:00 AM' },
    phone:         { type: String, default: '' },
    email:         { type: String, default: '' },
    mapEmbed:      { type: String, default: '' },     // Google Maps "embed" URL
  },
  { timestamps: true }
)
module.exports = mongoose.model('Hotel', hotelSchema)
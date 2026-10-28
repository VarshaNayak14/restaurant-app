const mongoose = require('mongoose')

const hotelReviewSchema = new mongoose.Schema({
  hotel:    { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  booking:  { type: mongoose.Schema.Types.ObjectId, ref: 'HotelBooking', required: true, unique: true }, // one review per booking
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, default: 'Guest' },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  comment:  { type: String, trim: true, maxlength: 1000, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('HotelReview', hotelReviewSchema)
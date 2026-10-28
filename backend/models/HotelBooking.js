const mongoose = require('mongoose')

const hotelBookingSchema = new mongoose.Schema(
  {
    hotel:       { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    hotelName:   { type: String, default: '' },   // snapshot — name still shows if the hotel is deleted
    name:        { type: String, required: true, trim: true },
    email:       { type: String, required: true, trim: true, lowercase: true },
    phone:       { type: String, trim: true, default: '' },
    checkIn:     { type: String, required: true },
    checkOut:    { type: String, required: true },
    guests:      { type: Number, default: 2, min: 1 },
    rooms:       { type: Number, default: 1, min: 1 },
    nights:      { type: Number, default: 1 },
    totalAmount: { type: Number, default: 0 },
    message:     { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
)
module.exports = mongoose.model('HotelBooking', hotelBookingSchema)

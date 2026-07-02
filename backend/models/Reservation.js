const mongoose = require('mongoose')

const reservationSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, trim: true, lowercase: true },
    phone:    { type: String, trim: true, default: '' },
    guests:   { type: String, default: '2' },
    date:     { type: String, required: true },
    message:  { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
)
module.exports = mongoose.model('Reservation', reservationSchema)
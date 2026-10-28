const mongoose = require('mongoose')

/*
  A cab booking can be one of 3 kinds:
   - linkedType 'restaurant' → with a table reservation (linkedId = Reservation._id)
   - linkedType 'hotel'      → with a hotel booking      (linkedId = HotelBooking._id)
   - linkedType 'none'       → standalone cab booking (from the /cabs page)

  tripType:
   - 'pickup' → from the customer's home to the venue
   - 'drop'   → from the venue back to the customer's home
   - 'round'  → both (pickup + return)
*/
const cabBookingSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },

    linkedType:  { type: String, enum: ['restaurant', 'hotel', 'none'], default: 'none' },
    linkedModel: { type: String, enum: ['Reservation', 'HotelBooking'] },
    linkedId:    { type: mongoose.Schema.Types.ObjectId, refPath: 'linkedModel' },
    venueName:   { type: String, default: '' },

    tripType: { type: String, enum: ['pickup', 'drop', 'round'], default: 'pickup' },
    carType:  { type: String, enum: ['auto', 'mini', 'sedan', 'suv'], default: 'mini' },

    pickupAddress: { type: String, required: true, trim: true },
    dropAddress:   { type: String, required: true, trim: true },
    pickupTime:    { type: String, default: '' },   // time to go
    returnTime:    { type: String, default: '' },   // time to return
    passengers:    { type: Number, default: 1, min: 1 },
    distanceKm:    { type: Number, default: 5, min: 1 },
    estimatedFare: { type: Number, default: 0 },
    message:       { type: String, default: '' },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'assigned', 'completed', 'cancelled'],
      default: 'pending',
    },
    driverName:    { type: String, default: '' },
    driverPhone:   { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    adminNote:     { type: String, default: '' },
  },
  { timestamps: true }
)
module.exports = mongoose.model('CabBooking', cabBookingSchema)

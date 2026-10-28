const express = require('express')
const router  = express.Router()
const { protect, adminOnly } = require('../middleware/auth')
const Hotel        = require('../models/Hotel')
const HotelBooking = require('../models/HotelBooking')
const HotelReview  = require('../models/HotelReview')

/* A booking can be reviewed once the guest has checked out:
   booking confirmed (or completed) AND the check-out date has arrived. */
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const canReview = b => ['confirmed', 'completed'].includes(b.status) && String(b.checkOut).slice(0, 10) <= todayStr()

/* Recalculate the hotel's rating from its reviews.
   Before the first review the admin-set rating is kept (saved as baseRating),
   and it comes back if every review is removed. */
async function recalc(hotelId) {
  const hotel = await Hotel.findById(hotelId)
  if (!hotel) return
  const [agg] = await HotelReview.aggregate([
    { $match: { hotel: hotel._id } },
    { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } },
  ])
  if (agg) {
    if (!hotel.reviewCount) hotel.baseRating = hotel.rating
    hotel.rating      = Math.round(agg.avg * 10) / 10
    hotel.reviewCount = agg.n
  } else {
    if (hotel.reviewCount && hotel.baseRating != null) hotel.rating = hotel.baseRating
    hotel.reviewCount = 0
  }
  await hotel.save()
}

/* PUBLIC — GET /api/hotel-reviews/hotel/:hotelId */
router.get('/hotel/:hotelId', async (req, res) => {
  try {
    const reviews = await HotelReview.find({ hotel: req.params.hotelId })
      .sort({ createdAt: -1 }).select('userName rating comment createdAt').lean()
    const count = reviews.length
    const avg   = count ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / count * 10) / 10 : 0
    res.json({ success: true, data: { reviews, count, avg } })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

/* CUSTOMER — POST /api/hotel-reviews   { bookingId, rating, comment } */
router.post('/', protect, async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body
    const booking = await HotelBooking.findById(bookingId)
    if (!booking || booking.email !== String(req.user.email).toLowerCase())
      return res.status(404).json({ success: false, error: 'Booking not found.' })
    if (!canReview(booking))
      return res.status(400).json({ success: false, error: 'You can review a hotel after your check-out.' })
    const r = Number(rating)
    if (!(r >= 1 && r <= 5))
      return res.status(400).json({ success: false, error: 'Please choose a rating from 1 to 5.' })
    if (await HotelReview.findOne({ booking: booking._id }))
      return res.status(400).json({ success: false, error: 'You have already reviewed this stay.' })

    const review = await HotelReview.create({
      hotel: booking.hotel, booking: booking._id, user: req.user._id,
      userName: req.user.name || booking.name, rating: Math.round(r), comment,
    })
    await recalc(booking.hotel)
    res.status(201).json({ success: true, data: review })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

/* ADMIN — DELETE /api/hotel-reviews/:id  (remove an inappropriate review) */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const doc = await HotelReview.findByIdAndDelete(req.params.id)
    if (doc) await recalc(doc.hotel)
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

module.exports = router
module.exports.canReview = canReview
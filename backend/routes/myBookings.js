const express  = require('express')
const router   = express.Router()
const { protect, hasPermission } = require('../middleware/auth')
const Reservation  = require('../models/Reservation')
const HotelBooking = require('../models/HotelBooking')
const CabBooking   = require('../models/CabBooking')
const HotelReview  = require('../models/HotelReview')
const { canReview } = require('./hotelReviews')

/*
  Customer's own bookings — matched by the logged-in user's email
  (bookings are made with an email, so this also picks up bookings
  made before the user logged in with the same email).
*/
function emailFilter(user) {
  const escaped = String(user.email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return { email: new RegExp(`^${escaped}$`, 'i') }
}

function attachCabs(list, cabs) {
  const byId = {}
  cabs.forEach(c => { if (c.linkedId) byId[String(c.linkedId)] = c })
  return list.map(d => ({ ...d, cab: byId[String(d._id)] || null }))
}

/* ══════════════════════════════════════
   GET /api/my-bookings
══════════════════════════════════════ */
router.get('/', protect, async (req, res) => {
  try {
    const filter = emailFilter(req.user)
    const [reservations, hotelBookings, cabs] = await Promise.all([
      Reservation.find(filter).sort({ createdAt: -1 }).lean(),
      HotelBooking.find(filter).sort({ createdAt: -1 }).lean(),
      CabBooking.find(filter).sort({ createdAt: -1 }).lean(),
    ])

    // Attach review info so the customer can rate a stay after check-out
    const reviews = await HotelReview.find({ booking: { $in: hotelBookings.map(b => b._id) } }).select('booking rating comment').lean()
    const reviewByBooking = {}
    reviews.forEach(r => { reviewByBooking[String(r.booking)] = r })
    hotelBookings.forEach(b => { b.review = reviewByBooking[String(b._id)] || null; b.canReview = canReview(b) && !b.review })

    res.json({
      success: true,
      data: {
        reservations:  attachCabs(reservations, cabs.filter(c => c.linkedType === 'restaurant')),
        hotelBookings: attachCabs(hotelBookings, cabs.filter(c => c.linkedType === 'hotel')),
        cabs:          cabs.filter(c => c.linkedType === 'none'),
      },
    })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

/* ══════════════════════════════════════
   GET /api/my-bookings/bill/:type/:id   (type = hotel | cab)
   Data for a booking bill — the customer's own booking, or any booking for admin.
══════════════════════════════════════ */
router.get('/bill/:type/:id', protect, async (req, res) => {
  try {
    const isAdmin = hasPermission(req.user, req.params.type === 'hotel' ? 'hotels' : 'cabs', 'bills')
    const own     = isAdmin ? {} : emailFilter(req.user)

    if (req.params.type === 'hotel') {
      const booking = await HotelBooking.findOne({ _id: req.params.id, ...own }).populate('hotel', 'name address city pricePerNight').lean()
      if (!booking) return res.status(404).json({ success: false, error: 'Bill not found.' })
      const cab = await CabBooking.findOne({ linkedType: 'hotel', linkedId: booking._id }).lean()
      return res.json({ success: true, data: { type: 'hotel', booking, cab } })
    }
    if (req.params.type === 'cab') {
      const cab = await CabBooking.findOne({ _id: req.params.id, ...own }).lean()
      if (!cab) return res.status(404).json({ success: false, error: 'Bill not found.' })
      return res.json({ success: true, data: { type: 'cab', cab } })
    }
    res.status(400).json({ success: false, error: 'Invalid bill type.' })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

/* ══════════════════════════════════════
   PATCH /api/my-bookings/:type/:id/cancel
   type = reservation | hotel | cab — only pending bookings can be cancelled.
   Cancelling a table / hotel booking also cancels its linked cab.
══════════════════════════════════════ */
const MODELS = { reservation: Reservation, hotel: HotelBooking, cab: CabBooking }

router.patch('/:type/:id/cancel', protect, async (req, res) => {
  try {
    const Model = MODELS[req.params.type]
    if (!Model) return res.status(400).json({ success: false, error: 'Invalid booking type.' })

    const doc = await Model.findOne({ _id: req.params.id, ...emailFilter(req.user) })
    if (!doc) return res.status(404).json({ success: false, error: 'Booking not found.' })
    if (doc.status !== 'pending')
      return res.status(400).json({ success: false, error: 'Only pending bookings can be cancelled. Please contact us.' })

    doc.status = 'cancelled'
    await doc.save()

    if (req.params.type !== 'cab') {
      await CabBooking.updateMany(
        { linkedId: doc._id, status: { $in: ['pending', 'confirmed'] } },
        { $set: { status: 'cancelled' } }
      )
    }
    res.json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

module.exports = router
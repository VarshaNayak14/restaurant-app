const express  = require('express')
const router   = express.Router()
const { protect, adminOnly } = require('../middleware/auth')
const CabBooking  = require('../models/CabBooking')
const Reservation = require('../models/Reservation')
const { CAB_RATES, createCab } = require('../utils/cabHelper')
const mailer = require('../utils/mailer')

/* ══════════════════════════════════════
   PUBLIC — GET /api/cabs/rates
══════════════════════════════════════ */
router.get('/rates', (req, res) => {
  res.json({ success: true, data: CAB_RATES })
})

/* ══════════════════════════════════════
   CUSTOMER (login required) — POST /api/cabs
   Standalone cab, or a cab linked to a restaurant reservation
   (send reservationId in the body for a restaurant cab)
══════════════════════════════════════ */
/* Logged-in users go through protect(). A guest (no token) may only book a cab
   that is attached to a table reservation they just made — the reservation id
   and the email on it must match. */
const protectUnlessGuest = (req, res, next) => {
  if (req.headers.authorization) return protect(req, res, next)
  if (!req.body.reservationId) {
    return res.status(401).json({ success: false, error: 'Not authorized. Please login.' })
  }
  next()
}

router.post('/', protectUnlessGuest, async (req, res) => {
  try {
    if (req.user) {
      // Booking is always saved under the logged-in account's email
      req.body.email = req.user.email
      req.body.name  = req.body.name || req.user.name
    }
    const bookerEmail = String(req.body.email || '').toLowerCase()
    let link = {}
    if (req.body.reservationId) {
      const r = await Reservation.findById(req.body.reservationId)
      if (!r || !bookerEmail || r.email !== bookerEmail) return res.status(404).json({ success: false, error: 'Reservation not found' })
      link = {
        linkedType:  'restaurant',
        linkedModel: 'Reservation',
        linkedId:    r._id,
        venueName:   req.body.venueName || 'Hungry Hub Restaurant',
      }
    }
    const cab = await createCab(req.body, link)
    mailer.cabBooked(cab)
    res.status(201).json({ success: true, data: cab })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

/* ══════════════════════════════════════
   ADMIN — GET /api/cabs?status=&linkedType=
══════════════════════════════════════ */
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, linkedType } = req.query
    const filter = {}
    if (status && status !== 'all')         filter.status     = status
    if (linkedType && linkedType !== 'all') filter.linkedType = linkedType
    const data = await CabBooking.find(filter).sort({ createdAt: -1 }).populate('linkedId')
    res.json({ success: true, data, total: data.length })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

/* ══════════════════════════════════════
   ADMIN — PATCH /api/cabs/:id
   Status update + driver assign
══════════════════════════════════════ */
router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const allowed = ['status', 'driverName', 'driverPhone', 'vehicleNumber', 'adminNote']
    const update  = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k] })
    const doc = await CabBooking.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('linkedId')
    if (!doc) return res.status(404).json({ success: false, error: 'Cab booking not found' })
    if (update.status) mailer.cabStatus(doc)
    res.json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

/* ══════════════════════════════════════
   ADMIN — DELETE /api/cabs/:id
══════════════════════════════════════ */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await CabBooking.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

module.exports = router
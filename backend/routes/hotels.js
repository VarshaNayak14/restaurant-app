const express  = require('express')
const router   = express.Router()
const { protect, adminOnly } = require('../middleware/auth')
const Hotel        = require('../models/Hotel')
const HotelBooking = require('../models/HotelBooking')
const CabBooking   = require('../models/CabBooking')
const { createCab, validateCab } = require('../utils/cabHelper')
const mailer = require('../utils/mailer')

const HOTEL_FIELDS = ['name', 'city', 'address', 'description', 'image', 'pricePerNight', 'rating', 'totalRooms', 'amenities', 'isActive',
  'images', 'highlights', 'policies', 'nearby', 'checkInTime', 'checkOutTime', 'phone', 'email', 'mapEmbed']
// List fields can arrive as arrays or as text (amenities: comma separated, others: one per line)
const LIST_FIELDS = { amenities: ',', images: /\r?\n/, highlights: /\r?\n/, policies: /\r?\n/, nearby: /\r?\n/ }
function pick(body) {
  const out = {}
  HOTEL_FIELDS.forEach(k => { if (body[k] !== undefined) out[k] = body[k] })
  for (const [k, sep] of Object.entries(LIST_FIELDS)) {
    if (typeof out[k] === 'string') out[k] = out[k].split(sep)
    if (Array.isArray(out[k])) out[k] = out[k].map(v => String(v).trim()).filter(Boolean)
  }
  return out
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

/* NOTE: /bookings routes must come BEFORE the /:id routes */

/* ══════════════════════════════════════
   CUSTOMER (login required) — POST /api/hotels/bookings
   Optional `cab` object in the body → books a cab along with the hotel
══════════════════════════════════════ */
router.post('/bookings', protect, async (req, res) => {
  try {
    // Booking is always saved under the logged-in account's email
    const email = req.user.email
    const name  = req.body.name || req.user.name
    const { hotelId, phone, checkIn, checkOut, guests, rooms, message, cab } = req.body
    if (!hotelId || !name || !email || !checkIn || !checkOut)
      return res.status(400).json({ success: false, error: 'Hotel, name, email, check-in and check-out are required.' })

    const hotel = await Hotel.findById(hotelId)
    if (!hotel || !hotel.isActive)
      return res.status(404).json({ success: false, error: 'Hotel not found' })

    const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)
    if (!(nights >= 1))
      return res.status(400).json({ success: false, error: 'Check-out must be at least 1 day after check-in.' })

    const roomCount = Math.max(1, Number(rooms) || 1)
    const cabBody   = cab ? { ...cab, name, email, phone } : null

    // Validate cab details first so a hotel booking is never created alone by mistake
    if (cabBody) validateCab(cabBody)

    const booking = await HotelBooking.create({
      hotel: hotel._id,
      hotelName: hotel.name,
      name, email, phone, checkIn, checkOut,
      guests: Number(guests) || 1,
      rooms: roomCount,
      nights,
      totalAmount: nights * roomCount * hotel.pricePerNight,
      message,
    })

    let cabDoc = null
    if (cabBody) {
      try {
        cabDoc = await createCab(cabBody, {
          linkedType:  'hotel',
          linkedModel: 'HotelBooking',
          linkedId:    booking._id,
          venueName:   hotel.name,
        })
      } catch (e) {
        await HotelBooking.findByIdAndDelete(booking._id)
        throw e
      }
    }

    mailer.hotelBooked(booking, cabDoc)
    res.status(201).json({ success: true, data: { booking, cab: cabDoc } })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

/* ══════════════════════════════════════
   ADMIN — GET /api/hotels/bookings
══════════════════════════════════════ */
router.get('/bookings', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query
    const filter = status && status !== 'all' ? { status } : {}
    const data   = await HotelBooking.find(filter).sort({ createdAt: -1 }).lean()

    // Attach the linked cab (if any) to each booking
    const cabs = await CabBooking.find({ linkedType: 'hotel', linkedId: { $in: data.map(d => d._id) } }).lean()
    const byId = {}
    cabs.forEach(c => { byId[String(c.linkedId)] = c })
    data.forEach(d => { d.cab = byId[String(d._id)] || null })

    res.json({ success: true, data, total: data.length })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

/* ADMIN — PATCH /api/hotels/bookings/:id */
router.patch('/bookings/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body
    const update = {}
    if (status)                  update.status    = status
    if (adminNote !== undefined) update.adminNote = adminNote
    const doc = await HotelBooking.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean()
    if (!doc) return res.status(404).json({ success: false, error: 'Booking not found' })
    doc.cab = await CabBooking.findOne({ linkedType: 'hotel', linkedId: doc._id }).lean()
    if (status) mailer.hotelStatus(doc)
    res.json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

/* ADMIN — DELETE /api/hotels/bookings/:id */
router.delete('/bookings/:id', protect, adminOnly, async (req, res) => {
  try {
    await HotelBooking.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

/* ══════════════════════════════════════
   HOTELS CRUD
══════════════════════════════════════ */

// PUBLIC — GET /api/hotels?city=   (admin can pass ?all=1 to include inactive hotels)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.all ? {} : { isActive: true }
    if (req.query.city) filter.city = new RegExp(escapeRegex(String(req.query.city)), 'i')
    // Gallery photos can be large (uploaded images) — only the detail page needs them
    const data = await Hotel.find(filter).select('-images').sort({ createdAt: -1 })
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const doc = await Hotel.findById(req.params.id)
    if (!doc) return res.status(404).json({ success: false, error: 'Hotel not found' })
    res.json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const doc = await Hotel.create(pick(req.body))
    res.status(201).json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const update   = pick(req.body)
    const existing = await Hotel.findById(req.params.id).select('reviewCount')
    // Once guests have reviewed, the rating is calculated from reviews — not editable
    if (existing && existing.reviewCount > 0) delete update.rating
    const doc = await Hotel.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!doc) return res.status(404).json({ success: false, error: 'Hotel not found' })
    res.json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

module.exports = router
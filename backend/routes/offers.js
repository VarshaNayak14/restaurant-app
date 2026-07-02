const express  = require('express')
const mongoose = require('mongoose')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

function getModel(name) {
  return mongoose.models[name] || require(`../models/${name}`)
}

// Query filter jo bataata hai ki offer *is-waqt* live hai ya nahi
function liveFilter() {
  const now = new Date()
  return { active: true, startAt: { $lte: now }, endAt: { $gte: now } }
}

/* ─────────────────────────────────────────
   GET /api/offers/active  —  Public
   Home page (aur dishes route) yahi se
   "abhi kaun sa offer chal raha hai" nikaalte hain.
───────────────────────────────────────── */
router.get('/active', async (req, res) => {
  try {
    const Offer = getModel('Offer')
    const offer = await Offer.findOne(liveFilter())
      .sort({ createdAt: -1 })
      .populate('items.dish')
    res.json({ success: true, data: offer || null })
  } catch (err) {
    console.error('Fetch active offer error:', err)
    res.status(500).json({ success: false, error: 'Could not fetch active offer.' })
  }
})

/* ─────────────────────────────────────────
   GET /api/offers  —  Admin only (list all, newest first)
───────────────────────────────────────── */
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const Offer = getModel('Offer')
    const offers = await Offer.find().sort({ createdAt: -1 }).populate('items.dish')
    res.json({ success: true, data: offers })
  } catch (err) {
    console.error('Fetch offers error:', err)
    res.status(500).json({ success: false, error: 'Could not fetch offers.' })
  }
})

/* ─────────────────────────────────────────
   GET /api/offers/:id  —  Admin only (single, for edit form)
───────────────────────────────────────── */
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const Offer = getModel('Offer')
    const offer = await Offer.findById(req.params.id).populate('items.dish')
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found.' })
    res.json({ success: true, data: offer })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch offer.' })
  }
})

/* ─────────────────────────────────────────
   POST /api/offers  —  Admin only (create)
───────────────────────────────────────── */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, subtitle, startAt, endAt, active, items } = req.body

    if (!startAt || !endAt) {
      return res.status(400).json({ success: false, error: 'Please set both start and end date/time.' })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Select at least one dish for this offer.' })
    }
    for (const it of items) {
      if (!it.dish || !it.discount || Number(it.discount) <= 0) {
        return res.status(400).json({ success: false, error: 'Every selected dish needs a discount greater than 0.' })
      }
    }

    const Offer = getModel('Offer')
    const offer = new Offer({
      title: title || 'Flash Offer',
      subtitle: subtitle || '',
      startAt,
      endAt,
      active: active !== undefined ? active : true,
      items: items.map(it => ({ dish: it.dish, discount: Number(it.discount) })),
    })
    await offer.save()
    await offer.populate('items.dish')
    res.status(201).json({ success: true, data: offer })
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ success: false, error: messages[0] })
    }
    console.error('Create offer error:', err)
    res.status(500).json({ success: false, error: 'Could not create offer.' })
  }
})

/* ─────────────────────────────────────────
   PUT /api/offers/:id  —  Admin only (update)
───────────────────────────────────────── */
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { title, subtitle, startAt, endAt, active, items } = req.body

    if (items) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Select at least one dish for this offer.' })
      }
      for (const it of items) {
        if (!it.dish || !it.discount || Number(it.discount) <= 0) {
          return res.status(400).json({ success: false, error: 'Every selected dish needs a discount greater than 0.' })
        }
      }
    }

    const Offer = getModel('Offer')
    const update = { title, subtitle, startAt, endAt, active }
    if (items) update.items = items.map(it => ({ dish: it.dish, discount: Number(it.discount) }))

    const offer = await Offer.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('items.dish')
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found.' })
    res.json({ success: true, data: offer })
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ success: false, error: messages[0] })
    }
    console.error('Update offer error:', err)
    res.status(500).json({ success: false, error: 'Could not update offer.' })
  }
})

/* ─────────────────────────────────────────
   DELETE /api/offers/:id  —  Admin only
───────────────────────────────────────── */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const Offer = getModel('Offer')
    const offer = await Offer.findByIdAndDelete(req.params.id)
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found.' })
    res.json({ success: true, message: 'Offer deleted successfully.' })
  } catch (err) {
    console.error('Delete offer error:', err)
    res.status(500).json({ success: false, error: 'Could not delete offer.' })
  }
})

module.exports = router
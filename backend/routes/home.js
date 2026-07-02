const express    = require('express')
const mongoose   = require('mongoose')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

function getModel(name) {
  return mongoose.models[name] || require(`../models/${name}`)
}

/* ── Testimonials ── */
router.get('/testimonials', async (req, res) => {
  try {
    const data = await getModel('Testimonial').find({ active: true }).sort({ order: 1, createdAt: -1 })
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

router.post('/testimonials', protect, adminOnly, async (req, res) => {
  try {
    const doc = await getModel('Testimonial').create(req.body)
    res.status(201).json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

router.put('/testimonials/:id', protect, adminOnly, async (req, res) => {
  try {
    const doc = await getModel('Testimonial').findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

router.delete('/testimonials/:id', protect, adminOnly, async (req, res) => {
  try {
    await getModel('Testimonial').findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

/* ── Categories ── */
router.get('/categories', async (req, res) => {
  try {
    const data = await getModel('Category').find({ active: true }).sort({ order: 1 })
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

router.post('/categories', protect, adminOnly, async (req, res) => {
  try {
    const doc = await getModel('Category').create(req.body)
    res.status(201).json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

router.put('/categories/:id', protect, adminOnly, async (req, res) => {
  try {
    const doc = await getModel('Category').findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

router.delete('/categories/:id', protect, adminOnly, async (req, res) => {
  try {
    await getModel('Category').findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

/* ── Chefs ── */
router.get('/chefs', async (req, res) => {
  try {
    const data = await getModel('Chef').find({ active: true }).sort({ order: 1 })
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

router.post('/chefs', protect, adminOnly, async (req, res) => {
  try {
    const doc = await getModel('Chef').create(req.body)
    res.status(201).json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

router.put('/chefs/:id', protect, adminOnly, async (req, res) => {
  try {
    const doc = await getModel('Chef').findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

router.delete('/chefs/:id', protect, adminOnly, async (req, res) => {
  try {
    await getModel('Chef').findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

/* ── Gallery ── */
router.get('/gallery', async (req, res) => {
  try {
    const data = await getModel('Gallery').find({ active: true }).sort({ order: 1 })
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

router.post('/gallery', protect, adminOnly, async (req, res) => {
  try {
    const doc = await getModel('Gallery').create(req.body)
    res.status(201).json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

router.put('/gallery/:id', protect, adminOnly, async (req, res) => {
  try {
    const doc = await getModel('Gallery').findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

router.delete('/gallery/:id', protect, adminOnly, async (req, res) => {
  try {
    await getModel('Gallery').findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

module.exports = router
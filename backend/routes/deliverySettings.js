const express          = require('express')
const router           = express.Router()
const { protect, adminOnly } = require('../middleware/auth')
const DeliverySettings = require('../models/DeliverySettings')

/* ─────────────────────────────────────────
   SETTINGS helper
───────────────────────────────────────── */
async function getSettings() {
  let doc = await DeliverySettings.findOne({ key: 'main' })
  if (!doc) doc = await DeliverySettings.create({ key: 'main' })
  return doc
}

/* ══════════════════════════════════════
   PUBLIC — GET /api/delivery-settings
   Checkout/Cart pages ye use karke delivery fee nikaalte hain
══════════════════════════════════════ */
router.get('/', async (req, res) => {
  try {
    const doc = await getSettings()
    res.json({ success: true, data: doc })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

/* ══════════════════════════════════════
   ADMIN — PUT /api/delivery-settings
══════════════════════════════════════ */
router.put('/', protect, adminOnly, async (req, res) => {
  try {
    const allowed = ['deliveryFee', 'freeDeliveryThreshold', 'freeDeliveryEnabled']
    const update = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k] })

    if (update.deliveryFee !== undefined && (isNaN(update.deliveryFee) || update.deliveryFee < 0)) {
      return res.status(400).json({ success: false, error: 'Delivery fee must be a valid positive number.' })
    }
    if (update.freeDeliveryThreshold !== undefined && (isNaN(update.freeDeliveryThreshold) || update.freeDeliveryThreshold < 0)) {
      return res.status(400).json({ success: false, error: 'Free delivery threshold must be a valid positive number.' })
    }

    const doc = await DeliverySettings.findOneAndUpdate(
      { key: 'main' },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    )
    res.json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

module.exports = router
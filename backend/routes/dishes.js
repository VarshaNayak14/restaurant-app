const express   = require('express')
const mongoose  = require('mongoose')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

// Get Dish model safely — works whether or not it was already registered
function getDish() {
  return mongoose.models.Dish || require('../models/Dish')
}

function getOffer() {
  return mongoose.models.Offer || require('../models/Offer')
}

/*
  Jo bhi Offer admin ne is-waqt ke liye schedule kiya hai (date/time window
  ke andar aur active=true), uske items se ek map bana dete hain:
  dishId -> discount. Isse GET /dishes aur GET /dishes/:id dono automatically
  "live" offer discount dikhayenge — bina Menu/Home/DishDetail me kuch badle.
  Offer khatam hote hi (endAt nikalte hi) ye map khud-ba-khud khaali ho jata
  hai, kuch manually revert nahi karna padta.
*/
async function getActiveOfferDiscountMap() {
  try {
    const now = new Date()
    const offer = await getOffer()
      .findOne({ active: true, startAt: { $lte: now }, endAt: { $gte: now } })
      .sort({ createdAt: -1 })
    if (!offer) return {}
    const map = {}
    offer.items.forEach(it => { map[String(it.dish)] = it.discount })
    return map
  } catch {
    return {}
  }
}

/* ─────────────────────────────────────────
   GET /api/dishes  —  Public
───────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const [dishes, offerMap] = await Promise.all([
      getDish().find().sort({ createdAt: -1 }).lean(),
      getActiveOfferDiscountMap(),
    ])
    const merged = dishes.map(d =>
      offerMap[String(d._id)] !== undefined
        ? { ...d, discount: offerMap[String(d._id)] }
        : d
    )
    res.json({ success: true, dishes: merged })
  } catch (err) {
    console.error('Fetch dishes error:', err)
    res.status(500).json({ success: false, error: 'Could not fetch dishes.' })
  }
})

/* ─────────────────────────────────────────
   GET /api/dishes/:id  —  Public
───────────────────────────────────────── */
router.get('/:id', async (req, res) => {
  try {
    const [dish, offerMap] = await Promise.all([
      getDish().findById(req.params.id).lean(),
      getActiveOfferDiscountMap(),
    ])
    if (!dish) return res.status(404).json({ success: false, error: 'Dish not found.' })
    if (offerMap[String(dish._id)] !== undefined) dish.discount = offerMap[String(dish._id)]
    res.json({ success: true, dish })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch dish.' })
  }
})

/* ─────────────────────────────────────────
   POST /api/dishes  —  Admin only
───────────────────────────────────────── */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, price, image, cat, tag, spice, desc, bestseller, discount } = req.body

    if (!name || !price || !image || !cat || !desc) {
      return res.status(400).json({ success: false, error: 'Please fill in name, price, image, category and description.' })
    }

    if (discount && Number(discount) >= Number(price)) {
      return res.status(400).json({ success: false, error: 'Discount cannot be equal to or greater than the price.' })
    }

    const Dish = getDish()
    const dish = new Dish({ name, price, image, cat, tag, spice, desc, bestseller, discount: discount || 0 })
    await dish.save()
    res.status(201).json({ success: true, dish })
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ success: false, error: messages[0] })
    }
    console.error('Add dish error:', err)
    res.status(500).json({ success: false, error: 'Could not add dish.' })
  }
})

/* ─────────────────────────────────────────
   DELETE /api/dishes/:id  —  Admin only
───────────────────────────────────────── */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const dish = await getDish().findByIdAndDelete(req.params.id)
    if (!dish) return res.status(404).json({ success: false, error: 'Dish not found.' })
    res.json({ success: true, message: 'Dish deleted successfully.' })
  } catch (err) {
    console.error('Delete dish error:', err)
    res.status(500).json({ success: false, error: 'Could not delete dish.' })
  }
})

/* ─────────────────────────────────────────
   PUT /api/dishes/:id  —  Admin only
───────────────────────────────────────── */
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { discount, price } = req.body
    if (discount && price && Number(discount) >= Number(price)) {
      return res.status(400).json({ success: false, error: 'Discount cannot be equal to or greater than the price.' })
    }
    const dish = await getDish().findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!dish) return res.status(404).json({ success: false, error: 'Dish not found.' })
    res.json({ success: true, dish })
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ success: false, error: messages[0] })
    }
    console.error('Update dish error:', err)
    res.status(500).json({ success: false, error: 'Could not update dish.' })
  }
})

module.exports = router
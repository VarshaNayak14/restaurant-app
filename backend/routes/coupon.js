const express  = require('express')
const Coupon   = require('../models/Coupon')
const { protect, adminOnly } = require('../middleware/auth')
const { resolveCoupon } = require('../utils/couponHelper')

const router = express.Router()

// ─────────────────────────────────────────────────────────
//  USER ROUTE — validate & preview a coupon at checkout
// ─────────────────────────────────────────────────────────

/**
 * POST /api/coupons/validate
 * Body: { code, items, cartTotal }
 * Logged-in users only — checks expiry, usage limit, min order value,
 * aur agar coupon kisi particular dish tak limited hai to wo bhi check karta hai.
 */
router.post('/validate', protect, async (req, res) => {
  try {
    const { code, items, cartTotal } = req.body

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter a coupon code.' })
    }
    if (cartTotal == null || cartTotal <= 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty.' })
    }

    const cleanCode = code.trim().toUpperCase()
    const coupon = await Coupon.findOne({ code: cleanCode })

    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Invalid coupon code.' })
    }
    if (!coupon.active) {
      return res.status(400).json({ success: false, error: 'This coupon is no longer active.' })
    }
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ success: false, error: 'This coupon has expired.' })
    }
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, error: 'This coupon has reached its usage limit.' })
    }
    if (cartTotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        error: `Add items worth ₹${coupon.minOrderValue - cartTotal} more to use this coupon (min order ₹${coupon.minOrderValue}).`,
      })
    }
    if (coupon.perUserLimit != null) {
      const userUsage = coupon.usedBy.filter(id => id.toString() === req.user._id.toString()).length
      if (userUsage >= coupon.perUserLimit) {
        return res.status(400).json({ success: false, error: 'You have already used this coupon.' })
      }
    }
    if (coupon.applicableDishes && coupon.applicableDishes.length > 0) {
      const dishIds = coupon.applicableDishes.map(id => id.toString())
      const hasEligibleItem = (items || []).some(it => dishIds.includes(String(it.id || it.dish || it._id)))
      if (!hasEligibleItem) {
        return res.status(400).json({ success: false, error: 'This coupon only applies to specific dishes not in your cart.' })
      }
    }

    const resolved = await resolveCoupon(cleanCode, items, cartTotal, req.user._id)
    if (!resolved) {
      return res.status(400).json({ success: false, error: 'This coupon cannot be applied.' })
    }

    res.json({
      success: true,
      discount: resolved.discount,
      coupon: {
        code:          coupon.code,
        description:   coupon.description,
        discountType:  coupon.discountType,
        discountValue: coupon.discountValue,
        dishSpecific:  coupon.applicableDishes && coupon.applicableDishes.length > 0,
      },
    })
  } catch (err) {
    console.error('Coupon validate error:', err)
    res.status(500).json({ success: false, error: 'Could not validate coupon.' })
  }
})

// ─────────────────────────────────────────────────────────
//  PUBLIC ROUTE — active coupons for the "Offers" section
// ─────────────────────────────────────────────────────────

/**
 * GET /api/coupons/active
 * No auth required — customers browsing the site can see these.
 * Sirf wahi coupons return hote hain jo: active, not expired,
 * usage limit reach nahi hui, aur isPublic = true.
 */
router.get('/active', async (req, res) => {
  try {
    const now = new Date()
    const coupons = await Coupon.find({
      active: true,
      isPublic: true,
      expiryDate: { $gte: now },
    })
      .sort({ createdAt: -1 })
      .populate('applicableDishes', 'name image')

    const visible = coupons.filter(c => c.usageLimit == null || c.usedCount < c.usageLimit)

    res.json({
      success: true,
      coupons: visible.map(c => ({
        code:            c.code,
        description:     c.description,
        discountType:    c.discountType,
        discountValue:   c.discountValue,
        maxDiscount:     c.maxDiscount,
        minOrderValue:   c.minOrderValue,
        expiryDate:      c.expiryDate,
        dishSpecific:    c.applicableDishes && c.applicableDishes.length > 0,
        applicableDishes: (c.applicableDishes || []).map(d => ({ name: d.name, image: d.image })),
      })),
    })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch offers.' })
  }
})

// ─────────────────────────────────────────────────────────
//  ADMIN ROUTES
// ─────────────────────────────────────────────────────────

/** GET /api/coupons — admin: list all coupons */
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).populate('applicableDishes', 'name image')
    res.json({ success: true, coupons })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch coupons.' })
  }
})

/** POST /api/coupons — admin: create coupon */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      code, description, discountType, discountValue,
      maxDiscount, minOrderValue, usageLimit, perUserLimit,
      expiryDate, active, applicableDishes, isPublic,
    } = req.body

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, error: 'Coupon code is required.' })
    }
    if (!['percentage', 'flat'].includes(discountType)) {
      return res.status(400).json({ success: false, error: 'Discount type must be percentage or flat.' })
    }
    if (discountValue == null || Number(discountValue) <= 0) {
      return res.status(400).json({ success: false, error: 'Discount value must be greater than 0.' })
    }
    if (discountType === 'percentage' && Number(discountValue) > 100) {
      return res.status(400).json({ success: false, error: 'Percentage discount cannot exceed 100.' })
    }
    if (!expiryDate) {
      return res.status(400).json({ success: false, error: 'Expiry date is required.' })
    }

    const cleanCode = code.trim().toUpperCase()
    const exists = await Coupon.findOne({ code: cleanCode })
    if (exists) {
      return res.status(400).json({ success: false, error: 'A coupon with this code already exists.' })
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      description: description || '',
      discountType,
      discountValue: Number(discountValue),
      maxDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : null,
      minOrderValue: Number(minOrderValue) || 0,
      applicableDishes: Array.isArray(applicableDishes) ? applicableDishes : [],
      usageLimit: usageLimit ? Number(usageLimit) : null,
      perUserLimit: perUserLimit != null && perUserLimit !== '' ? Number(perUserLimit) : 1,
      expiryDate,
      active: active !== undefined ? !!active : true,
      isPublic: isPublic !== undefined ? !!isPublic : true,
    })

    res.status(201).json({ success: true, coupon })
  } catch (err) {
    console.error('Create coupon error:', err)
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'A coupon with this code already exists.' })
    }
    res.status(500).json({ success: false, error: 'Failed to create coupon.' })
  }
})

/** PUT /api/coupons/:id — admin: update coupon */
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const {
      code, description, discountType, discountValue,
      maxDiscount, minOrderValue, usageLimit, perUserLimit,
      expiryDate, active, applicableDishes, isPublic,
    } = req.body

    if (discountType && !['percentage', 'flat'].includes(discountType)) {
      return res.status(400).json({ success: false, error: 'Discount type must be percentage or flat.' })
    }
    if (discountValue != null && Number(discountValue) <= 0) {
      return res.status(400).json({ success: false, error: 'Discount value must be greater than 0.' })
    }
    if (discountType === 'percentage' && discountValue != null && Number(discountValue) > 100) {
      return res.status(400).json({ success: false, error: 'Percentage discount cannot exceed 100.' })
    }

    const update = {
      description,
      discountType,
      discountValue: discountValue != null ? Number(discountValue) : undefined,
      maxDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : null,
      minOrderValue: minOrderValue != null ? Number(minOrderValue) : 0,
      applicableDishes: Array.isArray(applicableDishes) ? applicableDishes : [],
      usageLimit: usageLimit ? Number(usageLimit) : null,
      perUserLimit: perUserLimit != null && perUserLimit !== '' ? Number(perUserLimit) : 1,
      expiryDate,
      active,
      isPublic: isPublic !== undefined ? !!isPublic : undefined,
    }
    if (code && code.trim()) update.code = code.trim().toUpperCase()

    // undefined keys hata do taaki accidentally overwrite na ho
    Object.keys(update).forEach(k => update[k] === undefined && delete update[k])

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!coupon) return res.status(404).json({ success: false, error: 'Coupon not found.' })

    res.json({ success: true, coupon })
  } catch (err) {
    console.error('Update coupon error:', err)
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'A coupon with this code already exists.' })
    }
    res.status(500).json({ success: false, error: 'Failed to update coupon.' })
  }
})

/** DELETE /api/coupons/:id — admin: delete coupon */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id)
    if (!coupon) return res.status(404).json({ success: false, error: 'Coupon not found.' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete coupon.' })
  }
})

module.exports = router
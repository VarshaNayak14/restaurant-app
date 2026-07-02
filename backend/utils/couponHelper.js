const Coupon = require('../models/Coupon')

/**
 * Coupon ko validate karke discount amount calculate karta hai.
 * Order place karte waqt (COD ya Razorpay verify) dono jagah
 * yehi function use hota hai taaki logic duplicate na ho aur
 * client se bheja hua discount blindly trust na ho.
 *
 * @param {string} code - coupon code
 * @param {Array}  items - cart items [{ id, price, qty, ... }]
 * @param {number} cartSubtotal - poore cart ka subtotal (min order value check ke liye)
 * @param {string} userId
 * @returns { coupon, discount } ya null agar coupon invalid hai
 */
async function resolveCoupon(code, items, cartSubtotal, userId) {
  if (!code) return null

  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() })
  if (!coupon) return null
  if (!coupon.active) return null
  if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) return null
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return null
  if (cartSubtotal < coupon.minOrderValue) return null

  if (coupon.perUserLimit != null) {
    const userUsage = coupon.usedBy.filter(id => id.toString() === userId.toString()).length
    if (userUsage >= coupon.perUserLimit) return null
  }

  // ── Dish-specific coupon: discount sirf selected dishes ke subtotal pe ──
  let eligibleSubtotal = cartSubtotal
  if (coupon.applicableDishes && coupon.applicableDishes.length > 0) {
    const dishIds = coupon.applicableDishes.map(id => id.toString())
    eligibleSubtotal = (items || [])
      .filter(it => dishIds.includes(String(it.id || it.dish || it._id)))
      .reduce((sum, it) => sum + it.price * it.qty, 0)

    if (eligibleSubtotal <= 0) return null // cart me wo dish hi nahi hai
  }

  let discount = 0
  if (coupon.discountType === 'percentage') {
    discount = Math.round((eligibleSubtotal * coupon.discountValue) / 100)
    if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount)
  } else {
    discount = coupon.discountValue
  }
  discount = Math.max(0, Math.min(discount, eligibleSubtotal))

  return { coupon, discount }
}

/** Coupon ka usage count/usedBy update karta hai — order confirm hone ke baad hi call karo */
async function markCouponUsed(coupon, userId) {
  coupon.usedCount += 1
  coupon.usedBy.push(userId)
  await coupon.save()
}

module.exports = { resolveCoupon, markCouponUsed }
require('dotenv').config()

const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')
const { protect } = require('./middleware/auth')

const authRoutes         = require('./routes/auth')
const dishRoutes         = require('./routes/dishes')
const offerRoutes        = require('./routes/offers')        // ← NEW
const homeRoutes         = require('./routes/home')
const contactRoutes      = require('./routes/contact')
const cartWishlistRoutes = require('./routes/cartWishlist')
const orderRoutes        = require('./routes/order')        // ← NEW
const reviewRoutes       = require('./routes/review')
const paymentRoutes      = require('./routes/payment')
const couponRoutes       = require('./routes/coupon')       // ← NEW
const deliverySettingsRoutes = require('./routes/deliverySettings') // ← NEW
const hotelRoutes        = require('./routes/hotels')       // ← NEW: hotel booking
const hotelReviewRoutes  = require('./routes/hotelReviews') // ← NEW: hotel reviews
const cabRoutes          = require('./routes/cabs')         // ← NEW: cab booking
const myBookingsRoutes   = require('./routes/myBookings')   // ← NEW: customer's own bookings
const adminsRoutes       = require('./routes/admins')       // ← NEW: superadmin manages admins
const User               = require('./models/User')

const app  = express()
const PORT = process.env.PORT || 5000
const frontendUrl = process.env.FRONTEND_URL || 'https://restaurant-app-snowy-three.vercel.app'
const frontendOrigin = new URL(
  frontendUrl.includes('://') ? frontendUrl : `https://${frontendUrl}`
).origin

app.use(cors({
  origin: [frontendOrigin, 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth',    authRoutes)
app.use('/api/dishes',  dishRoutes)
app.use('/api/offers',  offerRoutes)                         // ← NEW
app.use('/api/home',    homeRoutes)
// ← NEW: table reservation needs login; saved under the account's email (so it shows in My Bookings)
app.post('/api/contact/reservation', protect, (req, res, next) => {
  req.body.email = req.user.email
  req.body.name  = req.body.name || req.user.name
  next()
})
app.use('/api/contact', contactRoutes)
app.use('/api/hotels',  hotelRoutes)                         // ← NEW: hotel booking
app.use('/api/hotel-reviews', hotelReviewRoutes)            // ← NEW: hotel reviews
app.use('/api/cabs',    cabRoutes)                           // ← NEW: cab booking
app.use('/api/my-bookings', myBookingsRoutes)                // ← NEW: customer's own bookings
app.use('/api/admins',  adminsRoutes)                        // ← NEW: superadmin only
app.use('/api',         cartWishlistRoutes)
app.use('/api/orders',  orderRoutes)                        // ← NEW
app.use('/api/reviews', reviewRoutes)                        // ← NEW
app.use('/api/payments', paymentRoutes)                      // ← Razorpay
app.use('/api/coupons', couponRoutes)                        // ← NEW
app.use('/api/delivery-settings', deliverySettingsRoutes)    // ← NEW

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'HungryHub API is running', time: new Date() })
})
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found.` })
})
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: 'Something went wrong on the server.' })
})

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HungryHub Backend is Running 🚀"
  });
});

/* ← NEW: one-time setup — if there is no superadmin yet, existing admins
   (who had full access before roles existed) become superadmins */
async function ensureSuperadmin() {
  try {
    if (await User.exists({ role: 'superadmin' })) return
    const r = await User.updateMany({ role: 'admin' }, { $set: { role: 'superadmin' } })
    if (r.modifiedCount) console.log(`[OK] ${r.modifiedCount} existing admin(s) upgraded to superadmin`)
    else console.log('[WARN] No superadmin found. Run: node makeSuperadmin.js <email>')
  } catch (err) { console.error('[FAIL] superadmin setup:', err.message) }
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[OK] MongoDB connected')
    ensureSuperadmin()
    app.listen(PORT, () => console.log(`[OK] Server running on http://localhost:${PORT}`))
  })
  .catch(err => { console.error('[FAIL] MongoDB:', err.message); process.exit(1) })
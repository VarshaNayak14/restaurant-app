require('dotenv').config()

const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')

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

const app  = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: ['https://restaurant-app-snowy-three.vercel.app/', 'https://restaurant-app-djxk.onrender.com'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth',    authRoutes)
app.use('/api/dishes',  dishRoutes)
app.use('/api/offers',  offerRoutes)                         // ← NEW
app.use('/api/home',    homeRoutes)
app.use('/api/contact', contactRoutes)
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

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[OK] MongoDB connected')
    app.listen(PORT, () => console.log(`[OK] Server running on http://localhost:${PORT}`))
  })
  .catch(err => { console.error('[FAIL] MongoDB:', err.message); process.exit(1) })

const jwt  = require('jsonwebtoken')
const User = require('../models/User')

/* ─── Helper: sign JWT ─────────────────────── */
function signToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

/* ─── Helper: build & send token response ─── */
function sendTokenResponse(user, statusCode, res) {
  const token = signToken(user._id)

  const userData = {
    id:     user._id,
    name:   user.name,
    email:  user.email,
    role:   user.role,
    orders: user.orders,
    joined: user.createdAt,
  }

  return res.status(statusCode).json({ success: true, token, user: userData })
}

/* ═══════════════════════════════════════════
   @route  POST /api/auth/register
   @access Public
   @body   { name, email, password }
═══════════════════════════════════════════ */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    /* ── Field presence ── */
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email and password.',
      })
    }

    /* ── Name length ── */
    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name must be at least 2 characters.',
      })
    }

    /* ── Email format ── */
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.',
      })
    }

    /* ── Password length ── */
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.',
      })
    }

    /* ── Duplicate email check ── */
    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'This email is already registered. Please login.',
      })
    }

    /* ── Create user (password hashed by pre-save hook in model) ── */
    const user = await User.create({
      name:  trimmedName,
      email: email.toLowerCase().trim(),
      password,
    })

    sendTokenResponse(user, 201, res)
  } catch (err) {
    /* Mongoose validation errors */
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors)[0].message
      return res.status(400).json({ success: false, error: message })
    }
    console.error('Register error:', err)
    res.status(500).json({ success: false, error: 'Server error. Please try again.' })
  }
}

/* ═══════════════════════════════════════════
   @route  POST /api/auth/login
   @access Public
   @body   { email, password }
═══════════════════════════════════════════ */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    /* ── Field presence ── */
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password.',
      })
    }

    /* ── Find user (include password field which is hidden by default) ── */
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      })
    }

    /* ── Compare password ── */
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      })
    }

    sendTokenResponse(user, 200, res)
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ success: false, error: 'Server error. Please try again.' })
  }
}

/* ═══════════════════════════════════════════
   @route  GET /api/auth/me
   @access Private (requires JWT)
═══════════════════════════════════════════ */
exports.getMe = async (req, res) => {
  try {
    /* req.user is set by the protect middleware */
    const user = req.user

    res.json({
      success: true,
      user: {
        id:     user._id,
        name:   user.name,
        email:  user.email,
        role:   user.role,
        orders: user.orders,
        joined: user.createdAt,
      },
    })
  } catch (err) {
    console.error('GetMe error:', err)
    res.status(500).json({ success: false, error: 'Server error.' })
  }
}

/* ═══════════════════════════════════════════
   @route  POST /api/auth/logout
   @access Public (client deletes token)
═══════════════════════════════════════════ */
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' })
}
const jwt  = require('jsonwebtoken')
const User = require('../models/User')

// Verify JWT and attach user to request
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Not authorized. Please login.' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists.' })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token invalid or expired. Please login again.' })
  }
}

// Restrict to admin only
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied. Admins only.' })
  }
  next()
}

module.exports = { protect, adminOnly }
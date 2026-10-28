const jwt    = require('jsonwebtoken')
const User   = require('../models/User')

/* ─────────────────────────────────────────
   Roles
   - superadmin : full access + manages admins and their permissions
   - admin      : only the panel sections the superadmin allowed
   - user       : customer
───────────────────────────────────────── */
const PANEL_ROLES = ['admin', 'superadmin']

/* Admin panel sections a superadmin can grant to an admin */
const PERMISSIONS = [
  { key: 'dashboard',    label: 'Dashboard' },
  { key: 'orders',       label: 'Orders & Reviews' },
  { key: 'dishes',       label: 'Manage Dishes' },
  { key: 'offers',       label: 'Flash Offers' },
  { key: 'coupons',      label: 'Coupons' },
  { key: 'categories',   label: 'Categories' },
  { key: 'chefs',        label: 'Chefs' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'contact',      label: 'Contact Settings' },
  { key: 'reservations', label: 'Table Reservations' },
  { key: 'delivery',     label: 'Delivery Settings' },
  { key: 'hotels',       label: 'Hotels & Hotel Bookings' },
  { key: 'cabs',         label: 'Cab Bookings' },
  { key: 'bills',        label: 'Bills' },
]

/*
  Which permission(s) unlock an admin API request — first matching rule wins.
  A request matching no rule is superadmin-only.
*/
const RULES = [
  [/^\/api\/orders\/admin\/stats/,      null,  ['dashboard']],
  [/^\/api\/orders\/?$/,                'GET', ['orders', 'bills', 'dashboard']],
  [/^\/api\/orders/,                    null,  ['orders']],
  [/^\/api\/reviews/,                   'GET', ['orders', 'dashboard']],
  [/^\/api\/auth\/users/,               'GET', ['dashboard']],
  [/^\/api\/dishes/,                    null,  ['dishes']],
  [/^\/api\/offers/,                    null,  ['offers']],
  [/^\/api\/coupons/,                   null,  ['coupons']],
  [/^\/api\/home\/categories/,          null,  ['categories']],
  [/^\/api\/home\/chefs/,               null,  ['chefs']],
  [/^\/api\/home\/testimonials/,        null,  ['testimonials']],
  [/^\/api\/contact\/settings/,         null,  ['contact']],
  [/^\/api\/contact\/reservations/,     null,  ['reservations']],
  [/^\/api\/delivery-settings/,         null,  ['delivery']],
  [/^\/api\/hotels\/bookings\/?$/,      'GET', ['hotels', 'bills']],
  [/^\/api\/hotels/,                    null,  ['hotels']],
  [/^\/api\/hotel-reviews/,              null,  ['hotels']],
  [/^\/api\/cabs\/?$/,                  'GET', ['cabs', 'bills']],
  [/^\/api\/cabs/,                      null,  ['cabs']],
]

function permissionsFor(req) {
  const path = req.baseUrl + req.path
  for (const [rx, method, perms] of RULES) {
    if (rx.test(path) && (!method || method === req.method)) return perms
  }
  return []
}

/* true if the user is superadmin, or an admin holding any of the given permissions */
function hasPermission(user, ...keys) {
  if (!user) return false
  if (user.role === 'superadmin') return true
  if (user.role !== 'admin') return false
  return keys.some(k => (user.permissions || []).includes(k))
}

/* ─────────────────────────────────────────
   Customer auth
───────────────────────────────────────── */
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Not authorized. Please login.' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Old vendor tokens (multivendor removed) are not valid customer logins
    if (decoded.type === 'vendor') {
      return res.status(401).json({ success: false, error: 'Please login as a customer.' })
    }

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

// Admin panel access — superadmin always; admin only for sections they were granted
function adminOnly(req, res, next) {
  if (!PANEL_ROLES.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Access denied. Admins only.' })
  }
  if (hasPermission(req.user, ...permissionsFor(req))) return next()
  return res.status(403).json({ success: false, error: 'You do not have access to this section. Please ask the Super Admin.' })
}

function superadminOnly(req, res, next) {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, error: 'Access denied. Super Admin only.' })
  }
  next()
}

module.exports = { protect, adminOnly, superadminOnly, hasPermission, PERMISSIONS, PANEL_ROLES }
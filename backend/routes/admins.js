const express = require('express')
const router  = express.Router()
const User    = require('../models/User')
const { protect, superadminOnly, PERMISSIONS } = require('../middleware/auth')

/* Everything here is Super Admin only */
router.use(protect, superadminOnly)

const VALID = PERMISSIONS.map(p => p.key)
const clean = perms => [...new Set((Array.isArray(perms) ? perms : []).filter(p => VALID.includes(p)))]
const view  = u => ({ id: u._id, name: u.name, email: u.email, role: u.role, permissions: u.permissions || [], createdAt: u.createdAt })

/* GET /api/admins/permissions — list of sections that can be granted */
router.get('/permissions', (req, res) => {
  res.json({ success: true, data: PERMISSIONS })
})

/* GET /api/admins — all admins and superadmins */
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['admin', 'superadmin'] } }).sort({ role: -1, createdAt: 1 })
    res.json({ success: true, data: users.map(view) })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

/*
  POST /api/admins — add an admin
  Body: { name, email, password, permissions }
  If the email already belongs to a customer account, that account is
  promoted to admin (password is then not needed / not changed).
*/
router.post('/', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const name  = String(req.body.name || '').trim()
    const permissions = clean(req.body.permissions)
    if (!email) return res.status(400).json({ success: false, error: 'Email is required.' })

    const existing = await User.findOne({ email })
    if (existing) {
      if (existing.role !== 'user')
        return res.status(400).json({ success: false, error: 'This email is already an admin.' })
      existing.role = 'admin'
      existing.permissions = permissions
      await existing.save({ validateBeforeSave: false })
      return res.status(201).json({ success: true, data: view(existing), promoted: true })
    }

    if (!name) return res.status(400).json({ success: false, error: 'Name is required for a new account.' })
    if (!req.body.password || String(req.body.password).length < 6)
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' })

    const user = await User.create({ name, email, password: req.body.password, role: 'admin', permissions })
    res.status(201).json({ success: true, data: view(user), promoted: false })
  } catch (err) {
    if (err.name === 'ValidationError')
      return res.status(400).json({ success: false, error: Object.values(err.errors)[0].message })
    res.status(400).json({ success: false, error: err.message })
  }
})

/* PATCH /api/admins/:id — change an admin's permissions (and optionally name / password) */
router.patch('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+password')
    if (!user || user.role !== 'admin')
      return res.status(404).json({ success: false, error: 'Admin not found (Super Admins cannot be edited here).' })

    if (req.body.permissions !== undefined) user.permissions = clean(req.body.permissions)
    if (req.body.name) user.name = String(req.body.name).trim()
    if (req.body.password) {
      if (String(req.body.password).length < 6)
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' })
      user.password = req.body.password   // hashed by the User model's pre-save hook
    }
    await user.save()
    res.json({ success: true, data: view(user) })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

/* DELETE /api/admins/:id — remove admin access (account stays as a normal customer) */
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user || user.role !== 'admin')
      return res.status(404).json({ success: false, error: 'Admin not found (Super Admins cannot be removed here).' })
    user.role = 'user'
    user.permissions = []
    await user.save({ validateBeforeSave: false })
    res.json({ success: true, message: 'Admin access removed.' })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

module.exports = router

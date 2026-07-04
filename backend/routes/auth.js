const express = require('express')
const jwt     = require('jsonwebtoken')
const crypto  = require('crypto')
const User    = require('../models/User')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

/* ─── helpers ─── */
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}
function sendTokenResponse(user, statusCode, res) {
  const token    = signToken(user._id)
  const userData = {
    id: user._id, name: user.name, email: user.email,
    role: user.role, orders: user.orders, joined: user.createdAt,
  }
  return res.status(statusCode).json({ success: true, token, user: userData })
}

/* ─── send mail helper (same pattern as contact.js) ─── */
async function sendMail({ to, subject, html }) {
  try {
    const nodemailer  = require('nodemailer')
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST  || 'smtp.gmail.com',
      port:   Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Hungry Hub'}" <${process.env.SMTP_USER}>`,
      to, subject, html,
    })
    console.log(`[EMAIL] ✅ Reset mail sent to ${to}`)
    return true
  } catch (err) {
    console.error('[EMAIL] ❌', err.message)
    return false
  }
}

/* ─── reset password email template ─── */
function resetEmailHtml(name, resetUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);max-width:540px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#C9952A;padding:28px 32px;text-align:center;">
            <div style="font-size:2rem;margin-bottom:6px;">🔐</div>
            <h1 style="margin:0;color:#fff;font-size:1.35rem;font-weight:800;">Reset Your Password</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:.82rem;">Hungry Hub · Account Security</p>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 10px;color:#374151;font-size:.95rem;">Hi <strong>${name}</strong> 👋</p>
          <p style="margin:0 0 20px;color:#6b7280;font-size:.88rem;line-height:1.6;">
            We received a request to reset the password for your Hungry Hub account.
            Click the button below — this link is valid for <strong>15 minutes</strong> only.
          </p>

          <!-- CTA Button -->
          <div style="text-align:center;margin:24px 0;">
            <a href="${resetUrl}"
              style="display:inline-block;background:#C9952A;color:#fff;padding:13px 32px;
                border-radius:10px;text-decoration:none;font-weight:800;font-size:.95rem;
                letter-spacing:.3px;box-shadow:0 4px 14px rgba(201,149,42,.35);">
              Reset Password →
            </a>
          </div>

          <!-- Warning box -->
          <div style="background:#fef3c7;border:1.5px solid #fcd34d;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
            <p style="margin:0;color:#92400e;font-size:.82rem;line-height:1.5;">
              ⚠️ <strong>Didn't request this?</strong> You can safely ignore this email.
              Your password will not change unless you click the link above.
            </p>
          </div>

          <!-- Fallback link -->
          <p style="margin:0;color:#9ca3af;font-size:.76rem;">
            If the button doesn't work, copy-paste this link in your browser:<br/>
            <a href="${resetUrl}" style="color:#C9952A;word-break:break-all;">${resetUrl}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:.73rem;color:#9ca3af;">
              © Hungry Hub &nbsp;·&nbsp; This link expires in 15 minutes.<br/>
              Do not share this email with anyone.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/* ════════════════════════════════════════
   POST /api/auth/register
════════════════════════════════════════ */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: 'Please provide name, email and password.' })
    if (password.length < 6)
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' })
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing)
      return res.status(409).json({ success: false, error: 'Email already registered.' })
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password })
    sendTokenResponse(user, 201, res)
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ success: false, error: messages[0] })
    }
    res.status(500).json({ success: false, error: 'Server error. Please try again.' })
  }
})

/* ════════════════════════════════════════
   POST /api/auth/login
════════════════════════════════════════ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Please provide email and password.' })
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, error: 'Invalid email or password.' })
    sendTokenResponse(user, 200, res)
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error. Please try again.' })
  }
})

/* ════════════════════════════════════════
   GET /api/auth/me
════════════════════════════════════════ */
router.get('/me', protect, async (req, res) => {
  const user = req.user
  res.json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, orders: user.orders, joined: user.createdAt },
  })
})

/* ════════════════════════════════════════
   POST /api/auth/logout
════════════════════════════════════════ */
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' })
})

/* ════════════════════════════════════════
   GET /api/auth/users
   Admin: get all registered users (for dashboard/user counts)
════════════════════════════════════════ */
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('name email role createdAt orders').sort({ createdAt: -1 })
    res.json({ success: true, users, total: users.length })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch users.' })
  }
})

/* ════════════════════════════════════════
   POST /api/auth/forgot-password
   Body: { email }
   → generates token → mails reset link
════════════════════════════════════════ */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email)
      return res.status(400).json({ success: false, error: 'Please provide your email address.' })

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    // Always respond success — don't reveal if email exists (security)
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email is registered, a reset link has been sent.',
      })
    }

    // Generate token and save to DB
    const rawToken = user.generateResetToken()
    await user.save({ validateBeforeSave: false })

    // Build reset URL — frontend will handle this route
    const resetUrl = `${process.env.FRONTEND_URL || 'https://restaurant-app-snowy-three.vercel.app/'}/reset-password/${rawToken}`

    const sent = await sendMail({
      to: user.email,
      subject: '🔐 Reset Your Password — Hungry Hub',
      html: resetEmailHtml(user.name, resetUrl),
    })

    if (!sent) {
      // Undo token if mail failed
      user.resetPasswordToken  = undefined
      user.resetPasswordExpire = undefined
      await user.save({ validateBeforeSave: false })
      return res.status(500).json({ success: false, error: 'Email could not be sent. Please try again.' })
    }

    res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ success: false, error: 'Server error. Please try again.' })
  }
})

/* ════════════════════════════════════════
   POST /api/auth/reset-password/:token
   Body: { password }
   → verifies token → resets password
════════════════════════════════════════ */
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body
    if (!password || password.length < 6)
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' })

    // Hash the incoming token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() },   // not expired
    }).select('+resetPasswordToken +resetPasswordExpire')

    if (!user)
      return res.status(400).json({ success: false, error: 'Reset link is invalid or has expired.' })

    // Set new password (pre-save hook will hash it)
    user.password            = password
    user.resetPasswordToken  = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    // Auto-login after reset
    sendTokenResponse(user, 200, res)
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ success: false, error: 'Server error. Please try again.' })
  }
})

module.exports = router
const express  = require('express')
const router   = express.Router()
const { protect, adminOnly } = require('../middleware/auth')
const Reservation     = require('../models/Reservation')
const ContactSettings = require('../models/ContactSettings')

/* ─────────────────────────────────────────
   SEND MAIL helper (nodemailer + Gmail)
───────────────────────────────────────── */
async function sendMail({ to, subject, html }) {
  try {
    const nodemailer  = require('nodemailer')
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'mail.aapkaai.com',
      port:   Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Hungry Hub'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    console.log(`[EMAIL] ✅ Sent to ${to} — "${subject}"`)
    return true
  } catch (err) {
    console.error('[EMAIL] ❌ Failed:', err.message)
    return false
  }
}

/* ─────────────────────────────────────────
   EMAIL TEMPLATES
───────────────────────────────────────── */
const GOLD   = '#C9952A'
const DARK   = '#0f1923'
const LIGHT  = '#fdf6e9'

function baseTemplate(headerColor, headerTitle, headerIcon, bodyHtml) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);max-width:560px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:${headerColor};padding:28px 32px;text-align:center;">
            <div style="font-size:2.2rem;margin-bottom:6px;">${headerIcon}</div>
            <h1 style="margin:0;color:#fff;font-size:1.4rem;font-weight:800;letter-spacing:.5px;">${headerTitle}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:.82rem;">Hungry Hub · Authentic Indian Cuisine</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr><td style="padding:28px 32px 24px;">${bodyHtml}</td></tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#fafafa;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:.74rem;color:#9ca3af;">
              © Hungry Hub &nbsp;·&nbsp; This is an automated email, please do not reply directly.<br/>
              If you have questions, call us or visit our website.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/* — Template 1: Reservation RECEIVED (customer ko turant bheji jaaye) — */
function tplReceived({ name, date, guests, phone, message }) {
  const body = `
    <p style="margin:0 0 8px;color:#374151;font-size:1rem;">Hi <strong>${name}</strong> 👋</p>
    <p style="margin:0 0 20px;color:#6b7280;font-size:.9rem;line-height:1.6;">
      Thank you for choosing <strong>Hungry Hub</strong>! We've received your table reservation
      request and our team will review it shortly.
    </p>

    <!-- Booking summary box -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:${LIGHT};border:1.5px solid ${GOLD};border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:18px 20px;">
        <div style="font-size:.72rem;font-weight:800;letter-spacing:.08em;color:${GOLD};margin-bottom:12px;">
          📋 BOOKING SUMMARY
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:.88rem;">
          <tr>
            <td style="padding:5px 0;color:#9ca3af;width:130px;">📅 Date &amp; Time</td>
            <td style="padding:5px 0;font-weight:700;color:${DARK};">${date}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#9ca3af;">👥 Guests</td>
            <td style="padding:5px 0;font-weight:700;color:${DARK};">${guests} person(s)</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#9ca3af;">📞 Phone</td>
            <td style="padding:5px 0;color:${DARK};">${phone || '—'}</td>
          </tr>
          ${message ? `
          <tr>
            <td style="padding:5px 0;color:#9ca3af;vertical-align:top;">💬 Your Note</td>
            <td style="padding:5px 0;color:${DARK};">${message}</td>
          </tr>` : ''}
        </table>
      </td></tr>
    </table>

    <!-- Status badge -->
    <div style="background:#dbeafe;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:1.1rem;">🕐</span>
      <div>
        <strong style="color:#1e40af;font-size:.85rem;">Status: Pending Review</strong><br/>
        <span style="color:#3b82f6;font-size:.78rem;">You'll receive another email once our team confirms or updates your booking (usually within 2 hours).</span>
      </div>
    </div>

    <p style="margin:0;color:#9ca3af;font-size:.8rem;text-align:center;">
      We look forward to welcoming you! 🍽️
    </p>`

  return baseTemplate(GOLD, 'Reservation Received!', '🍽️', body)
}

/* — Template 2: Reservation CONFIRMED — */
function tplConfirmed({ name, date, guests, adminNote }) {
  const body = `
    <p style="margin:0 0 8px;color:#374151;font-size:1rem;">Hi <strong>${name}</strong> 🎉</p>
    <p style="margin:0 0 20px;color:#6b7280;font-size:.9rem;line-height:1.6;">
      Great news! Your table reservation at <strong>Hungry Hub</strong> has been
      <strong style="color:#059669;">confirmed</strong>. We can't wait to see you!
    </p>

    <!-- Booking box -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f0fdf4;border:1.5px solid #6ee7b7;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:18px 20px;">
        <div style="font-size:.72rem;font-weight:800;letter-spacing:.08em;color:#059669;margin-bottom:12px;">
          ✅ CONFIRMED BOOKING
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:.88rem;">
          <tr>
            <td style="padding:5px 0;color:#9ca3af;width:130px;">📅 Date &amp; Time</td>
            <td style="padding:5px 0;font-weight:700;color:${DARK};">${date}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#9ca3af;">👥 Guests</td>
            <td style="padding:5px 0;font-weight:700;color:${DARK};">${guests} person(s)</td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${adminNote ? `
    <!-- Admin note -->
    <div style="background:#fef3c7;border:1.5px solid #fcd34d;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
      <div style="font-size:.72rem;font-weight:800;letter-spacing:.08em;color:#92400e;margin-bottom:6px;">📝 NOTE FROM RESTAURANT</div>
      <p style="margin:0;color:#78350f;font-size:.88rem;line-height:1.5;">${adminNote}</p>
    </div>` : ''}

    <!-- Reminder tips -->
    <div style="background:#f9fafb;border-radius:10px;padding:14px 16px;margin-bottom:8px;">
      <div style="font-size:.72rem;font-weight:800;letter-spacing:.08em;color:#374151;margin-bottom:8px;">🗒️ THINGS TO REMEMBER</div>
      <ul style="margin:0;padding-left:16px;color:#6b7280;font-size:.83rem;line-height:1.8;">
        <li>Please arrive 5–10 minutes before your reserved time.</li>
        <li>For changes or cancellations, contact us at least 2 hours in advance.</li>
        <li>Your table will be held for 15 minutes after the booking time.</li>
      </ul>
    </div>

    <p style="margin:16px 0 0;color:#9ca3af;font-size:.8rem;text-align:center;">
      See you soon! 🌟
    </p>`

  return baseTemplate('#059669', 'Reservation Confirmed! ✅', '✅', body)
}

/* — Template 3: Reservation CANCELLED — */
function tplCancelled({ name, date, guests, adminNote }) {
  const body = `
    <p style="margin:0 0 8px;color:#374151;font-size:1rem;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 20px;color:#6b7280;font-size:.9rem;line-height:1.6;">
      We're sorry to inform you that your reservation at <strong>Hungry Hub</strong>
      has been <strong style="color:#dc2626;">cancelled</strong>.
    </p>

    <!-- Booking box -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#fff5f5;border:1.5px solid #fca5a5;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:18px 20px;">
        <div style="font-size:.72rem;font-weight:800;letter-spacing:.08em;color:#dc2626;margin-bottom:12px;">
          ❌ CANCELLED BOOKING
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:.88rem;">
          <tr>
            <td style="padding:5px 0;color:#9ca3af;width:130px;">📅 Date &amp; Time</td>
            <td style="padding:5px 0;font-weight:700;color:${DARK};">${date}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#9ca3af;">👥 Guests</td>
            <td style="padding:5px 0;font-weight:700;color:${DARK};">${guests} person(s)</td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${adminNote ? `
    <div style="background:#fef3c7;border:1.5px solid #fcd34d;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
      <div style="font-size:.72rem;font-weight:800;letter-spacing:.08em;color:#92400e;margin-bottom:6px;">📝 REASON / NOTE FROM RESTAURANT</div>
      <p style="margin:0;color:#78350f;font-size:.88rem;line-height:1.5;">${adminNote}</p>
    </div>` : ''}

    <!-- Re-book CTA -->
    <div style="background:#fdf6e9;border:1.5px solid ${GOLD};border-radius:10px;padding:16px;text-align:center;margin-bottom:8px;">
      <p style="margin:0 0 10px;color:#374151;font-size:.88rem;">
        We'd love to have you again! You can make a new reservation anytime.
      </p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/contact"
        style="display:inline-block;background:${GOLD};color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:.85rem;">
        Book Again →
      </a>
    </div>

    <p style="margin:16px 0 0;color:#9ca3af;font-size:.8rem;text-align:center;">
      We apologise for any inconvenience. 🙏
    </p>`

  return baseTemplate('#dc2626', 'Reservation Cancelled', '❌', body)
}

/* — Template 4: Admin notification (new reservation aa gayi) — */
function tplAdminNewReservation({ name, email, phone, date, guests, message, reservationId }) {
  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:.9rem;">
      A new table reservation has been submitted. Please review and confirm or cancel from the admin panel.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:${LIGHT};border:1.5px solid ${GOLD};border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:18px 20px;">
        <div style="font-size:.72rem;font-weight:800;letter-spacing:.08em;color:${GOLD};margin-bottom:12px;">GUEST DETAILS</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:.88rem;">
          <tr><td style="padding:5px 0;color:#9ca3af;width:130px;">👤 Name</td><td style="font-weight:700;color:${DARK};">${name}</td></tr>
          <tr><td style="padding:5px 0;color:#9ca3af;">📧 Email</td><td style="color:${DARK};">${email}</td></tr>
          <tr><td style="padding:5px 0;color:#9ca3af;">📞 Phone</td><td style="color:${DARK};">${phone || '—'}</td></tr>
          <tr><td style="padding:5px 0;color:#9ca3af;">📅 Date &amp; Time</td><td style="font-weight:700;color:${GOLD};">${date}</td></tr>
          <tr><td style="padding:5px 0;color:#9ca3af;">👥 Guests</td><td style="color:${DARK};">${guests} person(s)</td></tr>
          ${message ? `<tr><td style="padding:5px 0;color:#9ca3af;vertical-align:top;">💬 Message</td><td style="color:${DARK};">${message}</td></tr>` : ''}
        </table>
      </td></tr>
    </table>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/reservations"
        style="display:inline-block;background:${GOLD};color:#fff;padding:11px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:.88rem;letter-spacing:.3px;">
        Open Admin Panel →
      </a>
    </div>`

  return baseTemplate(GOLD, '🍽️ New Reservation Request', '🔔', body)
}

/* ─────────────────────────────────────────
   SETTINGS helper
───────────────────────────────────────── */
async function getSettings() {
  let doc = await ContactSettings.findOne({ key: 'main' })
  if (!doc) doc = await ContactSettings.create({ key: 'main' })
  return doc
}

/* ══════════════════════════════════════
   PUBLIC — GET /api/contact/info
══════════════════════════════════════ */
router.get('/info', async (req, res) => {
  try {
    const doc = await getSettings()
    res.json({ success: true, data: doc })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

/* ══════════════════════════════════════
   ADMIN — PUT /api/contact/settings
══════════════════════════════════════ */
router.put('/settings', protect, adminOnly, async (req, res) => {
  try {
    const allowed = [
      'address','city','phone','phone2','email','email2',
      'hours','hours2','mapLabel','mapImg','mapEmbed',
      'mapNearby1','mapNearby2','mapNearby3'
    ]
    const update = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k] })
    const doc = await ContactSettings.findOneAndUpdate(
      { key: 'main' },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    )
    res.json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

/* ══════════════════════════════════════
   PUBLIC — POST /api/contact/reservation
   Customer reservation submit karta hai
══════════════════════════════════════ */
router.post('/reservation', async (req, res) => {
  try {
    const { name, email, phone, guests, date, message } = req.body
    if (!name || !email || !date)
      return res.status(400).json({ success: false, error: 'Name, email and date are required.' })

    const reservation = await Reservation.create({ name, email, phone, guests, date, message })

    // 1) Admin ko notify karo
    const settings   = await getSettings()
    const adminEmail = process.env.ADMIN_EMAIL || settings.email || process.env.SMTP_USER

    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `🔔 New Reservation — ${name} (${guests} guests, ${date})`,
        html: tplAdminNewReservation({ name, email, phone, date, guests, message, reservationId: reservation._id }),
      })
    }

    // 2) Customer ko "received" confirmation bheji
    await sendMail({
      to: email,
      subject: `✅ Reservation Received — Hungry Hub`,
      html: tplReceived({ name, date, guests, phone, message }),
    })

    res.status(201).json({ success: true, data: reservation })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

/* ══════════════════════════════════════
   ADMIN — GET /api/contact/reservations
══════════════════════════════════════ */
router.get('/reservations', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 30 } = req.query
    const filter = status && status !== 'all' ? { status } : {}
    const total  = await Reservation.countDocuments(filter)
    const data   = await Reservation.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
    res.json({ success: true, data, total, page: Number(page) })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

/* ══════════════════════════════════════
   ADMIN — PATCH /api/contact/reservations/:id
   Admin approve/reject karta hai — customer ko mail jaati hai
══════════════════════════════════════ */
router.patch('/reservations/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body
    const update = {}
    if (status)                  update.status    = status
    if (adminNote !== undefined) update.adminNote = adminNote

    const doc = await Reservation.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!doc) return res.status(404).json({ success: false, error: 'Reservation not found' })

    // Customer ko status update mail bheji
    if (status === 'confirmed') {
      await sendMail({
        to: doc.email,
        subject: `🎉 Your Reservation is Confirmed — Hungry Hub`,
        html: tplConfirmed({
          name:      doc.name,
          date:      doc.date,
          guests:    doc.guests,
          adminNote: adminNote || doc.adminNote || '',
        }),
      })
    } else if (status === 'cancelled') {
      await sendMail({
        to: doc.email,
        subject: `❌ Reservation Cancelled — Hungry Hub`,
        html: tplCancelled({
          name:      doc.name,
          date:      doc.date,
          guests:    doc.guests,
          adminNote: adminNote || doc.adminNote || '',
        }),
      })
    }

    res.json({ success: true, data: doc })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
})

/* ══════════════════════════════════════
   ADMIN — DELETE /api/contact/reservations/:id
══════════════════════════════════════ */
router.delete('/reservations/:id', protect, adminOnly, async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

module.exports = router
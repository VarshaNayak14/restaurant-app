/*
  Email helper for orders, hotel bookings and cab bookings.
  Uses the same SMTP settings as routes/contact.js (table reservations).
  Every send is "fire and forget": a failed email never fails the request.
*/
const nodemailer = require('nodemailer')

const GOLD = '#C9952A'
const SITE = () => process.env.FRONTEND_URL || 'restaurant-app-snowy-three.vercel.app'

async function sendMail({ to, subject, html }) {
  if (!to || !process.env.SMTP_USER) return false
  try {
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'mail.aapkaai.com',
      port:   Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Hungry Hub'}" <${process.env.SMTP_USER}>`,
      to, subject, html,
    })
    console.log(`[EMAIL] ✅ Sent to ${to} — "${subject}"`)
    return true
  } catch (err) {
    console.error('[EMAIL] ❌ Failed:', err.message)
    return false
  }
}

// Don't make the API wait for SMTP
function sendLater(opts) { sendMail(opts).catch(() => {}) }

function adminEmail() { return process.env.ADMIN_EMAIL || process.env.SMTP_USER }

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

function fmtDate(str, withTime = true) {
  if (!str) return '—'
  const d = new Date(str)
  if (isNaN(d)) return esc(str)
  return d.toLocaleString('en-IN', withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' })
}

function layout(color, title, icon, body) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
<tr><td style="background:${color};padding:26px 32px;text-align:center;">
  <div style="font-size:2rem;margin-bottom:6px;">${icon}</div>
  <h1 style="margin:0;color:#fff;font-size:1.35rem;">${title}</h1>
  <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:.8rem;">Hungry Hub</p>
</td></tr>
<tr><td style="padding:26px 32px;color:#374151;font-size:.92rem;line-height:1.6;">${body}</td></tr>
<tr><td style="background:#fafafa;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;font-size:.74rem;color:#9ca3af;">
  © Hungry Hub · This is an automated email, please do not reply directly.
</td></tr></table></td></tr></table></body></html>`
}

function rows(pairs) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;margin:14px 0;">
${pairs.filter(Boolean).map(([k, v], i) => `<tr><td style="padding:9px 14px;color:#6b7280;font-size:.84rem;${i ? 'border-top:1px solid #f3f4f6;' : ''}">${k}</td>
<td style="padding:9px 14px;text-align:right;font-weight:600;color:#111827;font-size:.86rem;${i ? 'border-top:1px solid #f3f4f6;' : ''}">${v}</td></tr>`).join('')}
</table>`
}

function button(href, label) {
  return `<p style="text-align:center;margin:20px 0 6px;"><a href="${href}" style="background:${GOLD};color:#fff;text-decoration:none;padding:11px 26px;border-radius:8px;font-weight:700;display:inline-block;">${label}</a></p>`
}

const CAR = { auto: 'Auto', mini: 'Mini', sedan: 'Sedan', suv: 'SUV' }
const TRIP = { pickup: 'Pickup only', drop: 'Drop only', round: 'Round trip' }

function cabRows(cab) {
  return rows([
    ['Car', `${CAR[cab.carType] || cab.carType} · ${TRIP[cab.tripType] || cab.tripType}`],
    ['From', esc(cab.pickupAddress)],
    ['To', esc(cab.dropAddress)],
    cab.pickupTime && ['Pickup time', fmtDate(cab.pickupTime)],
    cab.returnTime && ['Return time', fmtDate(cab.returnTime)],
    cab.driverName && ['Driver', esc(cab.driverName)],
    cab.driverPhone && ['Driver phone', esc(cab.driverPhone)],
    cab.vehicleNumber && ['Vehicle no.', esc(cab.vehicleNumber)],
    ['Estimated fare', `₹${cab.estimatedFare}`],
  ])
}

/* ══════════ Food orders ══════════ */
function orderPlaced(order) {
  const bill = `${SITE()}/invoice/${order._id}`
  const items = order.items.map(i => [`${esc(i.name)} × ${i.qty}`, `₹${i.price * i.qty}`])
  sendLater({
    to: order.userEmail,
    subject: `🧾 Order ${order.orderId} confirmed — your bill`,
    html: layout(GOLD, 'Order Confirmed!', '🧾', `
      <p>Hi <strong>${esc(order.userName)}</strong>, thank you for your order! Here is your bill summary.</p>
      ${rows([['Invoice No.', order.orderId], ...items,
        order.discount > 0 && ['Discount', `− ₹${order.discount}`],
        ['Delivery', order.delivery ? `₹${order.delivery}` : 'FREE'],
        ['Grand Total', `<span style="color:${GOLD}">₹${order.total}</span>`]])}
      ${button(bill, 'View / Download Bill')}`),
  })
  sendLater({
    to: adminEmail(),
    subject: `🔔 New order ${order.orderId} — ₹${order.total}`,
    html: layout(GOLD, 'New Order', '🔔', `
      ${rows([['Customer', esc(order.userName)], ['Email', esc(order.userEmail)], ['Items', order.items.length], ['Total', `₹${order.total}`], ['Payment', order.payment.toUpperCase()]])}
      ${button(`${SITE()}/admin/orders`, 'Open Admin Panel')}`),
  })
}

/* ══════════ Hotel bookings ══════════ */
function hotelBooked(booking, cab) {
  const bill = `${SITE()}/booking-bill/hotel/${booking._id}`
  const details = rows([
    ['Hotel', esc(booking.hotelName)],
    ['Check-in', fmtDate(booking.checkIn, false)],
    ['Check-out', fmtDate(booking.checkOut, false)],
    ['Nights / Rooms', `${booking.nights} / ${booking.rooms}`],
    ['Guests', booking.guests],
    ['Hotel total', `₹${booking.totalAmount}`],
  ])
  sendLater({
    to: booking.email,
    subject: `🏨 Booking received — ${booking.hotelName}`,
    html: layout(GOLD, 'Hotel Booking Received', '🏨', `
      <p>Hi <strong>${esc(booking.name)}</strong>, we have received your booking. We will confirm it shortly.</p>
      ${details}${cab ? `<p style="margin:16px 0 0;font-weight:700;">🚖 Your cab</p>${cabRows(cab)}` : ''}
      ${button(bill, 'View Bill')}`),
  })
  sendLater({
    to: adminEmail(),
    subject: `🔔 New hotel booking — ${booking.name} (${booking.hotelName})${cab ? ' + cab' : ''}`,
    html: layout(GOLD, 'New Hotel Booking', '🔔', `
      ${rows([['Customer', esc(booking.name)], ['Email', esc(booking.email)], ['Phone', esc(booking.phone) || '—']])}
      ${details}${cab ? `<p style="font-weight:700;">🚖 Cab requested</p>${cabRows(cab)}` : ''}
      ${button(`${SITE()}/admin/hotels`, 'Open Admin Panel')}`),
  })
}

function hotelStatus(booking) {
  if (!['confirmed', 'cancelled'].includes(booking.status)) return
  const ok = booking.status === 'confirmed'
  sendLater({
    to: booking.email,
    subject: ok ? `✅ Hotel booking confirmed — ${booking.hotelName}` : `❌ Hotel booking cancelled — ${booking.hotelName}`,
    html: layout(ok ? '#059669' : '#dc2626', ok ? 'Booking Confirmed' : 'Booking Cancelled', ok ? '✅' : '❌', `
      <p>Hi <strong>${esc(booking.name)}</strong>, your booking at <strong>${esc(booking.hotelName)}</strong> has been <strong>${booking.status}</strong>.</p>
      ${rows([['Check-in', fmtDate(booking.checkIn, false)], ['Check-out', fmtDate(booking.checkOut, false)], ['Total', `₹${booking.totalAmount}`],
        booking.adminNote && ['Note', esc(booking.adminNote)]])}
      ${ok ? button(`${SITE()}/booking-bill/hotel/${booking._id}`, 'View Bill') : ''}`),
  })
}

/* ══════════ Cab bookings ══════════ */
function cabBooked(cab) {
  sendLater({
    to: cab.email,
    subject: `🚖 Cab request received${cab.venueName ? ` — ${cab.venueName}` : ''}`,
    html: layout(GOLD, 'Cab Request Received', '🚖', `
      <p>Hi <strong>${esc(cab.name)}</strong>, we have received your cab request. Driver details will be shared once assigned.</p>
      ${cabRows(cab)}${button(`${SITE()}/booking-bill/cab/${cab._id}`, 'View Bill')}`),
  })
  sendLater({
    to: adminEmail(),
    subject: `🔔 New cab request — ${cab.name}${cab.linkedType !== 'none' ? ` (${cab.linkedType})` : ''}`,
    html: layout(GOLD, 'New Cab Request', '🔔', `
      ${rows([['Customer', esc(cab.name)], ['Email', esc(cab.email)], ['Phone', esc(cab.phone) || '—'], ['For', cab.venueName ? esc(cab.venueName) : 'Standalone']])}
      ${cabRows(cab)}${button(`${SITE()}/admin/cabs`, 'Assign Driver')}`),
  })
}

function cabStatus(cab) {
  const MSG = {
    confirmed: ['#059669', 'Cab Confirmed', '✅', 'Your cab is confirmed. Driver details will follow soon.'],
    assigned:  ['#7c3aed', 'Driver Assigned', '🚖', 'Your driver has been assigned. Details below.'],
    cancelled: ['#dc2626', 'Cab Cancelled', '❌', 'Your cab booking has been cancelled.'],
  }[cab.status]
  if (!MSG) return
  sendLater({
    to: cab.email,
    subject: `${MSG[2]} ${MSG[1]} — Hungry Hub`,
    html: layout(MSG[0], MSG[1], MSG[2], `
      <p>Hi <strong>${esc(cab.name)}</strong>, ${MSG[3]}</p>
      ${cabRows(cab)}${cab.adminNote ? `<p><strong>Note:</strong> ${esc(cab.adminNote)}</p>` : ''}`),
  })
}

module.exports = { sendMail, orderPlaced, hotelBooked, hotelStatus, cabBooked, cabStatus }

import { API_BASE } from './dishes.js'

/* ── Public: list active, public coupons for the "Offers" section ── */
export async function fetchActiveCoupons() {
  const res = await fetch(`${API_BASE}/coupons/active`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch offers.')
  return data.coupons
}

/* ── User: validate/apply a coupon code at checkout ── */
export async function validateCoupon(code, items, cartTotal, token) {
  const res = await fetch(`${API_BASE}/coupons/validate`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ code, items, cartTotal }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Invalid coupon code.')
  return data // { success, discount, coupon }
}

/* ── Admin: list all coupons ── */
export async function fetchCoupons(token) {
  const res = await fetch(`${API_BASE}/coupons`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch coupons.')
  return data.coupons
}

/* ── Admin: create coupon ── */
export async function createCoupon(coupon, token) {
  const res = await fetch(`${API_BASE}/coupons`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify(coupon),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to create coupon.')
  return data.coupon
}

/* ── Admin: update coupon ── */
export async function updateCoupon(id, coupon, token) {
  const res = await fetch(`${API_BASE}/coupons/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify(coupon),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to update coupon.')
  return data.coupon
}

/* ── Admin: delete coupon ── */
export async function deleteCoupon(id, token) {
  const res = await fetch(`${API_BASE}/coupons/${id}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to delete coupon.')
  return true
}
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, X, CheckCircle, Loader2, Tag, TicketPercent, PackageOpen, Percent, IndianRupee, CalendarClock, UtensilsCrossed } from 'lucide-react'
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon } from '../data/coupons.js'
import { fetchDishes } from '../data/dishes.js'
import { useAuth } from '../context/AuthContext.jsx'
import './AdminDishes.css'
import './AdminCoupons.css'

const emptyForm = {
  code: '',
  description: '',
  discountType: 'percentage', // 'percentage' | 'flat'
  discountValue: '',
  maxDiscount: '',
  minOrderValue: '',
  usageLimit: '',
  perUserLimit: '1',
  expiryDate: '',
  active: true,
  applicableDishes: [], // khaali = poore cart pe applicable
}

// date input ko chahiye 'YYYY-MM-DD' format
function toDateInput(dateVal) {
  if (!dateVal) return ''
  const d = new Date(dateVal)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function couponStatus(c) {
  const now = new Date()
  const expiry = new Date(c.expiryDate)
  if (!c.active) return { label: 'Disabled', cls: 'off' }
  if (now > expiry) return { label: 'Expired', cls: 'expired' }
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { label: 'Limit Reached', cls: 'expired' }
  return { label: 'Active', cls: 'live' }
}

export default function AdminCoupons() {
  const { getToken } = useAuth()

  const [coupons, setCoupons]       = useState([])
  const [dishes, setDishes]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  const [form, setForm]             = useState(emptyForm)
  const [editCoupon, setEditCoupon] = useState(null) // coupon being edited (null = add mode)

  async function refresh() {
    try {
      setLoading(true)
      const [c, d] = await Promise.all([fetchCoupons(getToken()), fetchDishes()])
      setCoupons(c)
      setDishes(d)
    } catch (err) {
      setError(err.message || 'Failed to load coupons.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  function resetForm() {
    setForm(emptyForm)
    setEditCoupon(null)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : (name === 'code' ? value.toUpperCase() : value),
    }))
  }

  function toggleDish(dishId) {
    setForm(f => {
      const exists = f.applicableDishes.includes(dishId)
      return {
        ...f,
        applicableDishes: exists
          ? f.applicableDishes.filter(id => id !== dishId)
          : [...f.applicableDishes, dishId],
      }
    })
  }

  function openEdit(c) {
    setEditCoupon(c)
    setForm({
      code: c.code || '',
      description: c.description || '',
      discountType: c.discountType,
      discountValue: c.discountValue ?? '',
      maxDiscount: c.maxDiscount ?? '',
      minOrderValue: c.minOrderValue ?? '',
      usageLimit: c.usageLimit ?? '',
      perUserLimit: c.perUserLimit ?? '1',
      expiryDate: toDateInput(c.expiryDate),
      active: c.active,
      applicableDishes: (c.applicableDishes || []).map(d => d._id || d),
    })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!form.code.trim()) { setError('Coupon code is required.'); return }
    if (!form.discountValue || Number(form.discountValue) <= 0) { setError('Discount value must be greater than 0.'); return }
    if (form.discountType === 'percentage' && Number(form.discountValue) > 100) { setError('Percentage discount cannot exceed 100.'); return }
    if (!form.expiryDate) { setError('Please set an expiry date.'); return }

    setSubmitting(true)
    try {
      const token = getToken()
      const payload = {
        code: form.code.trim(),
        description: form.description,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscount: form.discountType === 'percentage' && form.maxDiscount ? Number(form.maxDiscount) : null,
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        applicableDishes: form.applicableDishes,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : 1,
        expiryDate: new Date(form.expiryDate + 'T23:59:59').toISOString(),
        active: form.active,
      }
      if (editCoupon) {
        await updateCoupon(editCoupon._id, payload, token)
        setSuccess('Coupon updated successfully.')
      } else {
        await createCoupon(payload, token)
        setSuccess('Coupon created successfully.')
      }
      resetForm()
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to save coupon.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, code) {
    if (!confirm(`Delete coupon "${code}"?`)) return
    try {
      await deleteCoupon(id, getToken())
      if (editCoupon?._id === id) resetForm()
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to delete coupon.')
    }
  }

  return (
    <div className="admin-dishes admin-coupons">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Coupon Codes</h1>
          <p className="dash-sub">Create discount coupons — customers can apply them at checkout to get money off their order.</p>
        </div>
      </div>

      <div className="dishes-layout">
        {/* ── Coupon Form ── */}
        <div className="dash-card add-dish-card">
          <div className="card-head">
            <h3 className="card-title">
              {editCoupon
                ? <><Pencil size={16} style={{ verticalAlign: '-3px' }} /> Edit Coupon</>
                : <><Plus size={16} style={{ verticalAlign: '-3px' }} /> Create New Coupon</>}
            </h3>
            {editCoupon && (
              <button type="button" className="row-delete-btn" onClick={resetForm} title="Cancel edit"><X size={15} /></button>
            )}
          </div>

          <form className="add-dish-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label><Tag size={13} style={{ verticalAlign: '-2px' }} /> Coupon Code</label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. WELCOME50"
                maxLength={20}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-row">
              <label>Description (optional)</label>
              <input type="text" name="description" value={form.description} onChange={handleChange} placeholder="e.g. Flat ₹50 off on first order" />
            </div>

            <div className="form-row form-row-split">
              <div>
                <label>Discount Type</label>
                <select name="discountType" value={form.discountType} onChange={handleChange}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label>
                  {form.discountType === 'percentage'
                    ? <><Percent size={13} style={{ verticalAlign: '-2px' }} /> Discount %</>
                    : <><IndianRupee size={13} style={{ verticalAlign: '-2px' }} /> Discount ₹</>}
                </label>
                <input
                  type="number"
                  name="discountValue"
                  min="1"
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  value={form.discountValue}
                  onChange={handleChange}
                  placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 100'}
                />
              </div>
            </div>

            {form.discountType === 'percentage' && (
              <div className="form-row">
                <label>Max Discount Cap ₹ (optional)</label>
                <input
                  type="number"
                  name="maxDiscount"
                  min="1"
                  value={form.maxDiscount}
                  onChange={handleChange}
                  placeholder="e.g. 150 — no cap if left empty"
                />
              </div>
            )}

            <div className="form-row form-row-split">
              <div>
                <label>Min Order Value ₹</label>
                <input type="number" name="minOrderValue" min="0" value={form.minOrderValue} onChange={handleChange} placeholder="e.g. 299" />
              </div>
              <div>
                <label><CalendarClock size={13} style={{ verticalAlign: '-2px' }} /> Expiry Date</label>
                <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <label><UtensilsCrossed size={13} style={{ verticalAlign: '-2px' }} /> Applicable Dishes (optional)</label>
              <p className="coupon-picker-hint">
                Kuch bhi select mat karo agar coupon poore cart pe chalna chahiye. Dishes select karoge to discount sirf unhi dishes ke amount pe lagega.
              </p>
              <div className="offer-dish-picker">
                {dishes.length === 0 ? (
                  <p className="no-offer" style={{ padding: '10px 0' }}>No dishes found.</p>
                ) : dishes.map(d => {
                  const checked = form.applicableDishes.includes(d.id)
                  return (
                    <div key={d.id} className={`offer-dish-row ${checked ? 'checked' : ''}`}>
                      <label className="offer-dish-check">
                        <input type="checkbox" checked={checked} onChange={() => toggleDish(d.id)} />
                        <img src={d.image} alt={d.name} className="offer-dish-thumb" />
                        <div className="offer-dish-info">
                          <span className="offer-dish-name">{d.name}</span>
                          <span className="offer-dish-price">₹{d.price}</span>
                        </div>
                      </label>
                    </div>
                  )
                })}
              </div>
              {form.applicableDishes.length > 0 && (
                <p className="coupon-picker-count">{form.applicableDishes.length} dish(es) selected</p>
              )}
            </div>

            <div className="form-row form-row-split">
              <div>
                <label>Total Usage Limit (optional)</label>
                <input type="number" name="usageLimit" min="1" value={form.usageLimit} onChange={handleChange} placeholder="Unlimited if empty" />
              </div>
              <div>
                <label>Per User Limit</label>
                <input type="number" name="perUserLimit" min="1" value={form.perUserLimit} onChange={handleChange} placeholder="e.g. 1" />
              </div>
            </div>

            <div className="form-row form-checkbox-row">
              <label className="checkbox-label">
                <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
                <TicketPercent size={14} /> Coupon Enabled
              </label>
            </div>

            {error   && <p className="form-error">{error}</p>}
            {success && <p className="form-success"><CheckCircle size={14} style={{ verticalAlign: '-2px', marginRight: 5 }} />{success}</p>}

            <button type="submit" className="add-dish-submit" disabled={submitting}>
              {submitting
                ? <><Loader2 size={15} className="spin-icon" /> Saving…</>
                : editCoupon ? <><CheckCircle size={16} /> Save Changes</> : <><Plus size={16} /> Create Coupon</>}
            </button>
          </form>
        </div>

        {/* ── All Coupons List ── */}
        <div className="dash-card dishes-list-card">
          <div className="card-head">
            <h3 className="card-title"><TicketPercent size={16} style={{ verticalAlign: '-3px' }} /> All Coupons</h3>
            <span className="card-badge">{coupons.length} total</span>
          </div>

          {loading ? (
            <div className="empty-dishes-state"><Loader2 size={30} className="spin-icon" /><p>Loading coupons…</p></div>
          ) : coupons.length === 0 ? (
            <div className="empty-dishes-state">
              <PackageOpen size={36} />
              <p>No coupons created yet.</p>
              <span>Create one using the form on the left — customers will be able to apply it at checkout.</span>
            </div>
          ) : (
            <div className="dishes-table-wrap">
              <table className="dishes-table">
                <thead>
                  <tr>
                    <th>Code</th><th>Discount</th><th>Applies To</th><th>Min Order</th><th>Usage</th><th>Expires</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => {
                    const status = couponStatus(c)
                    return (
                      <tr key={c._id}>
                        <td className="dish-name-cell">
                          {c.code}
                          {c.description && <div className="coupon-desc-sub">{c.description}</div>}
                        </td>
                        <td>
                          {c.discountType === 'percentage'
                            ? `${c.discountValue}%${c.maxDiscount ? ` (upto ₹${c.maxDiscount})` : ''}`
                            : `₹${c.discountValue} flat`}
                        </td>
                        <td>
                          {c.applicableDishes && c.applicableDishes.length > 0
                            ? <span className="coupon-dish-tag">{c.applicableDishes.length} dish{c.applicableDishes.length !== 1 ? 'es' : ''}</span>
                            : <span className="coupon-dish-tag coupon-dish-tag-all">All dishes</span>}
                        </td>
                        <td>{c.minOrderValue > 0 ? `₹${c.minOrderValue}` : '—'}</td>
                        <td>{c.usedCount}{c.usageLimit != null ? ` / ${c.usageLimit}` : ' / ∞'}</td>
                        <td>{new Date(c.expiryDate).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td><span className={`offer-status offer-status-${status.cls}`}>{status.label}</span></td>
                        <td className="action-btns">
                          <button className="row-edit-btn" onClick={() => openEdit(c)} title="Edit coupon"><Pencil size={14} /></button>
                          <button className="row-delete-btn" onClick={() => handleDelete(c._id, c.code)} title="Delete coupon"><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
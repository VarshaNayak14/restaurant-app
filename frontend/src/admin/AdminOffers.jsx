import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, X, CheckCircle, Loader2, Tag, Clock, PackageOpen, Zap, Timer, CalendarClock } from 'lucide-react'
import { fetchDishes, fetchOffers, createOffer, updateOffer, deleteOffer } from '../data/dishes.js'
import { useAuth } from '../context/AuthContext.jsx'
import './AdminDishes.css'
import './AdminOffers.css'

const emptyForm = {
  title: 'Flash Offer',
  subtitle: '',
  startAt: '',
  endAt: '',
  active: true,
  items: [], // [{ dish: id, discount: '' }]
}

// datetime-local input ko chahiye 'YYYY-MM-DDTHH:mm' local format me
function toLocalInput(dateVal) {
  if (!dateVal) return ''
  const d = new Date(dateVal)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function offerStatus(offer) {
  const now = new Date()
  const start = new Date(offer.startAt)
  const end = new Date(offer.endAt)
  if (!offer.active) return { label: 'Disabled', cls: 'off' }
  if (now < start) return { label: 'Upcoming', cls: 'upcoming' }
  if (now > end) return { label: 'Expired', cls: 'expired' }
  return { label: 'Live now', cls: 'live' }
}

export default function AdminOffers() {
  const { getToken } = useAuth()

  const [dishes, setDishes]         = useState([])
  const [offers, setOffers]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  const [form, setForm]         = useState(emptyForm)
  const [editOffer, setEditOffer] = useState(null) // offer being edited (null = add mode)

  async function refresh() {
    try {
      setLoading(true)
      const [d, o] = await Promise.all([fetchDishes(), fetchOffers(getToken())])
      setDishes(d)
      setOffers(o)
    } catch (err) {
      setError(err.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  function resetForm() {
    setForm(emptyForm)
    setEditOffer(null)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  function toggleDish(dishId) {
    setForm(f => {
      const exists = f.items.find(it => it.dish === dishId)
      if (exists) return { ...f, items: f.items.filter(it => it.dish !== dishId) }
      return { ...f, items: [...f.items, { dish: dishId, discount: '' }] }
    })
  }

  function setItemDiscount(dishId, discount) {
    setForm(f => ({
      ...f,
      items: f.items.map(it => it.dish === dishId ? { ...it, discount } : it),
    }))
  }

  function openEdit(offer) {
    setEditOffer(offer)
    setForm({
      title: offer.title || '',
      subtitle: offer.subtitle || '',
      startAt: toLocalInput(offer.startAt),
      endAt: toLocalInput(offer.endAt),
      active: offer.active,
      items: (offer.items || []).map(it => ({
        dish: it.dish?._id || it.dish,
        discount: it.discount,
      })),
    })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!form.startAt || !form.endAt) { setError('Please set both start and end date/time.'); return }
    if (new Date(form.endAt) <= new Date(form.startAt)) { setError('End date/time must be after start date/time.'); return }
    if (form.items.length === 0) { setError('Select at least one dish for this offer.'); return }
    for (const it of form.items) {
      if (!it.discount || Number(it.discount) <= 0) {
        const d = dishes.find(x => x.id === it.dish)
        setError(`Please set a valid discount for "${d?.name || 'selected dish'}".`)
        return
      }
      const dish = dishes.find(x => x.id === it.dish)
      if (dish && Number(it.discount) >= Number(dish.price)) {
        setError(`Discount for "${dish.name}" cannot be equal to or greater than its price (₹${dish.price}).`)
        return
      }
    }

    setSubmitting(true)
    try {
      const token = getToken()
      const payload = {
        title: form.title || 'Flash Offer',
        subtitle: form.subtitle,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        active: form.active,
        items: form.items.map(it => ({ dish: it.dish, discount: Number(it.discount) })),
      }
      if (editOffer) {
        await updateOffer(editOffer._id, payload, token)
        setSuccess('Offer updated successfully.')
      } else {
        await createOffer(payload, token)
        setSuccess('Offer scheduled successfully.')
      }
      resetForm()
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to save offer.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, title) {
    if (!confirm(`Delete offer "${title}"?`)) return
    try {
      await deleteOffer(id, getToken())
      if (editOffer?._id === id) resetForm()
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to delete offer.')
    }
  }

  return (
    <div className="admin-dishes admin-offers">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Flash Offers</h1>
          <p className="dash-sub">Schedule a discount offer with a start/end date &amp; time — pick the dishes and it goes live on the Home page automatically.</p>
        </div>
      </div>

      <div className="dishes-layout">
        {/* ── Offer Form ── */}
        <div className="dash-card add-dish-card">
          <div className="card-head">
            <h3 className="card-title">
              {editOffer
                ? <><Pencil size={16} style={{ verticalAlign: '-3px' }} /> Edit Offer</>
                : <><Plus size={16} style={{ verticalAlign: '-3px' }} /> Schedule New Offer</>}
            </h3>
            {editOffer && (
              <button type="button" className="row-delete-btn" onClick={resetForm} title="Cancel edit"><X size={15} /></button>
            )}
          </div>

          <form className="add-dish-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Offer Title</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Flash Offer" />
            </div>

            <div className="form-row">
              <label>Subtitle (optional)</label>
              <input type="text" name="subtitle" value={form.subtitle} onChange={handleChange} placeholder="e.g. Order before the clock runs out" />
            </div>

            <div className="form-row form-row-split">
              <div>
                <label><CalendarClock size={13} style={{ verticalAlign: '-2px' }} /> Starts At</label>
                <input type="datetime-local" name="startAt" value={form.startAt} onChange={handleChange} />
              </div>
              <div>
                <label><Timer size={13} style={{ verticalAlign: '-2px' }} /> Ends At</label>
                <input type="datetime-local" name="endAt" value={form.endAt} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row form-checkbox-row">
              <label className="checkbox-label">
                <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
                <Zap size={14} /> Offer Enabled
              </label>
            </div>

            <div className="form-row">
              <label><Tag size={14} style={{ verticalAlign: '-2px' }} /> Select Dishes &amp; Discount (₹)</label>
              <div className="offer-dish-picker">
                {dishes.length === 0 ? (
                  <p className="no-offer" style={{ padding: '10px 0' }}>No dishes found — add dishes first.</p>
                ) : dishes.map(d => {
                  const item = form.items.find(it => it.dish === d.id)
                  const checked = !!item
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
                      {checked && (
                        <div className="offer-dish-discount">
                          <input
                            type="number"
                            min="1"
                            placeholder="₹ off"
                            value={item.discount}
                            onChange={e => setItemDiscount(d.id, e.target.value)}
                          />
                          {Number(item.discount) > 0 && (
                            <span className="offer-dish-final">→ ₹{Math.max(d.price - Number(item.discount), 0)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {error   && <p className="form-error">{error}</p>}
            {success && <p className="form-success"><CheckCircle size={14} style={{ verticalAlign: '-2px', marginRight: 5 }} />{success}</p>}

            <button type="submit" className="add-dish-submit" disabled={submitting}>
              {submitting
                ? <><Loader2 size={15} className="spin-icon" /> Saving…</>
                : editOffer ? <><CheckCircle size={16} /> Save Changes</> : <><Plus size={16} /> Schedule Offer</>}
            </button>
          </form>
        </div>

        {/* ── All Offers List ── */}
        <div className="dash-card dishes-list-card">
          <div className="card-head">
            <h3 className="card-title"><Clock size={16} style={{ verticalAlign: '-3px' }} /> All Offers</h3>
            <span className="card-badge">{offers.length} total</span>
          </div>

          {loading ? (
            <div className="empty-dishes-state"><Loader2 size={30} className="spin-icon" /><p>Loading offers…</p></div>
          ) : offers.length === 0 ? (
            <div className="empty-dishes-state">
              <PackageOpen size={36} />
              <p>No offers scheduled yet.</p>
              <span>Create one using the form on the left — it'll show up on the Home page banner automatically during its active window.</span>
            </div>
          ) : (
            <div className="dishes-table-wrap">
              <table className="dishes-table">
                <thead>
                  <tr>
                    <th>Title</th><th>Dishes</th><th>Window</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map(o => {
                    const status = offerStatus(o)
                    return (
                      <tr key={o._id}>
                        <td className="dish-name-cell">{o.title}</td>
                        <td>{(o.items || []).length} dish{(o.items || []).length !== 1 ? 'es' : ''}</td>
                        <td>
                          <span className="offer-window">
                            {new Date(o.startAt).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            {' → '}
                            {new Date(o.endAt).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td><span className={`offer-status offer-status-${status.cls}`}>{status.label}</span></td>
                        <td className="action-btns">
                          <button className="row-edit-btn" onClick={() => openEdit(o)} title="Edit offer"><Pencil size={14} /></button>
                          <button className="row-delete-btn" onClick={() => handleDelete(o._id, o.title)} title="Delete offer"><Trash2 size={15} /></button>
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
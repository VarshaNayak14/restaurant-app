import React, { useState, useEffect, useCallback } from 'react'
import { Mail, Phone, Users, BedDouble, Trash2, RefreshCw, Loader2, Plus, Pencil, Car, X, Upload, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE } from '../data/dishes.js'
import { CAB_STATUS, fmt } from './AdminCabs.jsx'
import './AdminHome.css'
import './AdminBookings.css'

const STATUS = {
  pending:   { label: 'Pending',   bg: '#dbeafe', color: '#1e40af' },
  confirmed: { label: 'Confirmed', bg: '#d1fae5', color: '#065f46' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#991b1b' },
}
const emptyHotel = {
  name: '', city: '', address: '', description: '', image: '',
  pricePerNight: '', rating: 4, totalRooms: 10, amenities: '', isActive: true,
  // Detail page content
  images: [], highlights: '', policies: '', nearby: '',
  checkInTime: '12:00 PM', checkOutTime: '11:00 AM', phone: '', email: '', mapEmbed: '',
}
const toLines = arr => (arr || []).join('\n')

/* Read image files as base64 data URLs (same approach as AdminDishes) */
function readImages(files) {
  return Promise.all([...files].map(file => new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error(`${file.name} is not an image.`))
    // Keep each photo small: the whole hotel is saved in one request (server limit 10 MB)
    if (file.size > 1.5 * 1024 * 1024) return reject(new Error(`${file.name} is larger than 1.5 MB — please compress it or paste an image URL instead.`))
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.readAsDataURL(file)
  })))
}

/* Gallery editor — extra photos shown on the hotel detail page */
function GalleryEditor({ images, onChange }) {
  const [url, setUrl]     = useState('')
  const [error, setError] = useState('')
  function addUrl() {
    const u = url.trim()
    if (!/^https?:\/\//i.test(u)) return setError('Please paste a full image URL starting with http(s)://')
    onChange([...images, u]); setUrl(''); setError('')
  }
  async function addFiles(e) {
    const files = e.target.files
    e.target.value = ''
    try { onChange([...images, ...(await readImages(files))]); setError('') }
    catch (err) { setError(err.message) }
  }
  const move = (i, step) => {
    const j = i + step
    if (j < 0 || j >= images.length) return
    const next = [...images];[next[i], next[j]] = [next[j], next[i]]; onChange(next)
  }
  return (
    <div className="full">
      <span className="ab-img-label">Gallery photos (shown on the hotel detail page)</span>
      <div className="ab-img-row">
        <label className="ab-btn ab-upload-btn">
          <Upload size={14} /> Upload photos
          <input type="file" accept="image/*" multiple onChange={addFiles} hidden />
        </label>
        <span className="ab-or">or</span>
        <input className="ab-input" style={{ flex: 1, minWidth: 200 }} value={url} onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }} placeholder="Paste photo URL and press Add" />
        <button type="button" className="ab-btn" onClick={addUrl}><Plus size={14} /> Add</button>
      </div>
      {error && <p className="ab-img-error">{error}</p>}
      {images.length > 0 ? (
        <div className="ab-gallery">
          {images.map((src, i) => (
            <div key={i} className="ab-gallery-item">
              <img src={src} alt={`Gallery ${i + 1}`} />
              <div className="ab-gallery-actions">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Move left">‹</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} title="Move right">›</button>
                <button type="button" className="del" onClick={() => onChange(images.filter((_, k) => k !== i))} title="Remove"><X size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="ab-or" style={{ marginTop: 8 }}>No gallery photos yet — the cover image will be shown alone.</p>}
    </div>
  )
}

export default function AdminHotels() {
  const [tab, setTab] = useState('bookings')
  return (
    <div className="admin-home-page">
      <div className="dash-header">
        <h1 className="dash-title">Hotels</h1>
        <p className="dash-sub">Manage hotel bookings and add / edit hotels.</p>
      </div>
      <div className="ab-toolbar">
        <button className={`ab-pill ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>Bookings</button>
        <button className={`ab-pill ${tab === 'hotels' ? 'active' : ''}`} onClick={() => setTab('hotels')}>Manage Hotels</button>
      </div>
      {tab === 'bookings' ? <HotelBookings /> : <ManageHotels />}
    </div>
  )
}

function HotelBookings() {
  const { getToken } = useAuth()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('all')
  const [notes, setNotes]     = useState({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${API_BASE}/hotels/bookings?status=${status}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      const data = await res.json()
      if (data.success) setItems(data.data)
    } catch { }
    finally { setLoading(false) }
  }, [status, getToken])

  useEffect(() => { fetchData() }, [fetchData])

  async function update(b, newStatus) {
    const res  = await fetch(`${API_BASE}/hotels/bookings/${b._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status: newStatus, adminNote: notes[b._id] ?? b.adminNote }),
    })
    const data = await res.json()
    if (data.success) setItems(prev => prev.map(it => it._id === b._id ? data.data : it))
  }

  async function remove(b) {
    if (!confirm(`Delete booking of "${b.name}"?`)) return
    await fetch(`${API_BASE}/hotels/bookings/${b._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
    setItems(prev => prev.filter(it => it._id !== b._id))
  }

  return (
    <>
      <div className="ab-toolbar">
        {['all', 'pending', 'confirmed', 'cancelled'].map(s => (
          <button key={s} className={`ab-pill ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
            {s === 'all' ? 'All' : STATUS[s].label}
          </button>
        ))}
        <button className="ab-btn" onClick={fetchData} style={{ marginLeft: 'auto' }}><RefreshCw size={14} /> Refresh</button>
      </div>

      {loading ? <div className="ab-empty"><Loader2 size={26} className="spin-icon" /></div>
        : items.length === 0 ? <div className="ab-empty">No hotel bookings yet.</div>
        : (
          <div className="ab-list">
            {items.map(b => {
              const s = STATUS[b.status] || STATUS.pending
              const cs = b.cab && (CAB_STATUS[b.cab.status] || CAB_STATUS.pending)
              return (
                <div className="ab-item" key={b._id}>
                  <div className="ab-item-head">
                    <div>
                      <h4>{b.name} — {b.hotelName}</h4>
                      <div className="ab-meta">
                        <span><Mail size={12} /> {b.email}</span>
                        {b.phone && <span><Phone size={12} /> {b.phone}</span>}
                        <span>{b.checkIn} → {b.checkOut} ({b.nights} night)</span>
                        <span><Users size={12} /> {b.guests}</span>
                        <span><BedDouble size={12} /> {b.rooms}</span>
                        <span className="ab-total">₹{b.totalAmount}</span>
                      </div>
                      {b.message && <div className="ab-meta" style={{ marginTop: 4 }}>📝 {b.message}</div>}
                    </div>
                    <span className="ab-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </div>

                  {b.cab && (
                    <div className="ab-cab">
                      <Car size={13} /> <strong>Cab also booked</strong> — {b.cab.carType.toUpperCase()}, {b.cab.tripType}, ₹{b.cab.estimatedFare}
                      {' '}<span className="ab-badge" style={{ background: cs.bg, color: cs.color }}>{cs.label}</span>
                      <div style={{ marginTop: 4 }}>
                        {b.cab.pickupAddress} → {b.cab.dropAddress}
                        {b.cab.pickupTime && <> · Pickup {fmt(b.cab.pickupTime)}</>}
                        {b.cab.returnTime && <> · Return {fmt(b.cab.returnTime)}</>}
                      </div>
                      <div style={{ marginTop: 4, color: '#6b7280' }}>Go to the "Cab Bookings" page to assign a driver.</div>
                    </div>
                  )}

                  <div className="ab-actions">
                    <input className="ab-input" style={{ flex: 1, minWidth: 160 }} placeholder="Admin note"
                      value={notes[b._id] ?? b.adminNote} onChange={e => setNotes(n => ({ ...n, [b._id]: e.target.value }))} />
                    <button className="ab-btn green" onClick={() => update(b, 'confirmed')}>Confirm</button>
                    <button className="ab-btn red" onClick={() => update(b, 'cancelled')}>Cancel</button>
                    <a href={`/booking-bill/hotel/${b._id}`} target="_blank" rel="noreferrer" className="ab-btn" style={{ textDecoration: 'none' }}><FileText size={14} /> Bill</a>
                    <button className="ab-btn red" onClick={() => remove(b)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </>
  )
}

function ManageHotels() {
  const { getToken } = useAuth()
  const [hotels, setHotels]   = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState(null)   // null = form closed, {} = add/edit
  const [editId, setEditId]   = useState(null)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${API_BASE}/hotels?all=1`)
      const data = await res.json()
      if (data.success) setHotels(data.data)
    } catch { }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const [imgError, setImgError] = useState('')

  // Same approach as AdminDishes — image is stored as a base64 data URL
  function handleImageFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return setImgError('Please upload a valid image file.')
    if (file.size > 3 * 1024 * 1024) return setImgError('Image must be smaller than 3 MB.')
    const reader = new FileReader()
    reader.onload = () => { set('image', reader.result); setImgError('') }
    reader.readAsDataURL(file)
  }

  // The list doesn't include gallery photos, so load the full hotel before editing
  async function openEdit(h) {
    setEditId(h._id)
    setImgError('')
    let full = h
    try {
      const d = await fetch(`${API_BASE}/hotels/${h._id}`).then(r => r.json())
      if (d.success) full = d.data
    } catch { }
    setForm({
      ...emptyHotel, ...full,
      image: full.image || '',
      amenities: (full.amenities || []).join(', '),
      images: full.images || [],
      highlights: toLines(full.highlights), policies: toLines(full.policies), nearby: toLines(full.nearby),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/hotels${editId ? `/${editId}` : ''}`, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...form, pricePerNight: Number(form.pricePerNight), rating: Number(form.rating), totalRooms: Number(form.totalRooms) }),
      })
      const data = await res.json()
      if (!data.success) return alert(data.error)
      setForm(null); setEditId(null); load()
    } catch {
      alert('Could not reach the server. Make sure the backend is running.')
    } finally { setSaving(false) }
  }

  async function remove(h) {
    if (!confirm(`Delete hotel "${h.name}"?`)) return
    await fetch(`${API_BASE}/hotels/${h._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
    load()
  }

  return (
    <>
      {form ? (
        <form className="ab-form" onSubmit={save}>
          <div className="full" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="ab-form-title">{editId ? 'Edit Hotel' : 'Add Hotel'}</h3>
            <button type="button" className="ab-btn" onClick={() => { setForm(null); setEditId(null) }}><X size={14} /></button>
          </div>
          <label>Name *<input value={form.name} onChange={e => set('name', e.target.value)} required /></label>
          <label>City *<input value={form.city} onChange={e => set('city', e.target.value)} required /></label>
          <label className="full">Address<input value={form.address} onChange={e => set('address', e.target.value)} /></label>
          <label>Price / night (₹) *<input type="number" min={0} value={form.pricePerNight} onChange={e => set('pricePerNight', e.target.value)} required /></label>
          <label>Rating (0-5)<input type="number" min={0} max={5} step={0.1} value={form.rating} onChange={e => set('rating', e.target.value)} /></label>
          <label>Total rooms<input type="number" min={0} value={form.totalRooms} onChange={e => set('totalRooms', e.target.value)} /></label>
          <div className="full">
            <span className="ab-img-label">Hotel Image</span>
            <div className="ab-img-row">
              <label className="ab-btn ab-upload-btn">
                <Upload size={14} /> Upload from computer
                <input type="file" accept="image/*" onChange={handleImageFile} hidden />
              </label>
              <span className="ab-or">or</span>
              <input
                className="ab-input"
                style={{ flex: 1, minWidth: 200 }}
                value={form.image.startsWith('data:') ? '' : form.image}
                onChange={e => set('image', e.target.value)}
                placeholder={form.image.startsWith('data:') ? 'Uploaded image selected' : 'Paste image URL (https://…)'}
              />
            </div>
            {imgError && <p className="ab-img-error">{imgError}</p>}
            {form.image && (
              <div className="ab-img-preview">
                <img src={form.image} alt="Hotel preview" onError={() => setImgError('This image URL could not be loaded.')} onLoad={() => setImgError('')} />
                <button type="button" className="ab-btn red" onClick={() => { set('image', ''); setImgError('') }}><X size={13} /> Remove</button>
              </div>
            )}
          </div>
          <label className="full">Amenities (comma separated)<input value={form.amenities} onChange={e => set('amenities', e.target.value)} placeholder="WiFi, Pool, Parking" /></label>
          <label className="full">Description (About this hotel)<textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} /></label>

          {/* ── Detail page content ── */}
          <div className="full ab-form-divider">Hotel detail page</div>
          <GalleryEditor images={form.images} onChange={v => set('images', v)} />
          <label>Check-in time<input value={form.checkInTime} onChange={e => set('checkInTime', e.target.value)} placeholder="12:00 PM" /></label>
          <label>Check-out time<input value={form.checkOutTime} onChange={e => set('checkOutTime', e.target.value)} placeholder="11:00 AM" /></label>
          <label>Hotel phone<input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 …" /></label>
          <label>Hotel email<input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="stay@hotel.com" /></label>
          <label className="full">Highlights (one per line)
            <textarea rows={4} value={form.highlights} onChange={e => set('highlights', e.target.value)} placeholder={'Rooftop pool with sea view\nFree breakfast buffet'} />
          </label>
          <label>Hotel rules (one per line)
            <textarea rows={5} value={form.policies} onChange={e => set('policies', e.target.value)} placeholder={'Valid photo ID required\nNo smoking in rooms'} />
          </label>
          <label>Nearby places (one per line)
            <textarea rows={5} value={form.nearby} onChange={e => set('nearby', e.target.value)} placeholder={'Calangute Beach — 300 m\nGoa Airport — 42 km'} />
          </label>
          <label className="full">Google Maps embed URL (optional)
            <input value={form.mapEmbed} onChange={e => set('mapEmbed', e.target.value)} placeholder="https://www.google.com/maps/embed?pb=…" />
            <small className="ab-or">Google Maps → Share → Embed a map → copy only the link inside src="…"</small>
          </label>
          <label className="check full"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} /> Show on website (Active)</label>
          <div className="full"><button className="ab-btn gold" disabled={saving}>{saving ? 'Saving…' : 'Save Hotel'}</button></div>
        </form>
      ) : (
        <div className="ab-toolbar"><button className="ab-btn gold" onClick={() => { setEditId(null); setForm(emptyHotel) }}><Plus size={14} /> Add Hotel</button></div>
      )}

      {loading ? <div className="ab-empty"><Loader2 size={26} className="spin-icon" /></div>
        : hotels.length === 0 ? <div className="ab-empty">No hotels yet. Click "Add Hotel" (or run <code>node seedHotels.js</code> in the backend).</div>
        : (
          <div className="ab-hotels">
            {hotels.map(h => (
              <div className="ab-hotel" key={h._id}>
                {h.image ? <img src={h.image} alt={h.name} /> : <img alt="" />}
                <div className="ab-hotel-body">
                  <h4>{h.name} {!h.isActive && <span className="ab-link-badge">Hidden</span>}</h4>
                  <div className="ab-meta"><span>{h.city}</span><span className="ab-total">₹{h.pricePerNight}/night</span><span>⭐ {h.rating}</span></div>
                  <div className="ab-actions">
                    <button className="ab-btn" onClick={() => openEdit(h)}><Pencil size={13} /> Edit</button>
                    <button className="ab-btn red" onClick={() => remove(h)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import {
  MapPin, Phone, Mail, Clock, Save, Loader2, CheckCircle,
  Image, Upload, Map, Info, RefreshCw, Eye, EyeOff
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE } from '../data/dishes.js'
import './AdminHome.css'

const DEFAULT = {
  address: '', city: '', phone: '', phone2: '', email: '', email2: '',
  hours: '', hours2: '', mapLabel: '', mapImg: '', mapEmbed: '',
  mapNearby1: '', mapNearby2: '', mapNearby3: '',
}

async function uploadImage(file, token) {
  const fd = new FormData()
  fd.append('image', file)
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
  const data = await res.json()
  if (!data.success && !data.url) throw new Error(data.error || 'Upload failed')
  return data.url || data.data?.url || data.imageUrl
}

/* ── reusable section heading ── */
function SectionHead({ icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18, paddingBottom: 14, borderBottom: '1.5px solid #f0f1f4' }}>
      <div style={{ background: 'rgba(201,149,42,.12)', color: '#C9952A', padding: 8, borderRadius: 8, display: 'flex', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '.95rem', color: '#0f1923' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '.78rem', color: '#9ca3af', marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  )
}

/* ── field row ── */
function Field({ label, hint, children }) {
  return (
    <div className="form-row">
      <label style={{ fontWeight: 600, fontSize: '.78rem', color: '#374151' }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>({hint})</span>}
      </label>
      {children}
    </div>
  )
}

export default function AdminContactSettings() {
  const { getToken } = useAuth()
  const [form, setForm]         = useState(DEFAULT)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')
  const [uploading, setUploading] = useState(false)
  const [imgTab, setImgTab]     = useState('url')   // 'url' | 'file'
  const [showEmbed, setShowEmbed] = useState(false)
  const fileRef = useRef()

  /* fetch current settings */
  useEffect(() => {
    fetch(`${API_BASE}/contact/info`)
      .then(r => r.json())
      .then(d => { if (d.success) setForm({ ...DEFAULT, ...d.data }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function set(field) {
    return (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    try {
      const url = await uploadImage(file, getToken())
      setForm(f => ({ ...f, mapImg: url }))
    } catch (err) { setError('Image upload failed. Please try URL instead.') }
    finally { setUploading(false) }
  }

  async function handleSave() {
    setSaving(true); setError(''); setSuccess('')
    try {
      const res  = await fetch(`${API_BASE}/contact/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Save failed')
      setSuccess('Contact settings saved! Changes are now live on the Contact page.')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="admin-home-page">
        <div className="empty-state" style={{ minHeight: 300 }}>
          <Loader2 size={32} className="spin-icon" />
          <p>Loading contact settings…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-home-page">

      {/* Header */}
      <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="dash-title">Contact Page Settings</h1>
          <p className="dash-sub">Edit the info cards, map section, and location details shown on the Contact page.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg,#C9952A,#E8C060)',
            color: '#1a1206', fontWeight: 700, border: 'none',
            borderRadius: 10, padding: '10px 22px', fontSize: '.9rem',
            cursor: saving ? 'default' : 'pointer', opacity: saving ? .7 : 1,
          }}
        >
          {saving ? <><Loader2 size={15} className="spin-icon" /> Saving…</> : <><Save size={15} /> Save All Changes</>}
        </button>
      </div>

      {/* Live preview strip */}
      <div style={{
        background: '#fef9ef', border: '1.5px solid #fcd34d', borderRadius: 10,
        padding: '12px 18px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10,
        fontSize: '.85rem', color: '#92400e'
      }}>
        <Eye size={16} />
        <span>Changes saved here appear <strong>live immediately</strong> on the public Contact page.</span>
      </div>

      {success && (
        <div style={{
          background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46',
          borderRadius: 10, padding: '12px 18px', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600
        }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c',
          borderRadius: 10, padding: '12px 18px', marginBottom: 18
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 20 }}>

        {/* ── Location Card ── */}
        <div className="dash-card">
          <SectionHead icon={<MapPin size={18} />} title="Location Card" subtitle="Shown in the first info card on Contact page" />
          <div className="add-home-form">
            <Field label="Street Address" hint="line 1">
              <input value={form.address} onChange={set('address')} placeholder="42 Spice Lane, Bandra West" />
            </Field>
            <Field label="City / State / PIN" hint="line 2">
              <input value={form.city} onChange={set('city')} placeholder="Mumbai, MH 400050" />
            </Field>
          </div>
        </div>

        {/* ── Phone Card ── */}
        <div className="dash-card">
          <SectionHead icon={<Phone size={18} />} title="Phone Card" subtitle="Primary and secondary phone numbers" />
          <div className="add-home-form">
            <Field label="Primary Phone">
              <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Secondary Phone" hint="optional">
              <input value={form.phone2} onChange={set('phone2')} placeholder="+91 22 4567 8900" />
            </Field>
          </div>
        </div>

        {/* ── Email Card ── */}
        <div className="dash-card">
          <SectionHead icon={<Mail size={18} />} title="Email Card" subtitle="Shown in the third info card" />
          <div className="add-home-form">
            <Field label="Primary Email">
              <input type="email" value={form.email} onChange={set('email')} placeholder="hello@restaurant.com" />
            </Field>
            <Field label="Secondary Email" hint="optional — e.g. events@">
              <input type="email" value={form.email2} onChange={set('email2')} placeholder="events@restaurant.com" />
            </Field>
          </div>
        </div>

        {/* ── Hours Card ── */}
        <div className="dash-card">
          <SectionHead icon={<Clock size={18} />} title="Opening Hours Card" subtitle="Fourth info card on Contact page" />
          <div className="add-home-form">
            <Field label="Hours Line 1">
              <input value={form.hours} onChange={set('hours')} placeholder="Mon – Sun: 11am – 11pm" />
            </Field>
            <Field label="Hours Line 2" hint="optional">
              <input value={form.hours2} onChange={set('hours2')} placeholder="Kitchen closes at 10:30pm" />
            </Field>
          </div>
        </div>

        {/* ── Map / Image Section ── */}
        <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
          <SectionHead icon={<Map size={18} />} title="Map & Location Section" subtitle="The image/map shown beside the reservation form" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>

            {/* Left: image settings */}
            <div className="add-home-form">
              <Field label="Map Pin Label" hint="badge shown over image">
                <input value={form.mapLabel} onChange={set('mapLabel')} placeholder="Spice Garden, Bandra, Mumbai" />
              </Field>

              {/* Image input tabs */}
              <div className="form-row">
                <label style={{ fontWeight: 600, fontSize: '.78rem', color: '#374151' }}>
                  Map / Location Image
                </label>
                <div className="img-upload-tabs">
                  <button type="button" className={`img-tab-btn ${imgTab === 'url' ? 'active' : ''}`} onClick={() => setImgTab('url')}>
                    URL
                  </button>
                  <button type="button" className={`img-tab-btn ${imgTab === 'file' ? 'active' : ''}`} onClick={() => setImgTab('file')}>
                    Upload from Device
                  </button>
                </div>

                {imgTab === 'url' ? (
                  <input
                    value={form.mapImg}
                    onChange={set('mapImg')}
                    placeholder="https://images.unsplash.com/…"
                  />
                ) : (
                  <>
                    <div className="img-upload-area" onClick={() => fileRef.current?.click()}>
                      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                      <Upload size={22} className="img-upload-icon" />
                      <span className="img-upload-label">Click to browse image</span>
                      <span className="img-upload-sub">JPG, PNG, WEBP</span>
                    </div>
                    {uploading && (
                      <div className="uploading-indicator">
                        <Loader2 size={13} className="spin-icon" /> Uploading…
                      </div>
                    )}
                  </>
                )}

                {form.mapImg && !uploading && (
                  <div className="image-preview-wrap" style={{ marginTop: 8 }}>
                    <img
                      src={form.mapImg} alt="map preview"
                      style={{ maxHeight: 130, borderRadius: 8, objectFit: 'cover', maxWidth: '100%' }}
                      onError={e => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>

              {/* Google Maps embed toggle */}
              <div className="form-row">
                <button
                  type="button"
                  onClick={() => setShowEmbed(s => !s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 8,
                    padding: '7px 12px', cursor: 'pointer', fontSize: '.8rem',
                    fontWeight: 600, color: '#374151'
                  }}
                >
                  {showEmbed ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showEmbed ? 'Hide Google Maps Embed' : 'Use Google Maps Embed instead'}
                </button>
                {showEmbed && (
                  <>
                    <input
                      value={form.mapEmbed}
                      onChange={set('mapEmbed')}
                      placeholder="Paste Google Maps iframe src URL here…"
                      style={{ marginTop: 8 }}
                    />
                    <span style={{ fontSize: '.72rem', color: '#9ca3af' }}>
                      Google Maps → Share → Embed → copy the src="…" URL only
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: "How to Find Us" text */}
            <div className="add-home-form">
              <Field label="How to Find Us — Line 1" hint="e.g. nearest metro">
                <input value={form.mapNearby1} onChange={set('mapNearby1')} placeholder="Nearest Metro: Bandra (W) — 5 min walk" />
              </Field>
              <Field label="How to Find Us — Line 2" hint="e.g. parking info">
                <input value={form.mapNearby2} onChange={set('mapNearby2')} placeholder="Valet parking available from 6pm" />
              </Field>
              <Field label="How to Find Us — Line 3" hint="e.g. bus stop">
                <input value={form.mapNearby3} onChange={set('mapNearby3')} placeholder="Bus Stop: Turner Road (150m away)" />
              </Field>

              {/* Live preview of info cards */}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '.74rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>
                  Preview — Info Cards
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: <MapPin size={14} />, lines: [form.address, form.city].filter(Boolean) },
                    { icon: <Phone size={14} />, lines: [form.phone, form.phone2].filter(Boolean) },
                    { icon: <Mail size={14} />, lines: [form.email, form.email2].filter(Boolean) },
                    { icon: <Clock size={14} />, lines: [form.hours, form.hours2].filter(Boolean) },
                  ].map((c, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      background: '#fafafa', border: '1.5px solid #e5e7eb',
                      borderRadius: 8, padding: '10px 12px'
                    }}>
                      <div style={{ color: '#C9952A', marginTop: 1 }}>{c.icon}</div>
                      <div style={{ fontSize: '.8rem', color: '#374151' }}>
                        {c.lines.length ? c.lines.map((l, j) => <div key={j}>{l}</div>) : <span style={{ color: '#d1d5db' }}>Not set</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom save button */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg,#C9952A,#E8C060)',
            color: '#1a1206', fontWeight: 700, border: 'none',
            borderRadius: 10, padding: '12px 28px', fontSize: '.95rem',
            cursor: saving ? 'default' : 'pointer', opacity: saving ? .7 : 1,
          }}
        >
          {saving ? <><Loader2 size={15} className="spin-icon" /> Saving…</> : <><Save size={15} /> Save All Changes</>}
        </button>
      </div>

    </div>
  )
}
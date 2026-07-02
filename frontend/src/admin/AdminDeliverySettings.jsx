import React, { useState, useEffect } from 'react'
import { Truck, Save, Loader2, CheckCircle, Eye } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE } from '../data/dishes.js'
import './AdminHome.css'

const DEFAULT = {
  deliveryFee: 49,
  freeDeliveryThreshold: 499,
  freeDeliveryEnabled: true,
}

/* ── reusable section heading (same pattern as AdminContactSettings) ── */
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

export default function AdminDeliverySettings() {
  const { getToken } = useAuth()
  const [form, setForm]       = useState(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/delivery-settings`)
      .then(r => r.json())
      .then(d => { if (d.success) setForm({ ...DEFAULT, ...d.data }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function setNum(field) {
    return (e) => setForm(f => ({ ...f, [field]: e.target.value === '' ? '' : Number(e.target.value) }))
  }

  async function handleSave() {
    setSaving(true); setError(''); setSuccess('')
    try {
      const res  = await fetch(`${API_BASE}/delivery-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          deliveryFee: Number(form.deliveryFee) || 0,
          freeDeliveryThreshold: Number(form.freeDeliveryThreshold) || 0,
          freeDeliveryEnabled: form.freeDeliveryEnabled,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Save failed')
      setForm({ ...DEFAULT, ...data.data })
      setSuccess('Delivery settings saved! Changes are now live on Cart & Checkout.')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="admin-home-page">
        <div className="empty-state" style={{ minHeight: 300 }}>
          <Loader2 size={32} className="spin-icon" />
          <p>Loading delivery settings…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-home-page">

      {/* Header */}
      <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="dash-title">Delivery Settings</h1>
          <p className="dash-sub">Control the delivery charge shown on Cart & Checkout pages.</p>
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
          {saving ? <><Loader2 size={15} className="spin-icon" /> Saving…</> : <><Save size={15} /> Save Changes</>}
        </button>
      </div>

      {/* Live preview strip */}
      <div style={{
        background: '#fef9ef', border: '1.5px solid #fcd34d', borderRadius: 10,
        padding: '12px 18px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10,
        fontSize: '.85rem', color: '#92400e'
      }}>
        <Eye size={16} />
        <span>Changes saved here appear <strong>live immediately</strong> on Cart & Checkout — no redeploy needed.</span>
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

        <div className="dash-card">
          <SectionHead
            icon={<Truck size={18} />}
            title="Delivery Charge"
            subtitle="Flat delivery fee charged on orders"
          />
          <div className="add-home-form">
            <Field label="Delivery Fee" hint="₹, charged when subtotal is below the free-delivery threshold">
              <input
                type="number"
                min="0"
                value={form.deliveryFee}
                onChange={setNum('deliveryFee')}
                placeholder="49"
              />
            </Field>

            <div className="form-row form-checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.freeDeliveryEnabled}
                  onChange={e => setForm(f => ({ ...f, freeDeliveryEnabled: e.target.checked }))}
                />
                Enable free delivery above a threshold
              </label>
            </div>

            {form.freeDeliveryEnabled && (
              <Field label="Free Delivery Threshold" hint="₹, orders at or above this amount get FREE delivery">
                <input
                  type="number"
                  min="0"
                  value={form.freeDeliveryThreshold}
                  onChange={setNum('freeDeliveryThreshold')}
                  placeholder="499"
                />
              </Field>
            )}

            {/* Live preview */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: '.74rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>
                Preview
              </div>
              <div style={{
                background: '#fafafa', border: '1.5px solid #e5e7eb',
                borderRadius: 8, padding: '10px 12px', fontSize: '.85rem', color: '#374151'
              }}>
                {form.freeDeliveryEnabled ? (
                  <>Orders under ₹{form.freeDeliveryThreshold || 0} pay <strong>₹{form.deliveryFee || 0}</strong> delivery. Orders ₹{form.freeDeliveryThreshold || 0}+ get <strong>FREE</strong> delivery.</>
                ) : (
                  <>Every order pays a flat <strong>₹{form.deliveryFee || 0}</strong> delivery charge.</>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
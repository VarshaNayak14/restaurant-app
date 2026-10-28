import React, { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, UserPlus, Trash2, Pencil, X, Loader2, KeyRound, Crown } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE } from '../data/dishes.js'
import './AdminHome.css'
import './AdminBookings.css'

const emptyForm = { name: '', email: '', password: '', permissions: [] }

/* Checkbox grid of panel sections */
function PermissionPicker({ all, value, onChange }) {
  const toggle = key => onChange(value.includes(key) ? value.filter(k => k !== key) : [...value, key])
  const allOn  = all.length > 0 && all.every(p => value.includes(p.key))
  return (
    <div>
      <label className="aa-check aa-check-all">
        <input type="checkbox" checked={allOn} onChange={() => onChange(allOn ? [] : all.map(p => p.key))} />
        Select all
      </label>
      <div className="aa-perms">
        {all.map(p => (
          <label key={p.key} className={`aa-check ${value.includes(p.key) ? 'on' : ''}`}>
            <input type="checkbox" checked={value.includes(p.key)} onChange={() => toggle(p.key)} />
            {p.label}
          </label>
        ))}
      </div>
    </div>
  )
}

export default function AdminAdmins() {
  const { getToken, user } = useAuth()
  const [admins, setAdmins]   = useState([])
  const [perms, setPerms]     = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState(null)       // add-admin form (null = closed)
  const [editId, setEditId]   = useState(null)       // admin whose permissions are being edited
  const [editPerms, setEditPerms] = useState([])
  const [busy, setBusy]       = useState(false)
  const [msg, setMsg]         = useState({ type: '', text: '' })

  const headers = useCallback(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }), [getToken])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [a, p] = await Promise.all([
        fetch(`${API_BASE}/admins`, { headers: headers() }).then(r => r.json()),
        fetch(`${API_BASE}/admins/permissions`, { headers: headers() }).then(r => r.json()),
      ])
      if (a.success) setAdmins(a.data); else setMsg({ type: 'error', text: a.error })
      if (p.success) setPerms(p.data)
    } catch { setMsg({ type: 'error', text: 'Could not reach the server.' }) }
    finally { setLoading(false) }
  }, [headers])

  useEffect(() => { load() }, [load])

  const label = key => perms.find(p => p.key === key)?.label || key

  async function addAdmin(e) {
    e.preventDefault()
    setBusy(true); setMsg({ type: '', text: '' })
    try {
      const res  = await fetch(`${API_BASE}/admins`, { method: 'POST', headers: headers(), body: JSON.stringify(form) })
      const data = await res.json()
      if (!data.success) return setMsg({ type: 'error', text: data.error })
      setMsg({ type: 'ok', text: data.promoted
        ? `${data.data.email} already had an account — it is now an admin. They can log in with their existing password.`
        : `Admin ${data.data.email} created. Share the email and password with them.` })
      setForm(null); load()
    } finally { setBusy(false) }
  }

  async function savePerms(id) {
    setBusy(true)
    try {
      const res  = await fetch(`${API_BASE}/admins/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ permissions: editPerms }) })
      const data = await res.json()
      if (!data.success) return setMsg({ type: 'error', text: data.error })
      setAdmins(list => list.map(a => a.id === id ? data.data : a))
      setEditId(null)
      setMsg({ type: 'ok', text: `Access updated for ${data.data.name}. They may need to log in again to see the change.` })
    } finally { setBusy(false) }
  }

  async function resetPassword(a) {
    const pwd = prompt(`New password for ${a.name} (min 6 characters):`)
    if (!pwd) return
    const res  = await fetch(`${API_BASE}/admins/${a.id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ password: pwd }) })
    const data = await res.json()
    setMsg(data.success ? { type: 'ok', text: `Password changed for ${a.name}.` } : { type: 'error', text: data.error })
  }

  async function removeAdmin(a) {
    if (!confirm(`Remove admin access for ${a.name}? Their account will stay as a normal customer.`)) return
    const res  = await fetch(`${API_BASE}/admins/${a.id}`, { method: 'DELETE', headers: headers() })
    const data = await res.json()
    if (!data.success) return setMsg({ type: 'error', text: data.error })
    setAdmins(list => list.filter(x => x.id !== a.id))
    setMsg({ type: 'ok', text: `Admin access removed for ${a.name}.` })
  }

  return (
    <div className="admin-home-page">
      <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="dash-title">Admins & Access</h1>
          <p className="dash-sub">Add admins and choose which sections of the panel each admin can use. Super Admins always have full access.</p>
        </div>
        {!form && <button className="ab-btn gold" onClick={() => { setForm(emptyForm); setMsg({ type: '', text: '' }) }}><UserPlus size={15} /> Add Admin</button>}
      </div>

      {msg.text && <div className={`aa-msg ${msg.type}`}>{msg.text}</div>}

      {form && (
        <form className="ab-form" onSubmit={addAdmin}>
          <div className="full" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="ab-form-title">Add Admin</h3>
            <button type="button" className="ab-btn" onClick={() => setForm(null)}><X size={14} /></button>
          </div>
          <label>Name<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></label>
          <label>Email *<input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@example.com" required /></label>
          <label className="full">Password
            <input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters (not needed if the email already has an account)" />
          </label>
          <div className="full">
            <span className="ab-img-label">What can this admin access?</span>
            <PermissionPicker all={perms} value={form.permissions} onChange={v => setForm(f => ({ ...f, permissions: v }))} />
          </div>
          <div className="full"><button className="ab-btn gold" disabled={busy}>{busy ? 'Saving…' : 'Create Admin'}</button></div>
        </form>
      )}

      {loading ? <div className="ab-empty"><Loader2 size={26} className="spin-icon" /></div> : (
        <div className="ab-list">
          {admins.map(a => {
            const isSuper = a.role === 'superadmin'
            return (
              <div className="ab-item" key={a.id}>
                <div className="ab-item-head">
                  <div>
                    <h4>
                      {isSuper ? <Crown size={15} color="#C9952A" /> : <ShieldCheck size={15} color="#2563eb" />} {a.name}
                      {a.id === user?.id && <span className="ab-link-badge" style={{ marginLeft: 6 }}>You</span>}
                    </h4>
                    <div className="ab-meta"><span>{a.email}</span></div>
                  </div>
                  <span className="ab-badge" style={isSuper ? { background: '#fef3c7', color: '#92400e' } : { background: '#dbeafe', color: '#1e40af' }}>
                    {isSuper ? 'Super Admin' : 'Admin'}
                  </span>
                </div>

                {isSuper ? (
                  <div className="aa-chips"><span className="aa-chip all">Full access to everything</span></div>
                ) : editId === a.id ? (
                  <div style={{ marginTop: 12 }}>
                    <PermissionPicker all={perms} value={editPerms} onChange={setEditPerms} />
                    <div className="ab-actions">
                      <button className="ab-btn gold" disabled={busy} onClick={() => savePerms(a.id)}>{busy ? 'Saving…' : 'Save Access'}</button>
                      <button className="ab-btn" onClick={() => setEditId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="aa-chips">
                      {a.permissions.length === 0
                        ? <span className="aa-chip none">No access yet</span>
                        : a.permissions.map(p => <span key={p} className="aa-chip">{label(p)}</span>)}
                    </div>
                    <div className="ab-actions">
                      <button className="ab-btn" onClick={() => { setEditId(a.id); setEditPerms(a.permissions) }}><Pencil size={13} /> Edit Access</button>
                      <button className="ab-btn" onClick={() => resetPassword(a)}><KeyRound size={13} /> Reset Password</button>
                      <button className="ab-btn red" onClick={() => removeAdmin(a)}><Trash2 size={13} /> Remove Admin</button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Pencil, X, Star, MessageSquare, PackageOpen, Loader2, CheckCircle, Upload, Image } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE } from '../data/dishes.js'
import './AdminHome.css'

const emptyForm = { name: '', role: '', img: '', text: '', stars: 5, order: 0 }

async function apiCall(path, method = 'GET', body, token) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (token) opts.headers['Authorization'] = `Bearer ${token}`
  if (body)  opts.body = JSON.stringify(body)
  const res  = await fetch(`${API_BASE}/home/${path}`, opts)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Request failed')
  return data
}

async function uploadImage(file, token) {
  const fd = new FormData()
  fd.append('image', file)
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: fd
  })
  const data = await res.json()
  if (!data.success && !data.url) throw new Error(data.error || 'Upload failed')
  return data.url || data.data?.url || data.imageUrl
}

function ImageField({ label, value, onChange, token }) {
  const [tab, setTab] = useState('url')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const fileRef = useRef()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setUploadErr('')
    try {
      const url = await uploadImage(file, token)
      onChange(url)
    } catch (err) {
      setUploadErr('Upload failed. Please use URL instead.')
    } finally { setUploading(false) }
  }

  return (
    <div className="form-row">
      <label><Image size={13} /> {label}</label>
      <div className="img-upload-tabs">
        <button type="button" className={`img-tab-btn ${tab === 'url' ? 'active' : ''}`} onClick={() => setTab('url')}>
          URL
        </button>
        <button type="button" className={`img-tab-btn ${tab === 'file' ? 'active' : ''}`} onClick={() => setTab('file')}>
          Upload from Device
        </button>
      </div>
      {tab === 'url' ? (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="https://images.unsplash.com/..." />
      ) : (
        <>
          <div className="img-upload-area" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} />
            <Upload size={22} className="img-upload-icon" />
            <span className="img-upload-label">Click to browse image</span>
            <span className="img-upload-sub">JPG, PNG, WEBP supported</span>
          </div>
          {uploadErr && <p className="form-error">{uploadErr}</p>}
        </>
      )}
      {uploading && (
        <div className="uploading-indicator">
          <Loader2 size={14} className="spin-icon" /> Uploading image…
        </div>
      )}
      {value && !uploading && (
        <div className="image-preview-wrap">
          <img
            src={value} alt="preview"
            style={{ borderRadius: '50%', width: 80, height: 80, objectFit: 'cover' }}
            onError={e => e.target.style.display = 'none'}
          />
          <button type="button" className="img-remove-btn" onClick={() => onChange('')}>✕</button>
        </div>
      )}
    </div>
  )
}

export default function AdminTestimonials() {
  const { getToken } = useAuth()
  const [items, setItems]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [form, setForm]             = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [editItem, setEditItem]     = useState(null)
  const [editForm, setEditForm]     = useState(emptyForm)
  const [editErr, setEditErr]       = useState('')
  const [editSub, setEditSub]       = useState(false)

  async function refresh() {
    try { setLoading(true); const d = await apiCall('testimonials'); setItems(d.data) }
    catch { } finally { setLoading(false) }
  }
  useEffect(() => { refresh() }, [])

  const set = (setter) => (e) => {
    const { name, value } = e.target
    setter(f => ({ ...f, [name]: value }))
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.name || !form.role || !form.img || !form.text) {
      setError('Name, role, avatar image, and review text are all required.'); return
    }
    setSubmitting(true)
    try {
      await apiCall('testimonials', 'POST', { ...form, stars: Number(form.stars), order: Number(form.order) }, getToken())
      setSuccess(`Testimonial for "${form.name}" added successfully!`)
      setForm(emptyForm)
      await refresh()
    } catch (err) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete testimonial by "${name}"?`)) return
    try { await apiCall(`testimonials/${id}`, 'DELETE', null, getToken()); await refresh() }
    catch (err) { setError(err.message) }
  }

  function openEdit(item) {
    setEditItem(item)
    setEditForm({ name: item.name, role: item.role, img: item.img, text: item.text, stars: item.stars, order: item.order || 0 })
    setEditErr('')
  }

  async function handleEditSave(e) {
    e.preventDefault()
    setEditErr('')
    if (!editForm.name || !editForm.role || !editForm.img || !editForm.text) {
      setEditErr('All fields are required.'); return
    }
    setEditSub(true)
    try {
      await apiCall(`testimonials/${editItem._id}`, 'PUT', { ...editForm, stars: Number(editForm.stars), order: Number(editForm.order) }, getToken())
      setEditItem(null)
      setSuccess(`"${editForm.name}" testimonial updated!`)
      await refresh()
    } catch (err) { setEditErr(err.message) }
    finally { setEditSub(false) }
  }

  return (
    <div className="admin-home-page">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Manage Testimonials</h1>
          <p className="dash-sub">Add, edit, or delete guest reviewsWelcome back, Admin here's what's happening today. they appear on the homepage instantly.</p>
        </div>
      </div>

      <div className="home-page-layout">
        {/* ── Add Form ── */}
        <div className="dash-card">
          <div className="card-head">
            <h3 className="card-title"><Plus size={16} /> Add New Testimonial</h3>
          </div>
          <form className="add-home-form" onSubmit={handleAdd}>
            <div className="form-row">
              <label>Guest Name</label>
              <input name="name" value={form.name} onChange={set(setForm)} placeholder="e.g. Priya Sharma" />
            </div>
            <div className="form-row-split">
              <div>
                <label>Role / Tag</label>
                <input name="role" value={form.role} onChange={set(setForm)} placeholder="e.g. Happy Customer" />
              </div>
              <div>
                <label>Sort Order</label>
                <input type="number" name="order" value={form.order} onChange={set(setForm)} placeholder="1" min="0" />
              </div>
            </div>
            <ImageField
              label="Guest Avatar"
              value={form.img}
              onChange={(url) => setForm(f => ({ ...f, img: url }))}
              token={getToken()}
            />
            <div className="form-row">
              <label>Review Text</label>
              <textarea name="text" value={form.text} onChange={set(setForm)} rows={4} placeholder="Write the guest's experience here…" />
            </div>
            <div className="form-row">
              <label>Rating (1–5 Stars)</label>
              <div className="stars-row">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" className={`star-btn ${Number(form.stars) >= n ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, stars: n }))}>
                    <Star size={22} fill={Number(form.stars) >= n ? '#C9952A' : 'none'} stroke="#C9952A" />
                  </button>
                ))}
              </div>
            </div>
            {error   && <p className="form-error">{error}</p>}
            {success && <p className="form-success"><CheckCircle size={14} /> {success}</p>}
            <button type="submit" className="add-home-submit" disabled={submitting}>
              {submitting ? <><Loader2 size={15} className="spin-icon" /> Adding…</> : <><Plus size={16} /> Add Testimonial</>}
            </button>
          </form>
        </div>

        {/* ── List ── */}
        <div className="dash-card">
          <div className="card-head">
            <h3 className="card-title"><MessageSquare size={16} /> All Testimonials</h3>
            <span className="card-badge">{items.length} total</span>
          </div>
          {loading ? (
            <div className="empty-state"><Loader2 size={30} className="spin-icon" /><p>Loading…</p></div>
          ) : items.length === 0 ? (
            <div className="empty-state"><PackageOpen size={36} /><p>No testimonials yet.</p><span>Add one using the form on the left.</span></div>
          ) : (
            <div className="home-table-wrap">
              <table className="home-table">
                <thead><tr><th>Avatar</th><th>Name</th><th>Role</th><th>Stars</th><th>Order</th><th>Actions</th></tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item._id}>
                      <td><img src={item.img} alt={item.name} className="row-thumb-round" /></td>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td style={{ color: '#6b7280', fontSize: '.82rem' }}>{item.role}</td>
                      <td>
                        <div className="stars-display">
                          {[1,2,3,4,5].map(n => <Star key={n} size={12} fill={n <= item.stars ? '#C9952A' : 'none'} stroke="#C9952A" strokeWidth={1.5} />)}
                        </div>
                      </td>
                      <td>{item.order}</td>
                      <td>
                        <div className="action-btns">
                          <button className="row-edit-btn" onClick={() => openEdit(item)} title="Edit"><Pencil size={14} /></button>
                          <button className="row-delete-btn" onClick={() => handleDelete(item._id, item.name)} title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editItem && (
        <div className="edit-modal-overlay" onClick={() => setEditItem(null)}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <div className="edit-modal-head">
              <h3><Pencil size={15} style={{ verticalAlign: '-2px' }} /> Edit Testimonial</h3>
              <button className="edit-modal-close" onClick={() => setEditItem(null)}><X size={18} /></button>
            </div>
            <form className="add-home-form" onSubmit={handleEditSave}>
              <div className="form-row">
                <label>Guest Name</label>
                <input name="name" value={editForm.name} onChange={set(setEditForm)} />
              </div>
              <div className="form-row-split">
                <div><label>Role / Tag</label><input name="role" value={editForm.role} onChange={set(setEditForm)} /></div>
                <div><label>Sort Order</label><input type="number" name="order" value={editForm.order} onChange={set(setEditForm)} min="0" /></div>
              </div>
              <ImageField
                label="Guest Avatar"
                value={editForm.img}
                onChange={(url) => setEditForm(f => ({ ...f, img: url }))}
                token={getToken()}
              />
              <div className="form-row">
                <label>Review Text</label>
                <textarea name="text" value={editForm.text} onChange={set(setEditForm)} rows={4} />
              </div>
              <div className="form-row">
                <label>Rating (Stars)</label>
                <div className="stars-row">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" className={`star-btn ${Number(editForm.stars) >= n ? 'active' : ''}`}
                      onClick={() => setEditForm(f => ({ ...f, stars: n }))}>
                      <Star size={22} fill={Number(editForm.stars) >= n ? '#C9952A' : 'none'} stroke="#C9952A" />
                    </button>
                  ))}
                </div>
              </div>
              {editErr && <p className="form-error">{editErr}</p>}
              <div className="edit-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditItem(null)}>Cancel</button>
                <button type="submit" className="add-home-submit" disabled={editSub}>
                  {editSub ? <><Loader2 size={15} className="spin-icon" /> Saving…</> : <><CheckCircle size={15} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
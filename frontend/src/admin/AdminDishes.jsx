import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Leaf, Flame, ImagePlus, Upload, Link as LinkIcon, Star, ChefHat, PackageOpen, CheckCircle, Loader2, Pencil, X, Tag } from 'lucide-react'
import { categories, addDish, deleteDish, updateDish, fetchDishes } from '../data/dishes.js'
import { useAuth } from '../context/AuthContext.jsx'
import './AdminDishes.css'

const CAT_OPTIONS = categories.filter(c => c !== 'All')
const SPICE_OPTIONS = [0, 1, 2, 3, 4]

const emptyForm = {
  name: '', price: '', image: '',
  cat: CAT_OPTIONS[0], tag: 'Veg', spice: 1, desc: '', bestseller: false, discount: '',
}

export default function AdminDishes() {
  const { getToken } = useAuth()
  const [form, setForm]             = useState(emptyForm)
  const [imageMode, setImageMode]   = useState('url')
  const [allDishes, setAllDishes]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const fileInputRef                = useRef(null)

  // Edit modal state
  const [editDish, setEditDish]         = useState(null) // dish being edited
  const [editForm, setEditForm]         = useState(emptyForm)
  const [editImageMode, setEditImageMode] = useState('url')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError]       = useState('')
  const editFileRef                     = useRef(null)

  async function refresh() {
    try {
      setLoading(true)
      const dishes = await fetchDishes()
      setAllDishes(dishes)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleImageModeChange(mode) {
    setImageMode(mode)
    setForm(f => ({ ...f, image: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please upload a valid image file.'); return }
    const reader = new FileReader()
    reader.onload = () => { setForm(f => ({ ...f, image: reader.result })); setError('') }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.name.trim() || !form.price || !form.image.trim() || !form.desc.trim()) {
      setError('Please fill in name, price, image and description.'); return
    }
    if (Number(form.price) <= 0) { setError('Price must be greater than 0.'); return }
    if (form.discount && Number(form.discount) >= Number(form.price)) {
      setError('Discount cannot be equal to or greater than the price.'); return
    }
    setSubmitting(true)
    try {
      const token = getToken()
      await addDish({ ...form, spice: Number(form.spice), discount: Number(form.discount) || 0 }, token)
      setSuccess(`"${form.name}" has been added to the menu.`)
      setForm(emptyForm); setImageMode('url')
      if (fileInputRef.current) fileInputRef.current.value = ''
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to add dish.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await deleteDish(id, getToken())
      setSuccess('')
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to delete dish.')
    }
  }

  // ── Edit handlers ──
  function openEdit(dish) {
    setEditDish(dish)
    setEditForm({
      name: dish.name, price: dish.price, image: dish.image,
      cat: dish.cat, tag: dish.tag, spice: dish.spice,
      desc: dish.desc, bestseller: dish.bestseller, discount: dish.discount || '',
    })
    setEditImageMode('url')
    setEditError('')
  }

  function closeEdit() {
    setEditDish(null)
    setEditForm(emptyForm)
    setEditError('')
    if (editFileRef.current) editFileRef.current.value = ''
  }

  function handleEditChange(e) {
    const { name, value, type, checked } = e.target
    setEditForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleEditFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setEditError('Please upload a valid image file.'); return }
    const reader = new FileReader()
    reader.onload = () => { setEditForm(f => ({ ...f, image: reader.result })); setEditError('') }
    reader.readAsDataURL(file)
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    setEditError('')
    if (!editForm.name.trim() || !editForm.price || !editForm.image.trim() || !editForm.desc.trim()) {
      setEditError('Please fill in name, price, image and description.'); return
    }
    if (editForm.discount && Number(editForm.discount) >= Number(editForm.price)) {
      setEditError('Discount cannot be equal to or greater than the price.'); return
    }
    setEditSubmitting(true)
    try {
      await updateDish(editDish.id, { ...editForm, spice: Number(editForm.spice), discount: Number(editForm.discount) || 0 }, getToken())
      setSuccess(`"${editForm.name}" updated successfully.`)
      closeEdit()
      await refresh()
    } catch (err) {
      setEditError(err.message || 'Failed to update dish.')
    } finally {
      setEditSubmitting(false)
    }
  }

  return (
    <div className="admin-dishes">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Manage Dishes</h1>
          <p className="dash-sub">Add a dish below it will appear instantly on the public menu.</p>
        </div>
      </div>

      <div className="dishes-layout">
        {/* ── Add Dish Form ── */}
        <div className="dash-card add-dish-card">
          <div className="card-head">
            <h3 className="card-title"><Plus size={16} style={{ verticalAlign: '-3px' }} /> Add New Dish</h3>
          </div>

          <form className="add-dish-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Dish Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Chicken Biryani" />
            </div>

            <div className="form-row form-row-split">
              <div>
                <label>Price (₹)</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="299" min="0" />
              </div>
              <div>
                <label>Category</label>
                <select name="cat" value={form.cat} onChange={handleChange}>
                  {CAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row form-row-split">
              <div>
                <label>Type</label>
                <select name="tag" value={form.tag} onChange={handleChange}>
                  <option value="Veg">Veg</option>
                  <option value="Non-Veg">Non-Veg</option>
                </select>
              </div>
              <div>
                <label>Spice Level</label>
                <select name="spice" value={form.spice} onChange={handleChange}>
                  {SPICE_OPTIONS.map(s => <option key={s} value={s}>{s === 0 ? 'No Spice' : `Level ${s}`}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <label><Tag size={14} style={{ verticalAlign: '-2px' }} /> Discount / Offer (₹) — optional</label>
              <input
                type="number"
                name="discount"
                value={form.discount}
                onChange={handleChange}
                placeholder="e.g. 137 (leave empty for no offer)"
                min="0"
              />
              {Number(form.discount) > 0 && Number(form.price) > 0 && (
                <p className="discount-preview-hint">
                  Selling price will show as ₹{Math.max(Number(form.price) - Number(form.discount), 0)} (cut from ₹{form.price})
                </p>
              )}
            </div>

            <div className="form-row">
              <label><ImagePlus size={14} style={{ verticalAlign: '-2px' }} /> Dish Image</label>
              <div className="image-mode-toggle">
                <button type="button" className={`image-mode-btn ${imageMode === 'url' ? 'active' : ''}`} onClick={() => handleImageModeChange('url')}>
                  <LinkIcon size={13} /> Image URL
                </button>
                <button type="button" className={`image-mode-btn ${imageMode === 'upload' ? 'active' : ''}`} onClick={() => handleImageModeChange('upload')}>
                  <Upload size={13} /> Upload from System
                </button>
              </div>
              {imageMode === 'url'
                ? <input type="text" name="image" value={form.image} onChange={handleChange} placeholder="https://images.unsplash.com/..." />
                : <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="file-upload-input" />
              }
            </div>

            {form.image && (
              <div className="image-preview-wrap">
                <img src={form.image} alt="preview" className="image-preview" onError={e => e.target.style.display='none'} />
              </div>
            )}

            <div className="form-row">
              <label>Description</label>
              <textarea name="desc" value={form.desc} onChange={handleChange} rows={3} placeholder="Short tasty description of the dish..." />
            </div>

            <div className="form-row form-checkbox-row">
              <label className="checkbox-label">
                <input type="checkbox" name="bestseller" checked={form.bestseller} onChange={handleChange} />
                <Star size={14} /> Mark as Bestseller
              </label>
            </div>

            {error   && <p className="form-error">{error}</p>}
            {success && <p className="form-success"><CheckCircle size={14} style={{ verticalAlign: '-2px', marginRight: 5 }} />{success}</p>}

            <button type="submit" className="add-dish-submit" disabled={submitting}>
              {submitting ? <><Loader2 size={15} className="spin-icon" /> Adding…</> : <><Plus size={16} /> Add Dish</>}
            </button>
          </form>
        </div>

        {/* ── All Dishes List ── */}
        <div className="dash-card dishes-list-card">
          <div className="card-head">
            <h3 className="card-title"><ChefHat size={16} style={{ verticalAlign: '-3px' }} /> All Dishes on Menu</h3>
            <span className="card-badge">{allDishes.length} total</span>
          </div>

          {loading ? (
            <div className="empty-dishes-state"><Loader2 size={30} className="spin-icon" /><p>Loading dishes…</p></div>
          ) : allDishes.length === 0 ? (
            <div className="empty-dishes-state">
              <PackageOpen size={36} />
              <p>No dishes yet.</p>
              <span>Add your first dish using the form on the left.</span>
            </div>
          ) : (
            <div className="dishes-table-wrap">
              <table className="dishes-table">
                <thead>
                  <tr>
                    <th>Image</th><th>Name</th><th>Category</th><th>Type</th><th>Price</th><th>Offer</th><th>Spice</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {allDishes.map(d => (
                    <tr key={d.id}>
                      <td><img src={d.image} alt={d.name} className="dish-thumb" /></td>
                      <td className="dish-name-cell">
                        {d.name}
                        {d.bestseller && <span className="mini-best"><Star size={10} fill="currentColor" /> Best</span>}
                      </td>
                      <td>{d.cat}</td>
                      <td>
                        <span className={`type-pill ${d.tag === 'Veg' ? 'veg' : 'nonveg'}`}>
                          {d.tag === 'Veg' ? <Leaf size={11} /> : <Flame size={11} />} {d.tag}
                        </span>
                      </td>
                      <td>₹{d.price}</td>
                      <td>
                        {d.discount > 0
                          ? <span className="offer-pill"><Tag size={11} /> ₹{d.discount} off</span>
                          : <span className="no-offer">—</span>}
                      </td>
                      <td>{d.spice}</td>
                      <td className="action-btns">
                        <button className="row-edit-btn" onClick={() => openEdit(d)} title="Edit dish"><Pencil size={14} /></button>
                        <button className="row-delete-btn" onClick={() => handleDelete(d.id, d.name)} title="Delete dish"><Trash2 size={15} /></button>
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
      {editDish && (
        <div className="edit-modal-overlay" onClick={closeEdit}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <div className="edit-modal-head">
              <h3><Pencil size={15} style={{ verticalAlign: '-2px' }} /> Edit Dish</h3>
              <button className="edit-modal-close" onClick={closeEdit}><X size={18} /></button>
            </div>

            <form className="add-dish-form" onSubmit={handleEditSubmit}>
              <div className="form-row">
                <label>Dish Name</label>
                <input type="text" name="name" value={editForm.name} onChange={handleEditChange} placeholder="e.g. Chicken Biryani" />
              </div>

              <div className="form-row form-row-split">
                <div>
                  <label>Price (₹)</label>
                  <input type="number" name="price" value={editForm.price} onChange={handleEditChange} placeholder="299" min="0" />
                </div>
                <div>
                  <label>Category</label>
                  <select name="cat" value={editForm.cat} onChange={handleEditChange}>
                    {CAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row form-row-split">
                <div>
                  <label>Type</label>
                  <select name="tag" value={editForm.tag} onChange={handleEditChange}>
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                  </select>
                </div>
                <div>
                  <label>Spice Level</label>
                  <select name="spice" value={editForm.spice} onChange={handleEditChange}>
                    {SPICE_OPTIONS.map(s => <option key={s} value={s}>{s === 0 ? 'No Spice' : `Level ${s}`}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <label><Tag size={14} style={{ verticalAlign: '-2px' }} /> Discount / Offer (₹) — optional</label>
                <input
                  type="number"
                  name="discount"
                  value={editForm.discount}
                  onChange={handleEditChange}
                  placeholder="e.g. 137 (leave empty for no offer)"
                  min="0"
                />
                {Number(editForm.discount) > 0 && Number(editForm.price) > 0 && (
                  <p className="discount-preview-hint">
                    Selling price will show as ₹{Math.max(Number(editForm.price) - Number(editForm.discount), 0)} (cut from ₹{editForm.price})
                  </p>
                )}
              </div>

              <div className="form-row">
                <label><ImagePlus size={14} style={{ verticalAlign: '-2px' }} /> Dish Image</label>
                <div className="image-mode-toggle">
                  <button type="button" className={`image-mode-btn ${editImageMode === 'url' ? 'active' : ''}`} onClick={() => { setEditImageMode('url'); setEditForm(f => ({ ...f, image: '' })) }}>
                    <LinkIcon size={13} /> Image URL
                  </button>
                  <button type="button" className={`image-mode-btn ${editImageMode === 'upload' ? 'active' : ''}`} onClick={() => { setEditImageMode('upload'); setEditForm(f => ({ ...f, image: '' })) }}>
                    <Upload size={13} /> Upload from System
                  </button>
                </div>
                {editImageMode === 'url'
                  ? <input type="text" name="image" value={editForm.image} onChange={handleEditChange} placeholder="https://images.unsplash.com/..." />
                  : <input type="file" accept="image/*" ref={editFileRef} onChange={handleEditFile} className="file-upload-input" />
                }
              </div>

              {editForm.image && (
                <div className="image-preview-wrap">
                  <img src={editForm.image} alt="preview" className="image-preview" onError={e => e.target.style.display='none'} />
                </div>
              )}

              <div className="form-row">
                <label>Description</label>
                <textarea name="desc" value={editForm.desc} onChange={handleEditChange} rows={3} placeholder="Short tasty description..." />
              </div>

              <div className="form-row form-checkbox-row">
                <label className="checkbox-label">
                  <input type="checkbox" name="bestseller" checked={editForm.bestseller} onChange={handleEditChange} />
                  <Star size={14} /> Mark as Bestseller
                </label>
              </div>

              {editError && <p className="form-error">{editError}</p>}

              <div className="edit-modal-actions">
                <button type="button" className="btn-cancel" onClick={closeEdit}>Cancel</button>
                <button type="submit" className="add-dish-submit" disabled={editSubmitting}>
                  {editSubmitting ? <><Loader2 size={15} className="spin-icon" /> Saving…</> : <><CheckCircle size={15} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
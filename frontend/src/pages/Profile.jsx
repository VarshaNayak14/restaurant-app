import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Package, LogOut, Star, MapPin, Clock, Loader2, X, CheckCircle2, ChevronLeft, Camera, Mic, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import './Profile.css'

const API = 'https://restaurant-app-djtk.onrender.com/api'

const RATING_LABELS = ['Very Bad', 'Bad', 'Ok-Ok', 'Good', 'Very Good']
const RATING_MSG = {
  1: "We're sorry to hear that. We'll do better.",
  2: "Thanks for letting us know — we'll improve.",
  3: "Thanks for your feedback!",
  4: 'We are glad you liked the product!',
  5: "Amazing! We're thrilled you loved it!",
}
const STEPS_META = [
  { n: 1, label: 'Rating' },
  { n: 2, label: 'Photos & Videos' },
  { n: 3, label: 'Comment' },
]

/* ── Rate & Review Modal (3-step wizard) ── */
function ReviewModal({ order, reviewedMap, onClose, onSaved, getToken }) {
  const [activeItem, setActiveItem] = useState(null) // item being rated right now
  const [step, setStep]       = useState(1)
  const [rating, setRating]   = useState(0)
  const [hoverStar, setHoverStar] = useState(0)
  const [tasteRating, setTasteRating] = useState(0)
  const [hoverTaste, setHoverTaste]   = useState(0)
  const [photos, setPhotos]   = useState([]) // [{url, type}]
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const fileInputRef = useRef(null)

  function openItem(item) {
    const existing = reviewedMap[item.id]
    setActiveItem(item)
    setStep(1)
    setRating(existing?.rating || 0)
    setTasteRating(existing?.tasteRating || 0)
    setPhotos((existing?.images || []).map(url => ({ url, type: 'image' })))
    setFeedback(existing?.feedback || '')
    setError('')
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        setPhotos(prev => [...prev, { url: reader.result, type: file.type.startsWith('video') ? 'video' : 'image' }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removePhoto(idx) {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    if (!rating) { setError('Please select a star rating.'); setStep(1); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          orderId: order._id,
          dishId: activeItem.id,
          rating,
          tasteRating,
          images: photos.map(p => p.url),
          feedback,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Could not submit review.')
      onSaved(activeItem.id, data.review)
      setActiveItem(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function goNext() { setStep(s => Math.min(s + 1, 3)) }
  function goBack() {
    if (step === 1) { setActiveItem(null); return }
    setStep(s => Math.max(s - 1, 1))
  }

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={e => e.stopPropagation()}>

        {!activeItem ? (
          <>
            <button className="review-modal-close" onClick={onClose}><X size={18}/></button>
            <h3 className="review-modal-title">Rate your order</h3>
            <p className="review-modal-sub">Order {order.orderId} — tap a dish to rate it</p>
            <div className="review-item-list">
              {order.items.map(item => {
                const done = reviewedMap[item.id]
                return (
                  <button key={item.id} className="review-item-row" onClick={() => openItem(item)}>
                    <img src={item.image} alt={item.name}/>
                    <div className="review-item-info">
                      <span className="review-item-name">{item.name}</span>
                      {done ? (
                        <span className="review-item-done">
                          <CheckCircle2 size={13}/> Rated {done.rating}★ — tap to edit
                        </span>
                      ) : (
                        <span className="review-item-pending">Not rated yet</span>
                      )}
                    </div>
                    <div className="review-item-stars">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={14}
                          fill={n <= (done?.rating || 0) ? 'currentColor' : 'none'}
                          style={{ color: 'var(--primary)' }}/>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            {/* ── Header with back arrow + title ── */}
            <div className="rw-header">
              <button className="rw-back-arrow" onClick={goBack}><ChevronLeft size={20}/></button>
              <span className="rw-title">ADD FEEDBACK</span>
              <button className="review-modal-close rw-close" onClick={onClose}><X size={18}/></button>
            </div>

            {/* ── Stepper ── */}
            <div className="rw-stepper">
              {STEPS_META.map((s, i) => (
                <React.Fragment key={s.n}>
                  <div className={`rw-step ${step === s.n ? 'rw-active' : ''} ${step > s.n ? 'rw-done' : ''}`}>
                    <div className="rw-step-circle">{step > s.n ? <CheckCircle2 size={15}/> : s.n}</div>
                    <span className="rw-step-label">{s.label}</span>
                  </div>
                  {i < STEPS_META.length - 1 && <div className={`rw-step-line ${step > s.n ? 'rw-line-done' : ''}`}/>}
                </React.Fragment>
              ))}
            </div>

            <div className="rw-dish-tag">
              <img src={activeItem.image} alt={activeItem.name}/>
              <span>{activeItem.name}</span>
            </div>

            {/* ── Step 1: Rating ── */}
            {step === 1 && (
              <div className="rw-step-body">
                <div className="rw-stars-row">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      className="rw-star-col"
                      onMouseEnter={() => setHoverStar(n)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={() => setRating(n)}
                    >
                      <Star
                        size={34}
                        fill={n <= (hoverStar || rating) ? 'currentColor' : 'none'}
                        style={{ color: 'var(--primary)' }}
                      />
                      <span className={(hoverStar || rating) === n ? 'rw-star-label-active' : ''}>{RATING_LABELS[n-1]}</span>
                    </button>
                  ))}
                </div>

                {rating > 0 && <p className="rw-rating-msg">{RATING_MSG[rating]}</p>}

                <h4 className="rw-section-heading">Tell us more about the Dish</h4>
                <p className="rw-subheading">Taste</p>
                <div className="rw-stars-row">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      className="rw-star-col"
                      onMouseEnter={() => setHoverTaste(n)}
                      onMouseLeave={() => setHoverTaste(0)}
                      onClick={() => setTasteRating(n)}
                    >
                      <Star
                        size={28}
                        fill={n <= (hoverTaste || tasteRating) ? 'currentColor' : 'none'}
                        style={{ color: 'var(--primary)' }}
                      />
                      <span className={(hoverTaste || tasteRating) === n ? 'rw-star-label-active' : ''}>{RATING_LABELS[n-1]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 2: Photos & Videos ── */}
            {step === 2 && (
              <div className="rw-step-body">
                <h4 className="rw-section-heading" style={{marginTop:0}}>Add Photos and Videos</h4>
                <div className="rw-photo-banner">
                  <p>Show us what your dish looked like</p>
                  <Camera size={36} style={{color:'var(--primary)', opacity:.8}}/>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  hidden
                  onChange={handleFiles}
                />
                <button className="rw-add-photos-btn" onClick={() => fileInputRef.current.click()}>
                  <Camera size={18}/> Add Photos & Videos
                </button>

                {photos.length > 0 && (
                  <div className="rw-photo-grid">
                    {photos.map((p, idx) => (
                      <div key={idx} className="rw-photo-thumb">
                        {p.type === 'video'
                          ? <video src={p.url} muted/>
                          : <img src={p.url} alt=""/>}
                        <button className="rw-photo-remove" onClick={() => removePhoto(idx)}><Trash2 size={12}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Comment ── */}
            {step === 3 && (
              <div className="rw-step-body">
                <h4 className="rw-section-heading" style={{marginTop:0}}>Type Comment</h4>
                <div className="rw-comment-wrap">
                  <textarea
                    className="rw-comment-input"
                    placeholder="Type Comment"
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    rows={3}
                    maxLength={1000}
                  />
                  <Mic size={18} className="rw-mic-icon"/>
                </div>
                {error && <p className="review-error">{error}</p>}
              </div>
            )}

            {/* ── Footer buttons ── */}
            <div className="rw-footer">
              {step < 3 ? (
                <>
                  <button className="rw-skip-btn" onClick={goNext}>Skip</button>
                  {((step === 1 && rating > 0) || (step === 2 && photos.length > 0)) && (
                    <button className="rw-next-btn" onClick={goNext}>Next</button>
                  )}
                </>
              ) : (
                <button className="rw-submit-btn" onClick={handleSubmit} disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spin"/> Submitting…</> : 'Submit'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const STATUS_LABEL = {
  confirmed:        'Confirmed',
  preparing:        'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
}
const STATUS_COLOR = {
  confirmed:        '#3b82f6',
  preparing:        '#f59e0b',
  out_for_delivery: '#8b5cf6',
  delivered:        '#10b981',
  cancelled:        '#ef4444',
}

const TABS = [
  { id: 'orders',  label: 'My Orders', icon: <Package size={16}/> },
  { id: 'profile', label: 'Account',   icon: <User size={16}/> },
  { id: 'rewards', label: 'Rewards',   icon: <Star size={16}/> },
]

export default function Profile() {
  const [tab, setTab]       = useState('orders')
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [reviewOrder, setReviewOrder] = useState(null) // order currently being rated (opens modal)
  const [reviewedByOrder, setReviewedByOrder] = useState({}) // { orderId: { dishId: review } }

  const { user, logout, getToken } = useAuth()
  const navigate = useNavigate()

  // Fetch orders when tab = orders and user is logged in
  useEffect(() => {
    if (tab !== 'orders' || !user) return
    setLoadingOrders(true)
    fetch(`${API}/orders/my`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => { if (data.success) setOrders(data.orders) })
      .catch(() => {})
      .finally(() => setLoadingOrders(false))
  }, [tab, user])

  // When a delivered order's review modal is opened, fetch any reviews
  // already submitted for it so we can pre-fill / show "Rated" state.
  function openReviewModal(order) {
    setReviewOrder(order)
    if (reviewedByOrder[order._id]) return // already fetched
    fetch(`${API}/reviews/my/${order._id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const map = {}
          data.reviews.forEach(r => { map[r.dishId] = r })
          setReviewedByOrder(prev => ({ ...prev, [order._id]: map }))
        }
      })
      .catch(() => {})
  }

  function handleReviewSaved(dishId, review) {
    setReviewedByOrder(prev => ({
      ...prev,
      [reviewOrder._id]: { ...(prev[reviewOrder._id] || {}), [dishId]: review },
    }))
  }

  if (!user) return (
    <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: '140px' }}>
      <h2>Please log in to view your profile.</h2>
      <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', gap: '8px', marginTop: '20px' }}>Login</Link>
    </div>
  )

  function handleLogout() { logout(); navigate('/') }

  const points = orders.length * 50
  const level  = points >= 500 ? 'Gold' : points >= 200 ? 'Silver' : 'Bronze'

  return (
    <div className="page-wrapper profile-page">
      <div className="container">
        <div className="profile-layout">

          {/* Sidebar */}
          <aside className="profile-sidebar">
            <div className="profile-hero-card">
              <div className="profile-av">{user.name[0].toUpperCase()}</div>
              <h3>{user.name}</h3>
              <p>{user.email}</p>
              <span className="profile-level">{level} Member</span>
            </div>
            <nav className="profile-nav">
              {TABS.map(t => (
                <button key={t.id} className={`pnav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                  {t.icon}{t.label}
                </button>
              ))}
              <button className="pnav-btn pnav-logout" onClick={handleLogout}><LogOut size={16}/>Logout</button>
            </nav>
          </aside>

          {/* Content */}
          <main className="profile-main">

            {/* ── Orders tab ── */}
            {tab === 'orders' && (
              <div>
                <h2 className="profile-section-title">My Orders</h2>

                {loadingOrders ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0', color: 'var(--text-muted)' }}>
                    <Loader2 size={20} className="spin"/>  Loading orders…
                  </div>
                ) : orders.length === 0 ? (
                  <div className="empty-orders">
                    <Package size={52} strokeWidth={1.2}/>
                    <p>No orders yet. Start exploring our menu!</p>
                    <Link to="/menu" className="btn-primary">Browse Menu</Link>
                  </div>
                ) : orders.map(o => (
                  <div key={o._id} className="order-card">
                    <div className="oc-header">
                      <div>
                        <div className="order-id">Order {o.orderId}</div>
                        <div className="order-date">
                          <Clock size={12}/> {new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                      <span className="order-status" style={{
                        background: STATUS_COLOR[o.status] + '22',
                        color: STATUS_COLOR[o.status],
                        padding: '4px 10px', borderRadius: '20px', fontWeight: 600, fontSize: '0.8rem',
                      }}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </div>
                    <div className="order-items-preview">
                      {o.items.slice(0, 3).map((i, idx) => (
                        <img key={idx} src={i.image} alt={i.name} title={i.name}/>
                      ))}
                      {o.items.length > 3 && <div className="more-items">+{o.items.length - 3}</div>}
                    </div>
                    <div className="oc-footer">
                      <span>{o.items.length} item{o.items.length !== 1 ? 's' : ''} · {o.payment?.toUpperCase()}</span>
                      <span className="order-total">₹{o.total}</span>
                    </div>
                    {o.status === 'delivered' && (
                      <button className="rate-review-btn" onClick={() => openReviewModal(o)}>
                        <Star size={14}/> Rate & Review
                        {reviewedByOrder[o._id] && Object.keys(reviewedByOrder[o._id]).length > 0 && (
                          <span className="rate-review-done-tag">
                            {Object.keys(reviewedByOrder[o._id]).length}/{o.items.length} rated
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Account tab ── */}
            {tab === 'profile' && (
              <div>
                <h2 className="profile-section-title">Account Details</h2>
                <div className="account-card">
                  <div className="account-row"><User size={16}/><div><label>Full Name</label><p>{user.name}</p></div></div>
                  <div className="account-row"><MapPin size={16}/><div><label>Email</label><p>{user.email}</p></div></div>
                  <div className="account-row"><Clock size={16}/><div><label>Member Since</label><p>{new Date(user.joined).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</p></div></div>
                </div>
              </div>
            )}

            {/* ── Rewards tab ── */}
            {tab === 'rewards' && (
              <div>
                <h2 className="profile-section-title">Rewards</h2>
                <div className="rewards-card">
                  <div className="rewards-header">
                    <div className="rewards-points">{points}</div>
                    <div>
                      <p className="rp-label">Spice Points</p>
                      <p className="rp-sub">Earn 50 points per order</p>
                    </div>
                  </div>
                  <div className="rewards-bar-wrap">
                    <div className="rbar-labels"><span>Bronze</span><span>Silver (200)</span><span>Gold (500)</span></div>
                    <div className="rbar"><div className="rbar-fill" style={{ width: `${Math.min((points / 500) * 100, 100)}%` }}/></div>
                  </div>
                </div>
                <div className="rewards-grid">
                  {[
                    { title: '₹50 Off',       pts: 100, desc: 'Get ₹50 off on your next order above ₹300' },
                    { title: 'Free Dessert',   pts: 150, desc: 'A complimentary dessert with any main course' },
                    { title: 'Free Delivery',  pts: 80,  desc: 'Free delivery on your next 3 orders' },
                  ].map((r, i) => (
                    <div key={i} className="reward-item">
                      <Star size={20} fill="currentColor" style={{ color: 'var(--primary)' }}/>
                      <div><h4>{r.title}</h4><p>{r.desc}</p></div>
                      <span className="reward-pts">{r.pts} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          reviewedMap={reviewedByOrder[reviewOrder._id] || {}}
          onClose={() => setReviewOrder(null)}
          onSaved={handleReviewSaved}
          getToken={getToken}
        />
      )}
    </div>
  )
}
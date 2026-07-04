import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Flame, Leaf, Star, ShoppingCart,
  Clock, Users, ChefHat, Share2, Heart, Plus, Minus, CheckCircle,
  Truck, Utensils, BadgeCheck, ThumbsUp, Image as ImageIcon
} from 'lucide-react'
import { fetchDishes } from '../data/dishes.js'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import './DishDetail.css'

const API = 'https://restaurant-app-djxk.onrender.com'

const spiceInfo = {
  0: { label: 'No Spice', color: '#10b981', bg: 'rgba(16,185,129,.12)' },
  1: { label: 'Mild',     color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  2: { label: 'Medium',   color: '#f97316', bg: 'rgba(249,115,22,.12)' },
  3: { label: 'Hot',      color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
  4: { label: 'Very Hot', color: '#dc2626', bg: 'rgba(220,38,38,.12)' },
}

/* ── Star renderer helper ── */
function Stars({ value, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={size}
          fill={n <= Math.round(value) ? '#C9952A' : 'none'}
          stroke={n <= Math.round(value) ? '#C9952A' : '#888'}
        />
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   Reviews Section — fetches real data from backend
══════════════════════════════════════════════════════ */
function ReviewsSection({ dishId }) {
  const [reviews, setReviews]   = useState([])
  const [average, setAverage]   = useState(0)
  const [count,   setCount]     = useState(0)
  const [loading, setLoading]   = useState(true)
  const [filter,  setFilter]    = useState(0)   // 0 = all, 1-5 = that star
  const [lightbox, setLightbox] = useState(null) // image URL to show full screen

  useEffect(() => {
    if (!dishId) return
    setLoading(true)
    fetch(`${API}/reviews/dish/${dishId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setReviews(data.reviews)
          setAverage(data.average)
          setCount(data.count)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dishId])

  /* Star distribution */
  const dist = [5,4,3,2,1].map(star => ({
    star,
    n: reviews.filter(r => r.rating === star).length,
    pct: count ? Math.round((reviews.filter(r => r.rating === star).length / count) * 100) : 0,
  }))

  const shown = filter === 0 ? reviews : reviews.filter(r => r.rating === filter)

  /* Relative time helper */
  function ago(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 30)  return `${days} days ago`
    if (days < 365) return `${Math.floor(days/30)} month${Math.floor(days/30) > 1 ? 's' : ''} ago`
    return `${Math.floor(days/365)} year${Math.floor(days/365) > 1 ? 's' : ''} ago`
  }

  return (
    <section className="dd-reviews-wrap">
      <h3 className="dd-reviews-title">Customer Reviews</h3>

      {loading ? (
        <div className="dd-reviews-loading">Loading reviews…</div>
      ) : count === 0 ? (
        <div className="dd-reviews-empty">
          <Star size={40} strokeWidth={1.2} />
          <p>No reviews yet. Be the first to rate this dish!</p>
        </div>
      ) : (
        <>
          {/* ── Rating Summary (Meesho/Amazon style) ── */}
          <div className="dd-rating-summary">
            <div className="dd-rating-left">
              <div className="dd-rating-big">{average.toFixed(1)}</div>
              <Stars value={average} size={20} />
              <div className="dd-rating-total">{count} {count === 1 ? 'rating' : 'ratings'}</div>
            </div>
            <div className="dd-rating-bars">
              {dist.map(d => (
                <button
                  key={d.star}
                  className={`dd-bar-row ${filter === d.star ? 'active' : ''}`}
                  onClick={() => setFilter(filter === d.star ? 0 : d.star)}
                >
                  <span className="dd-bar-label">{d.star} ★</span>
                  <div className="dd-bar-track">
                    <div className="dd-bar-fill" style={{ width: `${d.pct}%`,
                      background: d.star >= 4 ? '#22c55e' : d.star === 3 ? '#f59e0b' : '#ef4444'
                    }}/>
                  </div>
                  <span className="dd-bar-count">{d.n}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Filter chips ── */}
          <div className="dd-review-filters">
            <button className={`dd-rfilter-chip ${filter === 0 ? 'active' : ''}`} onClick={() => setFilter(0)}>
              All ({count})
            </button>
            {[5,4,3,2,1].map(s => (
              reviews.some(r => r.rating === s) && (
                <button
                  key={s}
                  className={`dd-rfilter-chip ${filter === s ? 'active' : ''}`}
                  onClick={() => setFilter(filter === s ? 0 : s)}
                >
                  {s} ★
                </button>
              )
            ))}
          </div>

          {/* ── Review Cards ── */}
          <div className="dd-review-list">
            {shown.length === 0 ? (
              <p className="dd-no-filter-reviews">No reviews for {filter}★ yet.</p>
            ) : shown.map(r => (
              <div key={r._id} className="dd-review-card">
                {/* Card header */}
                <div className="dd-rc-header">
                  <div className="dd-rc-avatar">
                    {(r.userName || 'U')[0].toUpperCase()}
                  </div>
                  <div className="dd-rc-meta">
                    <span className="dd-rc-name">{r.userName || 'Customer'}</span>
                    <span className="dd-rc-date">{ago(r.createdAt)}</span>
                  </div>
                  <div className="dd-rc-stars">
                    <Stars value={r.rating} size={13} />
                  </div>
                </div>

                {/* Taste rating badge */}
                {r.tasteRating > 0 && (
                  <div className="dd-rc-taste">
                    <Flame size={12} /> Taste: {r.tasteRating}/5
                  </div>
                )}

                {/* Feedback text */}
                {r.feedback && (
                  <p className="dd-rc-feedback">{r.feedback}</p>
                )}

                {/* Review images */}
                {r.images && r.images.length > 0 && (
                  <div className="dd-rc-images">
                    {r.images.map((img, i) => (
                      <button key={i} className="dd-rc-img-btn" onClick={() => setLightbox(img)}>
                        <img src={img} alt={`Review photo ${i+1}`} />
                        <div className="dd-rc-img-overlay"><ImageIcon size={14}/></div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Verified badge */}
                <div className="dd-rc-footer">
                  <span className="dd-rc-verified">✓ Verified Purchase</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div className="dd-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Review" onClick={e => e.stopPropagation()} />
          <button className="dd-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   Main DishDetail component
══════════════════════════════════════════════════════ */
export default function DishDetail() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const { addToCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()

  const [shareToast, setShareToast] = useState('')

  const [allDishes, setAllDishes]     = useState([])
  const [dishLoading, setDishLoading] = useState(true)

  /* Live review stats for the header */
  const [liveAvg,   setLiveAvg]   = useState(null)
  const [liveCount, setLiveCount] = useState(null)

  useEffect(() => {
    fetchDishes()
      .then(setAllDishes)
      .catch(() => {})
      .finally(() => setDishLoading(false))
  }, [])

  const dish    = allDishes.find(d => String(d.id) === String(id))
  const related = dish ? allDishes.filter(d => d.cat === dish.cat && String(d.id) !== String(id)) : []
  const galleryImages = dish ? [dish.image, ...(related.slice(0, 2).map(r => r.image))] : []

  /* Fetch live rating for THIS dish */
  useEffect(() => {
    if (!id) return
    fetch(`${API}/reviews/dish/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setLiveAvg(data.average)
          setLiveCount(data.count)
        }
      })
      .catch(() => {})
  }, [id])

  const [activeImg, setActiveImg] = useState(0)
  const [qty,       setQty]       = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [added,     setAdded]     = useState(false)

  useEffect(() => {
    setActiveImg(0); setQty(1); setActiveTab('description'); setAdded(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  if (dishLoading) return <div className="dd-notfound"><p>Loading dish…</p></div>
  if (!dish) return (
    <div className="dd-notfound">
      <p>Dish not found.</p>
      <button onClick={() => navigate('/menu')} className="dd-back-pill">
        <ArrowLeft size={15}/> Back to Menu
      </button>
    </div>
  )

  const spice = spiceInfo[dish.spice] ?? spiceInfo[0]

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) addToCart(dish)
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  /* Use live data if available, fallback to placeholder */
  const displayAvg   = liveCount > 0 ? liveAvg.toFixed(1) : '—'
  const displayCount = liveCount > 0 ? `${liveCount} review${liveCount !== 1 ? 's' : ''}` : 'No reviews yet'

  const tabs = ['description', 'ingredients', 'nutrition', 'reviews']

  return (
    <div className="dd-page">

      {/* Breadcrumb */}
      <nav className="dd-breadcrumb">
        <span onClick={() => navigate('/')}>Home</span>
        <span className="sep">/</span>
        <span onClick={() => navigate('/menu')}>Menu</span>
        <span className="sep">/</span>
        <span onClick={() => navigate('/menu')}>{dish.cat}</span>
        <span className="sep">/</span>
        <span className="active">{dish.name}</span>
      </nav>

      {/* Main 2-col grid */}
      <div className="dd-grid">

        {/* LEFT — Image gallery */}
        <div className="dd-gallery">
          <button className="dd-back-pill" onClick={() => navigate(-1)}>
            <ArrowLeft size={15}/> Back
          </button>
          <div className="dd-main-frame">
            <img key={activeImg} src={galleryImages[activeImg]} alt={dish.name} className="dd-main-img"/>
            {dish.bestseller && (
              <span className="dd-badge dd-badge-best"><Star size={10} fill="currentColor"/> Bestseller</span>
            )}
            <span className={`dd-badge dd-badge-diet ${dish.tag === 'Veg' ? 'veg' : 'nonveg'}`}>
              {dish.tag === 'Veg' ? <Leaf size={11}/> : <Flame size={11}/>} {dish.tag}
            </span>
            {dish.bestseller && <span className="dd-badge dd-badge-pick">Chef's Pick</span>}
          </div>
          <div className="dd-thumbs-row">
            {galleryImages.map((src, i) => (
              <button key={i} className={`dd-thumb-btn ${activeImg === i ? 'active' : ''}`}
                onClick={() => setActiveImg(i)}>
                <img src={src} alt={`view-${i}`}/>
                {activeImg === i && <div className="dd-thumb-overlay"/>}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — Product info */}
        <div className="dd-info">
          <div className="dd-info-toprow">
            <span className="dd-category-eyebrow">{dish.cat}</span>
            <div className="dd-stars-row">
              <Stars value={liveCount > 0 ? liveAvg : 4} size={13}/>
              <span className="dd-rating-num">{displayAvg}</span>
              <span className="dd-rating-count">({displayCount})</span>
            </div>
          </div>

          <h1 className="dd-dish-name">{dish.name}</h1>

          <div className="dd-price-block">
            {dish.discount > 0 ? (
              <>
                <span className="dd-price-now">₹{(dish.price - dish.discount) * qty}</span>
                <span className="dd-price-was">₹{dish.price * qty}</span>
                <span className="dd-save-chip">You save ₹{dish.discount * qty}!</span>
              </>
            ) : (
              <span className="dd-price-now">₹{dish.price * qty}</span>
            )}
          </div>

          <div className="dd-chips-row">
            <span className="dd-chip dd-chip-spice" style={{ '--sc': spice.color, '--sbg': spice.bg }}>
              <Flame size={12}/> {spice.label}
            </span>
            <span className="dd-chip"><Clock size={12}/> 20–30 min</span>
            <span className="dd-chip"><Users size={12}/> Serves 1</span>
          </div>

          <div className="dd-rule"/>

          <div className="dd-qty-row">
            <span className="dd-qty-label">Quantity</span>
            <div className="dd-qty-ctrl">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}><Minus size={13}/></button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}><Plus size={13}/></button>
            </div>
            <span className="dd-stock-pill">✓ 15 in stock</span>
          </div>

          <div className="dd-cta-row">
            <button className={`dd-btn-cart ${added ? 'success' : ''}`} onClick={handleAddToCart}>
              {added ? <><CheckCircle size={16}/> Added!</> : <><ShoppingCart size={16}/> Add to Cart</>}
            </button>
            <button className="dd-btn-order" onClick={() => { handleAddToCart(); navigate('/cart') }}>
              Order Now
            </button>
            <button
              className={`dd-btn-icon dd-btn-wish ${isWishlisted(dish.id) ? 'wished' : ''}`}
              title={isWishlisted(dish.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              onClick={() => toggleWishlist(dish)}
            >
              <Heart size={17} fill={isWishlisted(dish.id) ? '#ef4444' : 'none'} stroke={isWishlisted(dish.id) ? '#ef4444' : 'currentColor'}/>
            </button>
            <button
              className={`dd-btn-icon dd-btn-share ${shareToast ? 'share-active' : ''}`}
              title="Share"
              onClick={async () => {
                const url = window.location.href
                const text = `Check out ${dish.name} on HungryHub! 🍽️`
                if (navigator.share) {
                  try { await navigator.share({ title: dish.name, text, url }); setShareToast('shared') }
                  catch {}
                } else {
                  await navigator.clipboard.writeText(url)
                  setShareToast('copied')
                }
                setTimeout(() => setShareToast(''), 2500)
              }}
            >
              <Share2 size={17}/>
            </button>
          </div>
          {shareToast && (
            <div className="dd-share-toast">
              {shareToast === 'copied' ? '🔗 Link copied to clipboard!' : '✅ Shared successfully!'}
            </div>
          )}

          <div className="dd-trust">
            <div className="dd-trust-item">
              <span className="dd-trust-icon"><Truck size={18}/></span>
              <div><p className="dd-trust-title">Free Delivery</p><p className="dd-trust-sub">On orders above ₹499</p></div>
            </div>
            <div className="dd-trust-item">
              <span className="dd-trust-icon"><Utensils size={18}/></span>
              <div><p className="dd-trust-title">Fresh & Hygienic</p><p className="dd-trust-sub">Prepared to order</p></div>
            </div>
            <div className="dd-trust-item">
              <span className="dd-trust-icon"><BadgeCheck size={18}/></span>
              <div><p className="dd-trust-title">100% Satisfaction</p><p className="dd-trust-sub">Or your money back</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs (now includes Reviews) ── */}
      <div className="dd-tabs-wrap">
        <div className="dd-tabs-bar">
          {tabs.map(tab => (
            <button key={tab}
              className={`dd-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'reviews'
                ? `Reviews${liveCount > 0 ? ` (${liveCount})` : ''}`
                : tab.charAt(0).toUpperCase() + tab.slice(1)
              }
            </button>
          ))}
        </div>

        <div className="dd-tab-panel">
          {activeTab === 'description' && (
            <div className="dd-tab-desc">
              <p>{dish.desc}. This dish is prepared fresh to order by our expert chefs using traditional recipes passed down through generations. We source the finest local ingredients to bring you an authentic dining experience.</p>
              <div className="dd-feat-row">
                <div className="dd-feat-card"><ChefHat size={22}/><span>Chef's Special Recipe</span></div>
                <div className="dd-feat-card"><Leaf size={22}/><span>Farm-Fresh Ingredients</span></div>
                <div className="dd-feat-card"><Star size={22}/><span>Authentic Indian Flavours</span></div>
              </div>
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="dd-tab-ingr">
              <p className="dd-tab-note">Prepared fresh daily. Common allergens may be present in our kitchen.</p>
              <div className="dd-ingr-chips">
                {['Fresh Spices','Aromatic Herbs','Premium Oil','Rock Salt','Natural Flavours','No Preservatives','No Artificial Colours'].map(item => (
                  <span key={item} className="dd-ingr-chip">✓ {item}</span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="dd-tab-nut">
              <p className="dd-tab-note">Approximate values per serving (1 portion)</p>
              <div className="dd-nut-row">
                {[
                  { label: 'Calories', val: `${Math.round(dish.price * 1.2)}`,  unit: 'kcal', color: '#f97316' },
                  { label: 'Protein',  val: `${Math.round(dish.price * 0.08)}`, unit: 'g',    color: '#C9952A' },
                  { label: 'Carbs',    val: `${Math.round(dish.price * 0.15)}`, unit: 'g',    color: '#10b981' },
                  { label: 'Fat',      val: `${Math.round(dish.price * 0.05)}`, unit: 'g',    color: '#8b5cf6' },
                ].map(item => (
                  <div key={item.label} className="dd-nut-card" style={{ '--nc': item.color }}>
                    <span className="dd-nut-val">{item.val}<small>{item.unit}</small></span>
                    <span className="dd-nut-label">{item.label}</span>
                    <div className="dd-nut-bar"/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <ReviewsSection dishId={String(id)} />
          )}
        </div>
      </div>

      {/* Related Dishes */}
      {related.length > 0 && (
        <section className="dd-related-wrap">
          <div className="dd-related-header">
            <h3>You May Also Like</h3>
            <button onClick={() => navigate('/menu')} className="dd-see-all">See All →</button>
          </div>
          <div className="dd-related-grid">
            {related.slice(0, 3).map(r => (
              <div key={r.id} className="dd-rel-card" onClick={() => navigate(`/dish/${r.id}`)}>
                <div className="dd-rel-img">
                  <img src={r.image} alt={r.name}/>
                  <span className={`dd-rel-diet ${r.tag === 'Veg' ? 'veg' : 'nonveg'}`}>
                    {r.tag === 'Veg' ? <Leaf size={10}/> : <Flame size={10}/>}
                  </span>
                  {r.bestseller && <span className="dd-rel-best"><Star size={9} fill="currentColor"/> Best</span>}
                </div>
                <div className="dd-rel-info">
                  <h4>{r.name}</h4>
                  <p className="dd-rel-desc">{r.desc.slice(0, 55)}…</p>
                  <div className="dd-rel-bottom">
                    <span className="dd-rel-price">₹{r.price}</span>
                    <button className="dd-rel-add" onClick={e => { e.stopPropagation(); addToCart(r) }}>
                      <ShoppingCart size={12}/> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
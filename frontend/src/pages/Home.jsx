import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Star, Clock, Flame, Leaf, ChevronDown, Award, Users, UtensilsCrossed, Play, X, ChevronLeft, ChevronRight, ZoomIn, Heart, Tag } from 'lucide-react'
import { fetchFeaturedDishes, fetchTestimonials, fetchCategories, fetchChefs, fetchGallery, fetchActiveOffer } from '../data/dishes.js'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import './Home.css'

function Counter({ target, suffix = '', display }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let start = 0
      const step = () => {
        start += Math.ceil(target / 60)
        if (start >= target) { setVal(target); return }
        setVal(start); requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, { threshold: .5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{display || val.toLocaleString()}{suffix}</span>
}

/* Live countdown — jab admin ne offer schedule kiya ho to uske exact
   endAt tak count karta hai. Agar koi offer active nahi hai to purana
   default behaviour rakha hai: aaj raat 11:59:59 tak count karta hai. */
function calcTimeLeft(target) {
  const now = new Date()
  const end = target
    ? new Date(target)
    : (() => { const d = new Date(now); d.setHours(23, 59, 59, 999); return d })()
  const diff = Math.max(0, end - now)
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  }
}

function useCountdown(target) {
  const [time, setTime] = useState(() => calcTimeLeft(target))
  useEffect(() => {
    setTime(calcTimeLeft(target))
    const id = setInterval(() => setTime(calcTimeLeft(target)), 1000)
    return () => clearInterval(id)
  }, [target])
  return time
}

export default function Home() {

  const { addToCart } = useCart()
  const { toggleWishlist, isWishlisted } = useWishlist()
  const location = useLocation()
  const navigate = useNavigate()
  const menuRef    = useRef(null)
  const [menuVisible, setMenuVisible]   = useState(false)

  // Dynamic data states
  const [featuredDishes, setFeaturedDishes]   = useState([])
  const [testimonials, setTestimonials]       = useState([])
  const [homeCategories, setHomeCategories]   = useState([])
  const [chefs, setChefs]                     = useState([])
  const [gallery, setGallery]                 = useState([])
  const [offerDishes, setOfferDishes]         = useState([])   // dishes jinpe admin ne discount daala hai
  const [activeOffer, setActiveOffer]         = useState(null) // admin-scheduled offer (date/time window)

  const countdown = useCountdown(activeOffer?.endAt)

  // Lightbox state
  const [lightbox, setLightbox] = useState(null)

  const openLightbox = useCallback((item) => {
    setLightbox({ item, activeIdx: 0 })
    document.body.style.overflow = 'hidden'
  }, [])

  const closeLightbox = useCallback(() => {
    setLightbox(null)
    document.body.style.overflow = ''
  }, [])

  const lightboxPrev = useCallback(() => {
    setLightbox(lb => ({ ...lb, activeIdx: (lb.activeIdx - 1 + lb.item.related.length) % lb.item.related.length }))
  }, [])

  const lightboxNext = useCallback(() => {
    setLightbox(lb => ({ ...lb, activeIdx: (lb.activeIdx + 1) % lb.item.related.length }))
  }, [])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') lightboxPrev()
      if (e.key === 'ArrowRight') lightboxNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, closeLightbox, lightboxPrev, lightboxNext])

  // Fetch all dynamic data
  useEffect(() => {
    fetchFeaturedDishes().then(setFeaturedDishes).catch(() => {})
    fetchTestimonials().then(setTestimonials).catch(() => {})
    fetchCategories().then(setHomeCategories).catch(() => {})
    fetchChefs().then(setChefs).catch(() => {})
    fetchGallery().then(setGallery).catch(() => {})

    // Offer banner: SIRF tab dikhega jab admin ne Flash Offers se koi
    // offer schedule kiya ho AUR uska start/end window abhi active ho.
    // Koi fallback nahi — admin ne offer nahi daala to banner bilkul
    // nahi dikhega. Har 15s me backend se dobara check karte hain taaki
    // offer live hote hi automatically dikh jaye aur time khatam hote
    // hi automatically hat jaye (bina page refresh kiye).
    function loadOffer() {
      fetchActiveOffer()
        .then(offer => {
          if (offer && Array.isArray(offer.items) && offer.items.length > 0) {
            const onOffer = offer.items
              .filter(it => it.dish)
              .map(it => ({ ...it.dish, id: it.dish._id, discount: it.discount }))
              .sort((a, b) => Number(b.discount) - Number(a.discount))
            setActiveOffer(offer)
            setOfferDishes(onOffer)
          } else {
            setActiveOffer(null)
            setOfferDishes([])
          }
        })
        .catch(() => { setActiveOffer(null); setOfferDishes([]) })
    }

    loadOffer()
    const pollId = setInterval(loadOffer, 15000)
    return () => clearInterval(pollId)
  }, [])

  // Local countdown khatam hote hi banner turant hata do — agli poll
  // (15s ke andar) backend se bhi confirm ho jayega.
  useEffect(() => {
    if (!activeOffer) return
    if (countdown.h === 0 && countdown.m === 0 && countdown.s === 0) {
      setActiveOffer(null)
      setOfferDishes([])
    }
  }, [countdown, activeOffer])

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash)
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    }
  }, [location])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setMenuVisible(true) }, { threshold: 0.1 })
    if (menuRef.current) obs.observe(menuRef.current)
    return () => obs.disconnect()
  }, [])

  // Duplicate testimonials for infinite marquee
  const marqueeItems = testimonials.length > 0 ? [...testimonials, ...testimonials] : []

  return (
    <div className="home">

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="hero2">
        <div className="h2-bg" />

        <div className="h2-left in">
          <h1 className="h2-title">
            <span className="h2-t1">Unleashing Extraordinary Flavours</span>
            <span className="h2-t2">One Plate at a Time</span>
          </h1>

          <p className="h2-sub">
            Discover a mosaic of culinary excellence from farm-fresh ingredients to artfully curated menus, where every dish tells a tale of craftsmanship and every moment is a celebration of taste.
          </p>

          <div className="h2-actions">
            <Link to="/menu" className="h2-btn-primary">
              Order Now
            </Link>
            <Link to="/about" className="h2-btn-ghost">
              <span className="h2-play-ring"><Play size={13} fill="currentColor"/></span>
              Order Process
            </Link>
          </div>
        </div>

        <div className="h2-right in">
          <div className="h2-dish-simple">
            <img
              src="/pizza.png"
              alt="Pizza"
              className="h2-dish-img-static"
            />
          </div>
        </div>
      </section>

     
      {/* ══════════════════ STATS BAR ══════════════════ */}
      <section className="stats2-bar">
        {[
          { val: 1000,     label: 'Achieved National and\nInternational awards' },
          { val: 2000,    label: 'We have 10 international\nchef who give you best' },
          { val: 4000,    label: 'We have 20 branches\nall over the world' },
          { val: 50000, suf: '+', label: 'Happy Guests\nserved worldwide' },
        ].map((s, i) => (
          <div key={i} className="stats2-card">
            <div className="stats2-num"><Counter target={s.val} suffix={s.suf || ''}/></div>
            <div className="stats2-label">{s.label}</div>
          </div>
        ))}
      </section>



 {/* ══════════════════ TODAY'S OFFER BANNER (dynamic) ══════════════════ */}
      {offerDishes.length > 0 && (
        <section className="offer-banner-section">
          <div className="container">
            <div className="offer-banner">
              <div className="offer-banner-glow" />

              <div className="offer-banner-left">
                <span className="offer-banner-eyebrow">
                  <Flame size={13} /> {activeOffer ? 'Live Offer' : "Today's Sale"}
                </span>
                <h2 className="offer-banner-title">
                  {activeOffer?.title || 'Flash Offer'} — <span>{activeOffer ? 'Grab it now!' : 'Ends Tonight!'}</span>
                </h2>
                <p className="offer-banner-sub">
                  {activeOffer?.subtitle || `${offerDishes.length} dish${offerDishes.length > 1 ? 'es are' : ' is'} on a special discounted price today. Order before the clock runs out.`}
                </p>

                <div className="offer-countdown" aria-label="Offer ends in">
                  <div className="offer-count-box">
                    <span>{String(countdown.h).padStart(2, '0')}</span>
                    <small>Hrs</small>
                  </div>
                  <span className="offer-count-sep">:</span>
                  <div className="offer-count-box">
                    <span>{String(countdown.m).padStart(2, '0')}</span>
                    <small>Min</small>
                  </div>
                  <span className="offer-count-sep">:</span>
                  <div className="offer-count-box">
                    <span>{String(countdown.s).padStart(2, '0')}</span>
                    <small>Sec</small>
                  </div>
                </div>

                <Link to="/menu?offer=1" className="offer-banner-cta">
                  Grab the Deal <ArrowRight size={15} />
                </Link>
              </div>

              <div className="offer-banner-right">
                {offerDishes.map(dish => {
                  const finalPrice = dish.price - dish.discount
                  const pct = Math.round((dish.discount / dish.price) * 100)
                  return (
                    <div
                      key={dish.id}
                      className="offer-mini-card"
                      onClick={() => navigate(`/dish/${dish.id}`)}
                    >
                      <span className="offer-mini-pct">{pct}% OFF</span>
                      <img src={dish.image} alt={dish.name} className="offer-mini-img" />
                      <div className="offer-mini-info">
                        <span className="offer-mini-name">{dish.name}</span>
                        <span className="offer-mini-price">
                          <span className="offer-mini-old">₹{dish.price}</span>
                          <span className="offer-mini-new">₹{finalPrice}</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ CATEGORIES ══════════════════ */}
      <section className="categories-section" id="categories">
        <div className="container">
          <div className="section-header center" style={{marginBottom:'40px'}}>
            <span className="section-eyebrow"><Flame size={13}/> Exclusive Discounts on Best Items</span>
            <h2 className="section-title">Top <span>Flavor</span> Categories</h2>
            <div className="gold-line center"/>
          </div>
          <div className="categories-track-wrap">
            <div className="categories-track">
              {homeCategories.map((cat, i) => (
                <div key={cat._id || i} className="cat-item" style={{animationDelay:`${i*0.1}s`}}>
                  <Link to={cat.link || '/menu'} className="cat-circle-link">
                    <div className="cat-circle">
                      <img src={cat.img} alt={cat.name}/>
                      <div className="cat-shine"/>
                    </div>
                  </Link>
                  <span className="cat-name">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURED ══════════════════ */}
      <section className="section featured-section" id="featured">
        <div className="container">
          <div className="section-header center">
            <span className="section-eyebrow"><Flame size={13}/> Chef's Recommendations</span>
            <h2 className="section-title">Our <span>Signature</span> Dishes</h2>
            <div className="gold-line center"/>
            <p className="section-sub">Handpicked favourites that define the Spice Garden experience</p>
          </div>
          <div className="featured-grid">
            {featuredDishes.map((dish, i) => (
              <div
                key={dish.id}
                className="feat-card"
                style={{ animationDelay: `${i * 0.12}s`, cursor: 'pointer' }}
                onClick={() => navigate(`/dish/${dish.id}`)}
              >
                <div className="feat-img-wrap">
                  <img src={dish.image} alt={dish.name} className="feat-img"/>
                  <div className="feat-overlay">
                    <button
                      className="feat-add-btn"
                      onClick={e => { e.stopPropagation(); addToCart(dish) }}
                    >
                      + Add to Cart
                    </button>
                  </div>
                  {dish.bestseller && (
                    <span className="bestseller-badge">
                      <Star size={10} fill="currentColor"/> Bestseller
                    </span>
                  )}
                  {dish.discount > 0 && (
                    <span className="offer-badge">
                      <Tag size={10}/> ₹{dish.discount} OFF
                    </span>
                  )}
                  <span className={`type-tag ${dish.tag === 'Veg' ? 'tag-veg' : 'tag-nonveg'}`}>
                    {dish.tag === 'Veg' ? <Leaf size={11}/> : <Flame size={11}/>} {dish.tag}
                  </span>
                  <button
                    className={`card-heart-btn ${isWishlisted(dish.id) ? 'wishlisted' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleWishlist(dish) }}
                    title={isWishlisted(dish.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart size={15} fill={isWishlisted(dish.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="feat-body">
                  <h3>{dish.name}</h3>
                  <p>{dish.desc}</p>
                  <div className="feat-footer">
                    {dish.discount > 0 ? (
                      <span className="feat-price-wrap">
                        <span className="feat-price-old">₹{dish.price}</span>
                        <span className="feat-price">₹{dish.price - dish.discount}</span>
                      </span>
                    ) : (
                      <span className="feat-price">₹{dish.price}</span>
                    )}
                    <div className="spice-pips">
                      {[1,2,3,4].map(n => <div key={n} className={`spice-pip${n <= dish.spice ? ' hot' : ''}`}/>)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/menu" className="btn-primary">View Full Menu <ArrowRight size={15}/></Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ STORY ══════════════════ */}
      <section className="story-section" id="our-story">
        <div className="story-section-inner">
        <div className="story-img-stack">
          <div className="story-img-main">
            <img src="https://t3.ftcdn.net/jpg/00/27/57/96/360_F_27579652_tM7V4fZBBw8RLmZo0Bi8WhtO2EosTRFD.jpg" alt="Chef cooking"/>
          </div>
          <div className="story-img-float story-img-tr">
            <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=160&fit=crop&q=80" alt="Restaurant ambience"/>
          </div>
          <div className="story-img-float story-img-bl">
            <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=160&fit=crop&q=80" alt="Signature dish"/>
          </div>
        </div>
        <div className="story-content">
          <span className="section-eyebrow"><Award size={13}/> Our Story</span>
          <h2 className="section-title">28 Years of <span>Authentic</span> Flavour</h2>
          <div className="gold-line"/>
          <p>Founded in 1995 by Chef Arjun Mehta, Spice Garden began as a small family kitchen in South Mumbai. Today, we serve over 50,000 guests a year while staying true to the same heirloom recipes and handpicked spices that made us famous.</p>
          <p style={{marginTop:'1rem'}}>Every dish is a letter to tradition — prepared fresh daily, seasoned with care, and served with the warmth only a family restaurant can offer.</p>
          <div className="story-features">
            {['100% Fresh Ingredients','No Artificial Colours','Authentic Family Recipes'].map(f=>(
              <div key={f} className="story-feat"><Star size={14} fill="#C9952A"/>{f}</div>
            ))}
          </div>
          <Link to="/about" className="btn-outline" style={{marginTop:'2rem',display:'inline-flex',alignItems:'center',gap:'8px'}}>Meet Our Team <ArrowRight size={15}/></Link>
        </div>
        </div>
      </section>

      {/* ══════════════════ WHY US ══════════════════ */}
      <section className="section why-section" id="why-us">
        <div className="container">
          <div className="section-header center">
            <span className="section-eyebrow"><Star size={13}/> Why Spice Garden</span>
            <h2 className="section-title">Crafted with <span>Love</span></h2>
            <div className="gold-line center"/>
            <p className="section-sub" style={{color:'rgba(255,255,255,.45)', marginTop:'12px'}}>
              Six reasons guests keep coming back — and telling their friends
            </p>
          </div>
          <div className="why-grid">
            {[
              { img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=340&fit=crop&q=85', title: 'Farm Fresh', desc: 'Vegetables sourced directly from partner farms every single morning — zero cold-storage shortcuts.' },
              { img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=340&fit=crop&q=85', title: 'Live Tandoor', desc: 'Our clay oven burns 24/7 for authentic smoky char on every bread and kebab we serve.' },
              { img: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&h=340&fit=crop&q=85', title: 'Award Winning', desc: 'Best Indian Restaurant — Condé Nast Traveller, three consecutive years running.' },
              { img: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&h=340&fit=crop&q=85', title: '30-Min Delivery', desc: 'Hot meals at your doorstep within 30 minutes, guaranteed — or your next order is on us.' },
              { img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=340&fit=crop&q=85', title: 'Custom Spice', desc: 'Choose your heat level — mild, medium, or fire-breathing. We tune every dish to your palate.' },
              { img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=340&fit=crop&q=85', title: '4.9 Stars', desc: 'Consistently rated across Zomato, Google & TripAdvisor. We never compromise on quality.' },
            ].map((card, i) => (
              <div key={i} className="why-card">
                <div className="why-card-shine"/>
                <div className="why-icon-block">
                  <img src={card.img} alt={card.title}/>
                  <div className="why-icon-overlay"/>
                  <span className="why-card-num">0{i+1}</span>
                </div>
                <div className="why-card-body">
                  <h3 className="why-card-title">
                    <span className="why-title-dot"/>
                    {card.title}
                  </h3>
                  <p className="why-card-desc">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CHEFS ══════════════════ */}
      <section className="section chefs-section" id="chefs">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow"><Star size={13}/> Meet the Team</span>
            <h2 className="section-title">Our <span>Chefs</span></h2>
            <div className="gold-line"/>
            <p className="section-sub chefs-sub">The culinary experience speaks louder than words — crafted by masters who live to create.</p>
          </div>
          <div className="chefs-grid">
            {chefs.map((chef, i) => (
              <div key={chef._id || i} className="chef-card" style={{animationDelay:`${i*0.15}s`}}>
                <div className="chef-arch-wrap">
                  <div className="chef-arch-frame">
                    <img src={chef.img} alt={chef.name} className="chef-img"/>
                    <div className="chef-img-overlay"/>
                  </div>
                  <div className="chef-dot chef-dot-tl"/><div className="chef-dot chef-dot-tr"/>
                  <div className="chef-dot chef-dot-bl"/><div className="chef-dot chef-dot-br"/>
                </div>
                <div className="chef-info">
                  <h3 className="chef-name">{chef.name}</h3>
                  <span className="chef-role">{chef.role}</span>
                  <div className="chef-socials">
                    <a href={chef.facebook || '#'} className="chef-social-btn" aria-label="Facebook">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    </a>
                    <a href={chef.instagram || '#'} className="chef-social-btn" aria-label="Instagram">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                    </a>
                    <a href={chef.twitter || '#'} className="chef-social-btn" aria-label="Twitter">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a href={chef.youtube || '#'} className="chef-social-btn" aria-label="YouTube">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon fill="#000408" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ GALLERY ══════════════════ */}
      <section className="gallery-section" id="gallery">
        <div className="container">
          <div className="section-header center">
            <span className="section-eyebrow"><Flame size={13}/> Our Kitchen &amp; Dining</span>
            <h2 className="section-title">A Feast for the <span>Eyes</span></h2>
            <div className="gold-line center"/>
            <p className="section-sub" style={{color:'rgba(255,255,255,.4)', marginTop:'12px'}}>
              Every frame tells a story of craftsmanship, colour, and passion
            </p>
          </div>
          <div className="gallery-grid">
            {gallery.map((item, i) => (
              <div
                key={item._id || i}
                className="gallery-tile"
                style={{animationDelay:`${i*0.08}s`}}
                onClick={() => openLightbox(item)}
              >
                <div className="gallery-tile-img-wrap">
                  <img src={item.src} alt={item.label} loading="lazy"/>
                  <div className="gallery-tile-shine"/>
                  <div className="gallery-tile-zoom"><ZoomIn size={22}/></div>
                </div>
                <span className="gallery-tile-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ LIGHTBOX ══════════════════ */}
      {lightbox && (
        <div className="lb-backdrop" onClick={closeLightbox}>
          <div className="lb-modal" onClick={e => e.stopPropagation()}>

            <div className="lb-header">
              <span className="lb-title">{lightbox.item.label}</span>
              <button className="lb-close" onClick={closeLightbox}><X size={20}/></button>
            </div>

            <div className="lb-main-wrap">
              <button className="lb-arrow lb-arrow-left" onClick={lightboxPrev}><ChevronLeft size={24}/></button>
              <div className="lb-main-img-frame">
                <img
                  key={lightbox.activeIdx}
                  src={lightbox.item.related[lightbox.activeIdx]}
                  alt={`${lightbox.item.label} ${lightbox.activeIdx + 1}`}
                  className="lb-main-img"
                />
              </div>
              <button className="lb-arrow lb-arrow-right" onClick={lightboxNext}><ChevronRight size={24}/></button>
            </div>

            <div className="lb-counter">
              {lightbox.activeIdx + 1} / {lightbox.item.related.length}
            </div>

            <div className="lb-thumbs">
              {lightbox.item.related.map((src, i) => (
                <button
                  key={i}
                  className={`lb-thumb ${lightbox.activeIdx === i ? 'active' : ''}`}
                  onClick={() => setLightbox(lb => ({ ...lb, activeIdx: i }))}
                >
                  <img src={src} alt={`thumb-${i}`}/>
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="testimonials-section" id="testimonials">
        <div className="container">
          <div className="testi-header">
            <span className="section-eyebrow"><Star size={13}/> Testimonials</span>
            <h2 className="section-title testi-title">Words from our <span>Guests</span></h2>
          </div>
        </div>

        {marqueeItems.length > 0 && (
          <div className="testi-marquee-wrap">
            <div className="testi-marquee-track">
              {marqueeItems.map((t, i) => (
                <div key={i} className="testi-card">
                  <div className="testi-avatar-wrap">
                    <img src={t.img} alt={t.name} className="testi-avatar"/>
                  </div>
                  <p className="testi-quote">&ldquo;{t.text}&rdquo;</p>
                  <div className="testi-bottom">
                    <strong className="testi-name">{t.name}</strong>
                    <span className="testi-role">{t.role}</span>
                    <div className="testi-stars">{Array(t.stars).fill(0).map((_,j)=><Star key={j} size={12} fill="#C9952A" stroke="none"/>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section className="cta-banner" id="order">
        <div className="cta-content">
          <h2>Ready to Order?</h2>
          <p>Fresh, hot, and delivered in 30 minutes — or your next order is free.</p>
          <div className="cta-actions">
            <Link to="/menu" className="btn-primary">Order Now <ArrowRight size={15}/></Link>
            <Link to="/contact" className="btn-outline" style={{borderColor:'rgba(255,255,255,0.4)',color:'#fff'}}>Book a Table</Link>
          </div>
        </div>
      </section>

    </div>
  )
}
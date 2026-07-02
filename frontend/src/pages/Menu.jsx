import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Flame, Leaf, ShoppingCart, Star, SlidersHorizontal, X, ChevronLeft, ChevronRight, Heart, Loader2, UtensilsCrossed, Tag, BadgePercent } from 'lucide-react'
import { fetchDishes, fetchActiveOffer, categories } from '../data/dishes.js'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import './Menu.css'

const spiceLevels = ['All', 1, 2, 3, 4]
const sortOptions = [
  { value: 'default',     label: 'Recommended' },
  { value: 'price-asc',   label: 'Price: Low to High' },
  { value: 'price-desc',  label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Rating: High to Low' },
]

const ITEMS_PER_PAGE = 12

export default function Menu() {
  const navigate              = useNavigate()
  const [searchParams]        = useSearchParams()
  const wantsOfferOnly        = searchParams.get('offer') === '1'
  const [cat, setCat]         = useState('All')
  const [q, setQ]             = useState('')
  const [type, setType]       = useState('All')
  const [spice, setSpice]     = useState('All')
  const [maxPrice, setMaxPrice] = useState(500)
  const [sort, setSort]       = useState('default')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage]       = useState(1)
  const { addToCart }         = useCart()
  const { toggleWishlist, isWishlisted } = useWishlist()

  const [dishes, setDishes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // "Grab the Deal" se aane par ?offer=1 milta hai — tab sirf usi
  // active offer ki dishes dikhani hain. offerIds === null matlab
  // offer mode off hai (normal full menu).
  const [offerIds, setOfferIds]     = useState(null)
  const [offerInfo, setOfferInfo]   = useState(null)
  const [offerChecked, setOfferChecked] = useState(false)

  useEffect(() => {
    fetchDishes()
      .then(setDishes)
      .catch(() => setLoadError('Could not load the menu. Please try again later.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!wantsOfferOnly) { setOfferIds(null); setOfferInfo(null); setOfferChecked(true); return }
    fetchActiveOffer()
      .then(offer => {
        if (offer && Array.isArray(offer.items) && offer.items.length > 0) {
          const ids = new Set(offer.items.filter(it => it.dish).map(it => it.dish._id))
          setOfferIds(ids)
          setOfferInfo(offer)
        } else {
          setOfferIds(new Set()) // offer khatam ho chuka — koi match nahi
          setOfferInfo(null)
        }
      })
      .catch(() => { setOfferIds(new Set()); setOfferInfo(null) })
      .finally(() => setOfferChecked(true))
  }, [wantsOfferOnly])

  function clearOfferFilter() {
    navigate('/menu')
  }

  const filtered = useMemo(() => {
    let list = dishes.filter(d =>
      (cat === 'All' || d.cat === cat) &&
      (type === 'All' || d.tag === type) &&
      (spice === 'All' || d.spice === spice) &&
      (Number(d.price) <= maxPrice) &&
      (d.name.toLowerCase().includes(q.toLowerCase()) || d.desc.toLowerCase().includes(q.toLowerCase())) &&
      (!offerIds || offerIds.has(d.id))
    )
    if (sort === 'price-asc')   list = [...list].sort((a,b) => Number(a.price) - Number(b.price))
    if (sort === 'price-desc')  list = [...list].sort((a,b) => Number(b.price) - Number(a.price))
    if (sort === 'rating-desc') list = [...list].sort((a,b) => Number(b.rating||0) - Number(a.rating||0))
    return list
  }, [dishes, cat, q, type, spice, maxPrice, sort, offerIds])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const safeSetFilter = (setter) => (val) => { setter(val); setPage(1) }

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, page])

  function resetFilters() {
    setQ(''); setCat('All'); setType('All'); setSpice('All'); setMaxPrice(500); setSort('default'); setPage(1)
  }

  function goToPage(p) {
    setPage(p)
    document.querySelector('.menu-main')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const activeFilterCount = [cat!=='All', type!=='All', spice!=='All', maxPrice<500, sort!=='default'].filter(Boolean).length

  function getPageNumbers() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = []
    if (page <= 4) {
      pages.push(1,2,3,4,5,'…',totalPages)
    } else if (page >= totalPages - 3) {
      pages.push(1,'…',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages)
    } else {
      pages.push(1,'…',page-1,page,page+1,'…',totalPages)
    }
    return pages
  }

  return (
    <div className="page-wrapper menu-page">
      {/* Banner */}
      <div className="menu-banner">
        <div className="menu-banner-overlay"/>
        <div className="menu-banner-text">
          <h1>Explore <span>Our Menu</span></h1>
          <p>Over 120 dishes inspired by regional Indian cuisines</p>
        </div>
      </div>

      <div className="container">
        <div className="menu-layout">

          {/* Sidebar */}
          <aside className={`menu-sidebar ${showFilters ? 'open' : ''}`}>
            <div className="sidebar-box">
              <h4>Categories</h4>
              {categories.map(c => (
                <button key={c} className={`sidebar-btn ${cat===c?'active':''}`} onClick={()=>{ safeSetFilter(setCat)(c) }}>{c}</button>
              ))}
            </div>

            <div className="sidebar-box">
              <h4>Dietary</h4>
              {['All','Veg','Non-Veg'].map(t => (
                <button key={t} className={`sidebar-btn ${type===t?'active':''}`} onClick={()=>safeSetFilter(setType)(t)}>
                  {t==='Veg' && <Leaf size={13}/>}
                  {t==='Non-Veg' && <Flame size={13}/>}
                  {t}
                </button>
              ))}
            </div>

            <div className="sidebar-box">
              <h4>Spice Level</h4>
              <div className="spice-filter-row">
                {spiceLevels.map(s => (
                  <button
                    key={s}
                    className={`spice-filter-btn ${spice===s?'active':''}`}
                    onClick={()=>safeSetFilter(setSpice)(s)}
                    title={s==='All' ? 'All' : `${s} pip${s>1?'s':''}`}
                  >
                    {s === 'All' ? 'All' : Array.from({length:s}).map((_,i)=><Flame key={i} size={11}/>)}
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-box">
              <h4>Max Price: ₹{maxPrice}</h4>
              <input
                type="range" min="100" max="500" step="10"
                value={maxPrice}
                onChange={e=>{ safeSetFilter(setMaxPrice)(Number(e.target.value)) }}
                className="price-range-slider"
              />
              <div className="price-range-labels">
                <span>₹100</span>
                <span>₹500</span>
              </div>
            </div>

            <div className="sidebar-box">
              <h4>Sort By</h4>
              {sortOptions.map(opt => (
                <button key={opt.value} className={`sidebar-btn ${sort===opt.value?'active':''}`} onClick={()=>safeSetFilter(setSort)(opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>

            {activeFilterCount > 0 && (
              <button className="reset-filters-btn" onClick={resetFilters}>
                <X size={14}/> Clear All Filters
              </button>
            )}
          </aside>

          {/* Main */}
          <main className="menu-main">
            {/* Search */}
            <div className="menu-search-bar">
              <Search size={17} className="search-icon"/>
              <input value={q} onChange={e=>{ safeSetFilter(setQ)(e.target.value) }} placeholder="Search dishes, ingredients…"/>
              {q && <button className="clear-btn" onClick={()=>{ safeSetFilter(setQ)('') }}><X size={15}/></button>}
              <button className="mobile-filter-toggle" onClick={()=>setShowFilters(s=>!s)}>
                <SlidersHorizontal size={16}/>
                {activeFilterCount > 0 && <span className="filter-count-dot">{activeFilterCount}</span>}
              </button>
            </div>
            {wantsOfferOnly && offerChecked && (
              offerInfo ? (
                <div className="offer-filter-banner">
                  <span><BadgePercent size={15} /> Showing dishes from "{offerInfo.title || 'Flash Offer'}" only</span>
                  <button onClick={clearOfferFilter}><X size={13} /> View full menu</button>
                </div>
              ) : (
                <div className="offer-filter-banner expired">
                  <span><BadgePercent size={15} /> This offer isn't live anymore.</span>
                  <button onClick={clearOfferFilter}><X size={13} /> View full menu</button>
                </div>
              )
            )}

            <div className="menu-meta">
              <span className="meta-count">
                {filtered.length} dishes found
                {totalPages > 1 && <> &nbsp;·&nbsp; Page {page} of {totalPages}</>}
              </span>
              <span className="meta-cat">{cat !== 'All' ? cat : 'All Categories'}</span>
            </div>

            {loading || (wantsOfferOnly && !offerChecked) ? (
              <div className="empty-menu">
                <Loader2 size={32} className="spin-icon" />
                <p>Loading menu…</p>
              </div>
            ) : loadError ? (
              <div className="empty-menu">
                <UtensilsCrossed size={32} />
                <p>{loadError}</p>
              </div>
            ) : dishes.length === 0 ? (
              <div className="empty-menu">
                <UtensilsCrossed size={32} />
                <p>The menu is empty right now. Please check back soon.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-menu">
                <p>No dishes found for your search.</p>
                <button className="btn-outline" onClick={resetFilters}>Reset Filters</button>
              </div>
            ) : (
              <>
                <div className="menu-grid">
                  {paginated.map((dish,i) => (
                    <div key={dish.id} className="menu-card" style={{animationDelay:`${i*0.05}s`}}>

                      {/* Clickable image area → Detail page */}
                        <div
                        className="menu-img-wrap"
                        onClick={() => navigate(`/dish/${dish.id}`)}
                        style={{ cursor: 'pointer' }}
                        title={`View ${dish.name} details`}
                      >
                        <img src={dish.image} alt={dish.name} className="menu-img"/>
                        <div className="menu-img-overlay">
                          {/* <span className="menu-view-hint">View Details</span> */}
                        </div>
                        {dish.bestseller && (
                          <span className="bestseller-badge"><Star size={10} fill="currentColor"/> Best</span>
                        )}
                        {dish.discount > 0 && (
                          <span className="offer-badge"><Tag size={10}/> ₹{dish.discount} OFF</span>
                        )}
                        <span className={`type-tag ${dish.tag==='Veg'?'tag-veg':'tag-nonveg'}`}>
                          {dish.tag==='Veg'?<Leaf size={11}/>:<Flame size={11}/>} {dish.tag}
                        </span>
                        <button
                          className={`card-heart-btn ${isWishlisted(dish.id) ? 'wishlisted' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleWishlist(dish) }}
                          title={isWishlisted(dish.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                          <Heart size={15} fill={isWishlisted(dish.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <div className="menu-card-body">
                        <div className="menu-card-header">
                          {/* Name click also navigates */}
                          <h3
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/dish/${dish.id}`)}
                          >{dish.name}</h3>
                          {dish.discount > 0 ? (
                            <span className="menu-price-wrap">
                              <span className="menu-price-old">₹{dish.price}</span>
                              <span className="menu-price">₹{dish.price - dish.discount}</span>
                            </span>
                          ) : (
                            <span className="menu-price">₹{dish.price}</span>
                          )}
                        </div>
                        <p className="menu-desc">{dish.desc}</p>
                        <div className="menu-card-footer">
                          <span className="menu-cat-tag">{dish.cat}</span>
                          <div className="spice-pips">
                            {[1,2,3,4].map(n=><div key={n} className={`spice-pip${n<=dish.spice?' hot':''}`}/>)}
                          </div>
                        </div>
                        {/* Add to cart inside card body */}
                        <button className="menu-add-btn-inline" onClick={() => addToCart(dish)}>
                          <ShoppingCart size={14}/> Add to Cart
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button className="page-btn page-nav" onClick={() => goToPage(page - 1)} disabled={page === 1} aria-label="Previous page">
                      <ChevronLeft size={16}/>
                    </button>
                    {getPageNumbers().map((p, idx) =>
                      p === '…' ? (
                        <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
                      ) : (
                        <button
                          key={p}
                          className={`page-btn ${page === p ? 'active' : ''}`}
                          onClick={() => goToPage(p)}
                          aria-label={`Page ${p}`}
                          aria-current={page === p ? 'page' : undefined}
                        >{p}</button>
                      )
                    )}
                    <button className="page-btn page-nav" onClick={() => goToPage(page + 1)} disabled={page === totalPages} aria-label="Next page">
                      <ChevronRight size={16}/>
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
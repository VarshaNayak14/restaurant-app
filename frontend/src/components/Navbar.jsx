import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, ChevronDown, Menu, X, LogOut, Package, UserCircle,
  Utensils, Flame, Leaf, Coffee, ChefHat, Star, Image, Users,
  Grid, Award, Clock, MapPin, Phone, Mail, Heart
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { fetchCategories, fetchChefs, fetchGallery, fetchDishes, API_BASE } from '../data/dishes.js'
import './Navbar.css'
import logo from "/logo.png"

/* ─── Static mega data (Menu section — fallback only) ─── */
const staticMegaData = {
  Menu: {
    header: 'Explore Our Menu',
    viewAll: { to: '/menu', label: 'View Full Menu →' },
    grid: [
      { title: 'Starters',       icon: <Flame size={18} />,    color: '#E63946', items: ['Paneer Tikka','Chicken 65','Hara Bhara Kabab','Veg Spring Rolls'], link: '/menu?cat=Starters' },
      { title: 'Main Course',    icon: <ChefHat size={18} />,  color: '#C9952A', items: ['Butter Chicken','Dal Makhani','Kadai Paneer','Palak Tofu'],        link: '/menu?cat=Main+Course' },
      { title: 'Rice & Biryani', icon: <Utensils size={18} />, color: '#4CAF50', items: ['Biryani Royale','Veg Pulao','Jeera Rice','Dum Biryani'],           link: '/menu?cat=Rice+%26+Biryani' },
      { title: 'Breads',         icon: <Leaf size={18} />,     color: '#FF9800', items: ['Butter Naan','Garlic Roti','Lachha Paratha','Missi Roti'],          link: '/menu?cat=Breads' },
      { title: 'Desserts',       icon: <Star size={18} />,     color: '#9C27B0', items: ['Gulab Jamun','Kulfi Falooda','Rasmalai','Mango Sorbet'],             link: '/menu?cat=Desserts' },
      { title: 'Drinks',         icon: <Coffee size={18} />,   color: '#00BCD4', items: ['Mango Lassi','Rose Sharbat','Masala Chai','Fresh Lime Soda'],       link: '/menu?cat=Drinks' },
    ],
    footer: ['Bestsellers', 'Veg Options', 'Quick Delivery', 'Top Rated'],
  },
}

/* ─── Helper: group dishes by category and build Menu mega data ─── */
function buildMenuMegaFromDishes(dishes) {
  const COLORS = ['#E63946','#C9952A','#4CAF50','#FF9800','#9C27B0','#00BCD4']
  const grouped = {}
  dishes.forEach(d => {
    const cat = d.category || d.cat || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(d)
  })
  const entries = Object.entries(grouped).slice(0, 6)
  return {
    header: 'Explore Our Menu',
    viewAll: { to: '/menu', label: 'View Full Menu →' },
    grid: entries.map(([cat, items], i) => ({
      title: cat,
      img: items[0]?.image || items[0]?.img || null,
      color: COLORS[i % COLORS.length],
      items: items.slice(0, 4).map(d => d.name),
      link: '/menu?cat=' + encodeURIComponent(cat),
    })),
    footer: ['Bestsellers', 'Veg Options', 'Quick Delivery', 'Top Rated'],
  }
}

const navLinks = [
  { to: '/',             label: 'Home' },
  { to: '/about',        label: 'About' },
  { to: '/menu',         label: 'Menu',         megaKey: 'Menu' },
  { to: '/#categories',  label: 'Categories',   megaKey: 'Categories' },
  { to: '/#chefs',       label: 'Chefs',         megaKey: 'Chefs' },
  { to: '/#gallery',     label: 'Gallery',       megaKey: 'Gallery' },
  { to: '/#testimonials',label: 'Testimonials' },
  { to: '/contact',      label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [activeKey, setActiveKey] = useState(null)
  const [mobOpen, setMobOpen]     = useState({})
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout }          = useAuth()
  const { count }                 = useCart()
  const { count: wishCount }      = useWishlist()
  const location                  = useLocation()
  const navigate                  = useNavigate()
  const leaveTimer                = useRef(null)
  const userMenuRef                = useRef(null)

  // Dynamic mega data from API
  const [megaData, setMegaData] = useState({ ...staticMegaData })

  useEffect(() => {
    // Fetch Categories for mega menu
    fetchCategories().then(cats => {
      setMegaData(prev => ({
        ...prev,
        Categories: {
          header: 'Browse by Category',
          viewAll: { to: '/#categories', label: 'See All Categories →' },
          grid: cats.slice(0, 6).map((cat, i) => ({
            title: cat.name,
            img: cat.img,
            color: ['#4CAF50','#E63946','#C9952A','#00BCD4','#9C27B0','#FF9800'][i % 6],
            link: cat.link || '/menu',
          })),
          footer: ['Fresh & Healthy', 'Rich & Flavorful', 'Party Packs', 'Family Meals'],
        }
      }))
    }).catch(() => {
      setMegaData(prev => ({
        ...prev,
        Categories: {
          header: 'Browse by Category',
          viewAll: { to: '/#categories', label: 'See All Categories →' },
          grid: [
            { title: 'Veg Specials',     img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=80&h=80&fit=crop', color: '#4CAF50', link: '/menu?tag=Veg' },
            { title: 'Non-Veg Delights', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=80&h=80&fit=crop', color: '#E63946', link: '/menu?tag=Non-Veg' },
            { title: 'Bestsellers',      img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=80&h=80&fit=crop', color: '#C9952A', link: '/menu?sort=rating-desc' },
            { title: 'Biryani',          img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=80&h=80&fit=crop', color: '#00BCD4', link: '/menu?cat=Rice+%26+Biryani' },
            { title: 'Desserts',         img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=80&h=80&fit=crop', color: '#9C27B0', link: '/menu?cat=Desserts' },
            { title: 'Drinks',           img: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=80&h=80&fit=crop', color: '#FF9800', link: '/menu?cat=Drinks' },
          ],
          footer: ['Fresh & Healthy', 'Rich & Flavorful', 'Party Packs', 'Family Meals'],
        }
      }))
    })

    // Fetch Chefs for mega menu
    fetchChefs().then(chefs => {
      setMegaData(prev => ({
        ...prev,
        Chefs: {
          header: 'Meet Our Master Chefs',
          viewAll: { to: '/#chefs', label: 'Meet All Chefs →' },
          grid: chefs.slice(0, 6).map((chef, i) => ({
            title: chef.name,
            img: chef.img,
            role: chef.role,
            color: ['#C9952A','#E63946','#4CAF50','#9C27B0','#00BCD4','#FF9800'][i % 6],
            link: '/#chefs',
          })),
          footer: ['50+ Years Combined Exp', 'Award-Winning Team', 'International Training', 'Cooking with Passion'],
        }
      }))
    }).catch(() => {
      setMegaData(prev => ({
        ...prev,
        Chefs: {
          header: 'Meet Our Master Chefs',
          viewAll: { to: '/#chefs', label: 'Meet All Chefs →' },
          grid: [
            { title: 'Chef Arjun Mehta',  img: 'https://images.unsplash.com/photo-1583394293214-0b3a27af5ac1?w=80&h=80&fit=crop', role:'Head Chef', color: '#C9952A', link: '/#chefs' },
            { title: 'Chef Priya Sharma', img: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=80&h=80&fit=crop', role:'Executive Chef', color: '#E63946', link: '/#chefs' },
            { title: 'Chef Rohan Kapoor', img: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=80&h=80&fit=crop', role:'Tandoor Specialist', color: '#4CAF50', link: '/#chefs' },
          ],
          footer: ['50+ Years Combined Exp', 'Award-Winning Team', 'International Training', 'Cooking with Passion'],
        }
      }))
    })

    // Fetch Gallery for mega menu
    fetchGallery().then(items => {
      setMegaData(prev => ({
        ...prev,
        Gallery: {
          header: 'Our Visual Story',
          viewAll: { to: '/#gallery', label: 'View Full Gallery →' },
          grid: items.slice(0, 6).map((item, i) => ({
            title: item.label,
            img: item.src,
            color: ['#E63946','#C9952A','#4CAF50','#9C27B0','#00BCD4','#FF9800'][i % 6],
            link: '/#gallery',
          })),
          footer: ['360° View', 'Food Reels', 'Award Decor', 'Press Coverage'],
        }
      }))
    }).catch(() => {
      setMegaData(prev => ({
        ...prev,
        Gallery: {
          header: 'Our Visual Story',
          viewAll: { to: '/#gallery', label: 'View Full Gallery →' },
          grid: [
            { title: 'Biryani Royale',  img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=80&h=80&fit=crop', color: '#E63946', link: '/#gallery' },
            { title: 'Paneer Tikka',    img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=80&h=80&fit=crop', color: '#C9952A', link: '/#gallery' },
            { title: 'Butter Chicken',  img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=80&h=80&fit=crop', color: '#4CAF50', link: '/#gallery' },
            { title: 'Gulab Jamun',     img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=80&h=80&fit=crop', color: '#9C27B0', link: '/#gallery' },
            { title: 'Veg Biryani',     img: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=80&h=80&fit=crop', color: '#00BCD4', link: '/#gallery' },
            { title: 'Live Tandoor',    img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=80&h=80&fit=crop', color: '#FF9800', link: '/#gallery' },
          ],
          footer: ['360° View', 'Food Reels', 'Award Decor', 'Press Coverage'],
        }
      }))
    })

    // Fetch Dishes for Menu mega menu (dynamic images)
    fetchDishes().then(dishes => {
      setMegaData(prev => ({
        ...prev,
        Menu: buildMenuMegaFromDishes(dishes),
      }))
    }).catch(() => {
      // fallback already set from staticMegaData
    })
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMenuOpen(false); setActiveKey(null); setMobOpen({}); setUserMenuOpen(false) }, [location.pathname])

  // Close the user dropdown when clicking anywhere outside it
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => { if (!e.target.closest('.navbar')) setMenuOpen(false) }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuOpen])

  function handleLogout() { logout(); navigate('/') }
  function closeMobile() { setMenuOpen(false); setMobOpen({}) }

  const current   = location.pathname + location.hash
  const isActive  = (to) => to.includes('#') ? current === to : (location.pathname === to && !location.hash)

  function onEnter(key) {
    clearTimeout(leaveTimer.current)
    setActiveKey(key)
  }
  function onLeave() {
    leaveTimer.current = setTimeout(() => setActiveKey(null), 120)
  }

  function toggleMob(key) {
    setMobOpen(prev => ({ ...prev, [key]: !prev[key] }))
  }

  /* ─── Render mega card — supports both icon-only and img+icon cards ─── */
  function renderMegaCard(card, key) {
    const hasImg = !!card.img
    return (
      <Link to={card.link} key={key} className={`mega-card ${hasImg ? 'mega-card-img' : ''}`}>
        <div className="mega-card-icon" style={{ color: card.color, background: `${card.color}18` }}>
          {hasImg
            ? <img src={card.img} alt={card.title} className="mega-card-thumb" />
            : card.icon}
        </div>
        <div className="mega-card-content">
          <h4 className="mega-card-title">{card.title}</h4>
          {card.items && (
            <ul className="mega-card-items">
              {card.items.map(item => <li key={item}>{item}</li>)}
            </ul>
          )}
          {card.role && <p className="mega-card-role">{card.role}</p>}
        </div>
      </Link>
    )
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">

        {/* Logo */}
        <Link to="/" className="nav-logo">
          <img src={logo} alt="HungryHub Logo" className="logo-img" />
          <span className="logo-name">Hungry<span>Hub</span></span>
        </Link>

        {/* Desktop links */}
        <ul className="nav-links">
          {navLinks.map(l => {
            const data = l.megaKey ? megaData[l.megaKey] : null
            const isOpen = activeKey === l.megaKey
            return (
              <li
                key={l.to}
                className={data ? 'mega-parent' : ''}
                onMouseEnter={() => data && onEnter(l.megaKey)}
                onMouseLeave={() => data && onLeave()}
              >
                <Link
                  to={l.to}
                  className={`nav-link ${isActive(l.to) ? 'active' : ''} ${data ? 'mega-trigger' : ''}`}
                >
                  {l.label}
                  {data && <ChevronDown size={13} className={`mega-chevron ${isOpen ? 'open' : ''}`} />}
                </Link>

                {data && (
                  <div
                    className={`mega-menu ${isOpen ? 'mega-visible' : ''}`}
                    onMouseEnter={() => onEnter(l.megaKey)}
                    onMouseLeave={() => onLeave()}
                  >
                    <div className="mega-inner">
                      <div className="mega-header">
                        <span>{data.header}</span>
                        <Link to={data.viewAll.to} className="mega-view-all">{data.viewAll.label}</Link>
                      </div>
                      <div className="mega-grid">
                        {data.grid.map((card, ci) => renderMegaCard(card, card.title + ci))}
                      </div>
                      <div className="mega-footer">
                        {data.footer.map(f => <span key={f}>{f}</span>)}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {/* Desktop actions */}
        <div className="nav-actions">
          <Link to="/wishlist" className="cart-icon-btn wishlist-icon-btn" aria-label="Wishlist">
            <Heart size={20} />
            {wishCount > 0 && <span className="cart-dot">{wishCount}</span>}
          </Link>
          <Link to="/cart" className="cart-icon-btn" aria-label="Cart">
            <ShoppingCart size={20} />
            {count > 0 && <span className="cart-dot">{count}</span>}
          </Link>

          {user ? (
            <div className="user-dropdown-wrap" ref={userMenuRef}>
              <button
                type="button"
                className="user-pill"
                onClick={() => setUserMenuOpen(o => !o)}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                <div className="user-av">{user.name[0].toUpperCase()}</div>
                <span>{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} className={`chevron ${userMenuOpen ? 'open' : ''}`} />
              </button>
              <div className={`dropdown-menu ${userMenuOpen ? 'dropdown-open' : ''}`}>
                <Link to="/profile" className="drop-item" onClick={() => setUserMenuOpen(false)}><UserCircle size={15} /> My Profile</Link>
                <Link to="/profile" className="drop-item" onClick={() => setUserMenuOpen(false)}><Package size={15} /> My Orders</Link>
                <button onClick={() => { setUserMenuOpen(false); handleLogout() }} className="drop-item drop-logout"><LogOut size={15} /> Logout</button>
              </div>
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/register" className="btn-signup">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" aria-expanded={menuOpen}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        {navLinks.map(l => {
          const data = l.megaKey ? megaData[l.megaKey] : null
          const isExpanded = mobOpen[l.megaKey]
          return data ? (
            <div key={l.to} className="mob-mega-section">
              <button
                className={`mob-link mob-mega-toggle ${isExpanded ? 'active' : ''}`}
                onClick={() => toggleMob(l.megaKey)}
              >
                {l.label}
                <ChevronDown size={14} className={`mega-chevron ${isExpanded ? 'open' : ''}`} />
              </button>
              {isExpanded && (
                <div className="mob-mega-items">
                  {data.grid.map((card, ci) => (
                    <Link key={card.title + ci} to={card.link} className="mob-mega-item" onClick={closeMobile}>
                      {card.img
                        ? <img src={card.img} alt={card.title} className="mob-mega-thumb" />
                        : <span style={{ color: card.color }}>{card.icon}</span>
                      }
                      {card.title}
                    </Link>
                  ))}
                  <Link to={data.viewAll.to} className="mob-view-all" onClick={closeMobile}>{data.viewAll.label}</Link>
                </div>
              )}
            </div>
          ) : (
            <Link key={l.to} to={l.to} className={`mob-link ${isActive(l.to) ? 'active' : ''}`} onClick={closeMobile}>
              {l.label}
            </Link>
          )
        })}

        <Link to="/cart" className="mob-link" onClick={closeMobile}>Cart {count > 0 && `(${count})`}</Link>
        <Link to="/wishlist" className="mob-link" onClick={closeMobile}>❤️ Wishlist {wishCount > 0 && `(${wishCount})`}</Link>

        {user ? (
          <>
            <Link to="/profile" className="mob-link" onClick={closeMobile}>👤 Profile</Link>
            <button onClick={handleLogout} className="mob-link mob-logout">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="mob-link" onClick={closeMobile}>Login</Link>
            <Link to="/register" className="mob-link mob-signup" onClick={closeMobile}>Sign Up Free</Link>
          </>
        )}
      </div>
    </nav>
  )
}
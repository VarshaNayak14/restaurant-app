import React, { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet, Navigate } from 'react-router-dom'
import { LayoutDashboard, Menu, X, LogOut, ChevronRight, ChefHat, Grid, MessageSquare, Calendar, ShoppingBag, Tag, TicketPercent, Truck, Hotel, Car, FileText, ShieldCheck, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '/logo.png'
import './AdminLayout.css'

// perm = permission key the superadmin grants (see backend/middleware/auth.js PERMISSIONS)
const navItems = [
  { to: '/admin',              label: 'Dashboard',        icon: <LayoutDashboard size={18}/>, perm: 'dashboard' },
  { to: '/admin/orders',       label: 'Orders',           icon: <ShoppingBag size={18}/>,     perm: 'orders' },
  { to: '/admin/dishes',       label: 'Manage Dishes',    icon: <ChefHat size={18}/>,         perm: 'dishes' },
  { to: '/admin/offers',       label: 'Flash Offers',     icon: <Tag size={18}/>,             perm: 'offers' },
  { to: '/admin/coupons',      label: 'Coupons',          icon: <TicketPercent size={18}/>,   perm: 'coupons' },
  { to: '/admin/categories',   label: 'Categories',       icon: <Grid size={18}/>,            perm: 'categories' },
  { to: '/admin/chefs',        label: 'Chefs',            icon: <ChefHat size={18}/>,         perm: 'chefs' },
  { to: '/admin/testimonial',  label: 'Testimonials',     icon: <MessageSquare size={18}/>,   perm: 'testimonials' },
  { to: '/admin/contact',      label: 'Contact Setting',  icon: <Calendar size={18}/>,        perm: 'contact' },
  { to: '/admin/reservations', label: 'Reservations',     icon: <Calendar size={18}/>,        perm: 'reservations' },
  { to: '/admin/delivery',     label: 'Delivery Settings',icon: <Truck size={18}/>,           perm: 'delivery' },
  { to: '/admin/hotels',       label: 'Hotels',           icon: <Hotel size={18}/>,           perm: 'hotels' },
  { to: '/admin/cabs',         label: 'Cab Bookings',     icon: <Car size={18}/>,             perm: 'cabs' },
  { to: '/admin/bills',        label: 'Bills',            icon: <FileText size={18}/>,        perm: 'bills' },
  { to: '/admin/admins',       label: 'Admins & Access',  icon: <ShieldCheck size={18}/>,     superadmin: true },
]

/* Can this user open this sidebar item? */
function allowed(user, item) {
  if (user?.role === 'superadmin') return true
  if (item.superadmin) return false
  return (user?.permissions || []).includes(item.perm)
}

/* Page shown when an admin opens a section they were not given */
function NoAccess({ empty }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '80px 20px', textAlign: 'center', color: '#6b7280' }}>
      <Lock size={40} />
      <h2 style={{ margin: 0, color: '#111827' }}>{empty ? 'No sections assigned yet' : 'No access'}</h2>
      <p style={{ margin: 0, maxWidth: 420 }}>
        {empty
          ? 'The Super Admin has not given you access to any section yet. Please ask them to assign permissions.'
          : 'You do not have permission to open this section. Please ask the Super Admin for access.'}
      </p>
    </div>
  )
}

export default function AdminLayout() {
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout }            = useAuth()
  const location                    = useLocation()
  const navigate                    = useNavigate()

  function handleLogout() { logout(); navigate('/login') }
  const isActive = (to) => to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to)

  // Role-based sidebar + page guard
  const visibleItems = navItems.filter(item => allowed(user, item))
  const currentItem  = navItems.find(item => isActive(item.to))
  const pageAllowed  = !currentItem || allowed(user, currentItem)
  // Admin without Dashboard access → send to their first allowed section
  const redirectTo   = location.pathname === '/admin' && !pageAllowed && visibleItems[0]?.to

  return (
    <div className={`admin-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${mobileOpen ? 'mob-open' : ''}`}>
        <div className="sidebar-logo">
          <img src={logo} alt="HungryHub" className="sidebar-logo-img"/>
          {!collapsed && <span className="sidebar-logo-name">Hungry<span>Hub</span></span>}
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-label">{!collapsed && 'MAIN MENU'}</p>
          {visibleItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link ${isActive(item.to) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : ''}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
              {!collapsed && isActive(item.to) && <ChevronRight size={14} className="sidebar-active-arrow"/>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase() || 'A'}</div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.name || 'Admin'}</span>
                <span className="sidebar-user-role">{user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}</span>
              </div>
            )}
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={16}/>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronRight size={16} className={collapsed ? '' : 'rotated'}/>
        </button>
      </aside>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)}/>}

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="topbar-hamburger" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
          <div className="topbar-title">{user?.role === 'superadmin' ? 'Super Admin Panel' : 'Admin Panel'}</div>
          <div className="topbar-right">
            <div className="topbar-avatar">{user?.name?.[0]?.toUpperCase() || 'A'}</div>
          </div>
        </header>
        <main className="admin-content">
          {redirectTo
            ? <Navigate to={redirectTo} replace />
            : pageAllowed ? <Outlet/> : <NoAccess empty={visibleItems.length === 0} />}
        </main>
      </div>
    </div>
  )
}

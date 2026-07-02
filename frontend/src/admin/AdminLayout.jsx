import React, { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { LayoutDashboard, Menu, X, LogOut, ChevronRight, ChefHat, Grid, MessageSquare, Calendar, ShoppingBag, Tag, TicketPercent, Truck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '/logo.png'
import './AdminLayout.css'

const navItems = [
  { to: '/admin',              label: 'Dashboard',       icon: <LayoutDashboard size={18}/> },
  { to: '/admin/orders',       label: 'Orders',          icon: <ShoppingBag size={18}/>     },  // ← NEW
  { to: '/admin/dishes',       label: 'Manage Dishes',   icon: <ChefHat size={18}/>         },
  { to: '/admin/offers',       label: 'Flash Offers',    icon: <Tag size={18}/>             },  // ← NEW
  { to: '/admin/coupons',      label: 'Coupons',         icon: <TicketPercent size={18}/>   },  // ← NEW
  { to: '/admin/categories',   label: 'Categories',      icon: <Grid size={18}/>            },
  { to: '/admin/chefs',        label: 'Chefs',           icon: <ChefHat size={18}/>         },
  { to: '/admin/testimonial',  label: 'Testimonials',    icon: <MessageSquare size={18}/>   },
  { to: '/admin/contact',      label: 'Contact Setting', icon: <Calendar size={18}/>        },
  { to: '/admin/reservations', label: 'Reservations',    icon: <Calendar size={18}/>        },
  { to: '/admin/delivery',     label: 'Delivery Settings',icon: <Truck size={18}/>           },  // ← NEW
]

export default function AdminLayout() {
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout }            = useAuth()
  const location                    = useLocation()
  const navigate                    = useNavigate()

  function handleLogout() { logout(); navigate('/login') }
  const isActive = (to) => to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to)

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
          {navItems.map(item => (
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
                <span className="sidebar-user-role">Administrator</span>
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
          <div className="topbar-title">Admin Panel</div>
          <div className="topbar-right">
            <div className="topbar-avatar">{user?.name?.[0]?.toUpperCase() || 'A'}</div>
          </div>
        </header>
        <main className="admin-content">
          <Outlet/>
        </main>
      </div>
    </div>
  )
}
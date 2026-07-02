import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import CartNotification from './components/CartNotification.jsx'
import SocialFloat from './pages/SocialFloat.jsx'
import Home from './pages/Home.jsx'
import Menu from './pages/Menu.jsx'
import DishDetail from './pages/DishDetail.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import Profile from './pages/Profile.jsx'
import Wishlist from './pages/Wishlist.jsx'
import OrderTracking from './pages/OrderTracking.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import AdminDashboard from './admin/AdminDashboard.jsx'
import AdminDishes from './admin/AdminDishes.jsx'
import AdminOffers from './admin/AdminOffers.jsx'
import AdminCoupons from './admin/AdminCoupons.jsx'
import AdminCategories from './admin/AdminCategories.jsx'
import AdminChefs from './admin/AdminCheefs.jsx'
import AdminTestimonials from './admin/AdminTestimonials.jsx'
import AdminReservations from './admin/AdminReservations.jsx'
import AdminContactSettings from './admin/AdminContactSettings.jsx'
import AdminOrders from './admin/AdminOrder.jsx'
import AdminDeliverySettings from './admin/AdminDeliverySettings.jsx'
import './App.css'

// Admin route guard - loading ke time wait karo, phir check karo
function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  // Jab tak auth check ho raha hai, kuch mat karo (spinner ya blank)
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#c9a84c',
        fontSize: '1.2rem',
        gap: '12px'
      }}>
        <span style={{
          width: 28, height: 28, border: '3px solid #c9a84c',
          borderTopColor: 'transparent', borderRadius: '50%',
          display: 'inline-block', animation: 'spin 0.7s linear infinite'
        }} />
        Loading...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

// Public layout wrapper
function PublicLayout({ children, showCart = true, showSocial = true }) {
  return (
    <>
      <Navbar />
      {showCart && <CartNotification />}
      {children}
      <Footer />
      {showSocial && <SocialFloat />}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <Routes>
                {/* ── Admin Panel (apna layout, Navbar/Footer nahi) ── */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="dishes" element={<AdminDishes />} />
                  <Route path="offers" element={<AdminOffers />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="chefs" element={<AdminChefs />} />
                  <Route path="testimonial" element={<AdminTestimonials />} />
                  <Route path="reservations" element={<AdminReservations />} />
                  <Route path="contact" element={<AdminContactSettings />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="delivery" element={<AdminDeliverySettings />} />


                </Route>

                {/* ── Public Routes ── */}
                <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
                <Route path="/menu" element={<PublicLayout><Menu /></PublicLayout>} />
                <Route path="/dish/:id" element={<PublicLayout><DishDetail /></PublicLayout>} />
                <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
                <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
                <Route path="/login" element={<PublicLayout showCart={false} showSocial={false}><Login /></PublicLayout>} />
                <Route path="/register" element={<PublicLayout showCart={false} showSocial={false}><Register /></PublicLayout>} />
                <Route path="/reset-password/:token" element={<PublicLayout showCart={false} showSocial={false}><ResetPassword /></PublicLayout>} />
                <Route path="/cart" element={<PublicLayout><Cart /></PublicLayout>} />
                <Route path="/checkout" element={<PublicLayout showSocial={false}><Checkout /></PublicLayout>} />
                <Route path="/order-confirmation" element={<PublicLayout showSocial={false}><OrderConfirmation /></PublicLayout>} />
                <Route path="/profile" element={<PublicLayout><Profile /></PublicLayout>} />
                <Route path="/order-tracking" element={<PublicLayout><OrderTracking /></PublicLayout>} />
                <Route path="/wishlist" element={<PublicLayout><Wishlist /></PublicLayout>} />
              </Routes>
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
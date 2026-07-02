import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import './Wishlist.css'

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const navigate = useNavigate()

  if (wishlist.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-banner">
          <div className="wishlist-banner-overlay" />
          <div className="wishlist-banner-text">
            <h1>My <span>Wishlist</span></h1>
            <p>Dishes you love, saved for later</p>
          </div>
        </div>
        <div className="container">
          <div className="wishlist-empty">
            <div className="wishlist-empty-icon">
              <Heart size={60} strokeWidth={1.5} />
            </div>
            <h2>Your wishlist is empty</h2>
            <p>Browse our menu and save your favourite dishes here</p>
            <Link to="/menu" className="btn-primary">
              Explore Menu <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-banner">
        <div className="wishlist-banner-overlay" />
        <div className="wishlist-banner-text">
          <h1>My <span>Wishlist</span></h1>
          <p>{wishlist.length} saved {wishlist.length === 1 ? 'dish' : 'dishes'}</p>
        </div>
      </div>

      <div className="container">
        <div className="wishlist-grid">
          {wishlist.map((dish, i) => (
            <div key={dish.id} className="wish-card" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="wish-img-wrap" onClick={() => navigate(`/dish/${dish.id}`)} style={{ cursor: 'pointer' }}>
                <img src={dish.image || dish.img} alt={dish.name} className="wish-img" />
                <button
                  className="wish-remove-btn"
                  onClick={e => { e.stopPropagation(); removeFromWishlist(dish.id) }}
                  title="Remove from wishlist"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="wish-body">
                <h3 onClick={() => navigate(`/dish/${dish.id}`)} style={{ cursor: 'pointer' }}>{dish.name}</h3>
                <p className="wish-desc">{dish.desc}</p>
                <div className="wish-footer">
                  <span className="wish-price">₹{dish.price}</span>
                  <button
                    className="wish-add-btn"
                    onClick={() => addToCart(dish)}
                  >
                    <ShoppingCart size={14} /> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
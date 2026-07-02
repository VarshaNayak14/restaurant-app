import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, Youtube } from 'lucide-react'
import './Footer.css'
import logo from "/logo.png"

function FooterParticles() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const colors = [
      'rgba(201,149,42,0.75)',
      'rgba(245,215,142,0.55)',
      'rgba(232,184,75,0.45)',
      'rgba(255,255,255,0.15)',
      'rgba(201,149,42,0.35)',
    ]

    const particles = []

    function createParticle() {
      const el = document.createElement('div')
      el.className = 'particle'
      const size = 2.5 + Math.random() * 5
      const left = Math.random() * 100
      const duration = 3 + Math.random() * 4
      const delay = Math.random() * 4
      const color = colors[Math.floor(Math.random() * colors.length)]

      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        background: ${color};
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        box-shadow: 0 0 ${size * 2}px ${color};
      `
      container.appendChild(el)
      particles.push(el)
    }

    const COUNT = 28
    for (let i = 0; i < COUNT; i++) createParticle()

    return () => {
      particles.forEach(p => p.remove())
    }
  }, [])

  return <div className="footer-particles" ref={containerRef} aria-hidden="true" />
}

export default function Footer() {
  return (
    <footer className="footer">

      <FooterParticles />

      {/* ── Main Footer ── */}
      <div className="footer-inner">

        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo">
            <img src={logo} alt="Hungry Hub Logo" className="footer-logo-img" />
            <span>Hungry<span className="gold">Hub</span></span>
          </div>
          <p className="footer-tagline">
            Bringing the soul of India to your table since 1995.
            Crafted with love, served with pride.
          </p>
          <div className="footer-social">
            {[
              { Icon: Instagram, label: 'Instagram' },
              { Icon: Facebook,  label: 'Facebook' },
              { Icon: Twitter,   label: 'Twitter' },
              { Icon: Youtube,   label: 'YouTube' },
            ].map(({ Icon, label }) => (
              <button key={label} className="social-btn" aria-label={label}>
                <Icon size={16}/>
              </button>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div className="footer-col">
          <h4>Explore</h4>
          {[
            ['/', 'Home'],
            ['/about', 'About Us'],
            ['/menu', 'Our Menu'],
            ['/#categories', 'Categories'],
            ['/#chefs', 'Our Chefs'],
            ['/#gallery', 'Gallery'],
            ['/#testimonials', 'Testimonials'],
            ['/contact', 'Contact Us'],
          ].map(([to, label]) => (
            <Link key={to} to={to} className="footer-link">{label}</Link>
          ))}
        </div>

        {/* Account */}
        <div className="footer-col">
          <h4>Account</h4>
          {[
            ['/login',    'Login'],
            ['/register', 'Register'],
            ['/cart',     'My Cart'],
            ['/profile',  'My Orders'],
            ['/profile',  'My Profile'],
          ].map(([to, label]) => (
            <Link key={label} to={to} className="footer-link">{label}</Link>
          ))}
        </div>

        {/* Contact */}
        <div className="footer-col">
          <h4>Contact</h4>
          <div className="footer-contact-list">
            <div className="contact-row"><MapPin size={14}/><span>42 Spice Lane, Bandra West, Mumbai 400050</span></div>
            <div className="contact-row"><Phone size={14}/><span>+91 98765 43210</span></div>
            <div className="contact-row"><Mail  size={14}/><span>hello@spicegarden.in</span></div>
            <div className="contact-row"><Clock size={14}/><span>Mon–Sun: 11am – 11pm</span></div>
          </div>
        </div>

      </div>

      {/* ── Bottom Bar ── */}
      <div className="footer-bottom">
        <p>© 2024 Spice Garden Restaurant. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#" className="footer-bottom-link">Privacy Policy</a>
          <a href="#" className="footer-bottom-link">Terms of Service</a>
          <a href="#" className="footer-bottom-link">Refund Policy</a>
        </div>
        <p>Develop By Tecai</p>
      </div>

    </footer>
  )
}
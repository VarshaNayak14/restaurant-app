import React, { useState, useEffect } from 'react'
import { Copy, Check, TicketPercent, Loader2 } from 'lucide-react'
import { fetchActiveCoupons } from '../data/coupons.js'
import './AvailableCoupons.css'

function discountLabel(c) {
  if (c.discountType === 'percentage') {
    return `${c.discountValue}% OFF${c.maxDiscount ? ` up to ₹${c.maxDiscount}` : ''}`
  }
  return `₹${c.discountValue} OFF`
}

export default function AvailableCoupons({ title = 'Available Offers', compact = false, footerNote = '', boxed = false }) {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState('')

  useEffect(() => {
    fetchActiveCoupons()
      .then(setCoupons)
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false))
  }, [])

  function handleCopy(code) {
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 1800)
  }

  if (loading || coupons.length === 0) return null

  return (
    <div className={`avail-coupons ${compact ? 'avail-coupons-compact' : ''} ${boxed ? 'avail-coupons-boxed' : ''}`}>
      {title && (
        <div className="avail-coupons-head">
          <TicketPercent size={16} />
          <span>{title}</span>
        </div>
      )}
      <div className="avail-coupons-list">
        {coupons.map(c => (
          <div key={c.code} className="avail-coupon-card">
            <div className="avail-coupon-left">
              <span className="avail-coupon-discount">{discountLabel(c)}</span>
              <span className="avail-coupon-desc">
                {c.description || 'Special discount'}
                {c.minOrderValue > 0 && <> · Min order ₹{c.minOrderValue}</>}
                {c.dishSpecific && <> · select item(s) only</>}
              </span>
            </div>
            <button
              type="button"
              className="avail-coupon-copy"
              onClick={() => handleCopy(c.code)}
              title="Copy coupon code"
            >
              <span className="avail-coupon-code">{c.code}</span>
              {copiedCode === c.code
                ? <><Check size={13} /> Copied</>
                : <><Copy size={13} /> Copy</>}
            </button>
          </div>
        ))}
      </div>
      {footerNote && <p className="avail-coupons-footnote">{footerNote}</p>}
    </div>
  )
}
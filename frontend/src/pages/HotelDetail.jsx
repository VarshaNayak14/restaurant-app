import React, { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  MapPin, Star, ArrowLeft, Loader2, Phone, Mail, BedDouble, Sparkles, ShieldCheck, Navigation,
  ChevronLeft, ChevronRight, X, Car, Images, Wifi, Waves, Coffee, CircleParking, Dumbbell, Wine,
  Snowflake, UtensilsCrossed, Umbrella, Plane, Flame, ConciergeBell, Mountain, Briefcase, Sailboat,
  Music, Sunset, CheckCircle2, LogIn, LogOut, BadgeCheck, Share2,
} from 'lucide-react'
import { API_BASE } from '../data/dishes.js'
import { HotelBookingModal } from './Hotels.jsx'
import './Bookings.css'
import './HotelDetail.css'

/* Icon for an amenity name (falls back to a check mark) */
const AMENITY_ICONS = [
  [/wifi|internet/i, Wifi], [/pool/i, Waves], [/breakfast|coffee|café|cafe/i, Coffee],
  [/spa|massage/i, Sparkles], [/parking/i, CircleParking], [/gym|fitness/i, Dumbbell],
  [/bar|lounge/i, Wine], [/\bac\b|air/i, Snowflake], [/restaurant|dining|kitchen/i, UtensilsCrossed],
  [/beach|waterfront/i, Umbrella], [/airport|transfer/i, Plane], [/heater|fireplace|bonfire/i, Flame],
  [/room service|concierge/i, ConciergeBell], [/view|lake|hill|mountain/i, Mountain],
  [/work|business|conference|meeting/i, Briefcase], [/kayak|boat|cruise/i, Sailboat],
  [/music|cultural|show/i, Music], [/rooftop|sunset/i, Sunset],
]
const amenityIcon = name => (AMENITY_ICONS.find(([rx]) => rx.test(name)) || [null, CheckCircle2])[1]

/* "Calangute Beach — 300 m" → { place, distance } */
function splitNearby(text) {
  const m = String(text).split(/\s+[—–-]\s+/)
  return m.length > 1 ? { place: m.slice(0, -1).join(' — '), distance: m[m.length - 1] } : { place: text, distance: '' }
}

const rupees = n => `₹${Number(n || 0).toLocaleString('en-IN')}`

/* Everything on this page comes from the hotel record (Admin → Hotels) */
export default function HotelDetail() {
  const { id } = useParams()
  const [hotel, setHotel]       = useState(null)
  const [error, setError]       = useState('')
  const [active, setActive]     = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [booking, setBooking]   = useState(false)
  const [copied, setCopied]     = useState(false)
  const [reviews, setReviews]   = useState({ reviews: [], count: 0, avg: 0 })

  useEffect(() => {
    window.scrollTo(0, 0)
    fetch(`${API_BASE}/hotels/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data.isActive !== false) setHotel(d.data); else setError('Hotel not found.') })
      .catch(() => setError('Could not load this hotel. Please try again.'))
    fetch(`${API_BASE}/hotel-reviews/hotel/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setReviews(d.data) })
      .catch(() => {})
  }, [id])

  const photos = hotel ? [hotel.image, ...(hotel.images || [])].filter(Boolean) : []
  const go = useCallback(step => setActive(i => (i + step + photos.length) % photos.length), [photos.length])
  const openPhoto = i => { setActive(i); setLightbox(true) }

  useEffect(() => {
    if (!lightbox) return
    const onKey = e => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [lightbox, go])

  function share() {
    const url = window.location.href
    if (navigator.share) navigator.share({ title: hotel.name, url }).catch(() => {})
    else navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  if (error) return (
    <div className="page-wrapper hd-page hd-state">
      <p>{error}</p>
      <Link to="/hotels" className="btn-primary">Back to Hotels</Link>
    </div>
  )
  if (!hotel) return <div className="page-wrapper hd-page hd-state"><Loader2 size={26} className="bk-spin" /> Loading hotel…</div>

  const location = [hotel.address, hotel.city].filter(Boolean).join(', ')
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name}, ${location}`)}`
  const tiles    = photos.slice(1, 5)

  return (
    <div className="page-wrapper bk-page hd-page">
      <div className="hd-wrap">
        {/* ── Breadcrumb + actions ── */}
        <div className="hd-topbar">
          <Link to="/hotels" className="hd-back"><ArrowLeft size={16} /> All Hotels</Link>
          <button className="hd-share" onClick={share}><Share2 size={15} /> {copied ? 'Link copied!' : 'Share'}</button>
        </div>

        {/* ── Title ── */}
        <header className="hd-head">
          <span className="hd-eyebrow"><BadgeCheck size={14} /> HungryHub Partner Stay · {hotel.city}</span>
          <h1>{hotel.name}</h1>
          <div className="hd-meta">
            <span className="hd-rating"><Star size={13} fill="currentColor" /> {hotel.rating}</span>
            <span className="hd-review-count">{hotel.reviewCount > 0 ? `${hotel.reviewCount} review${hotel.reviewCount > 1 ? 's' : ''}` : 'New'}</span>
            <span className="hd-dot" />
            <span><MapPin size={15} /> {location}</span>
          </div>
        </header>

        {/* ── Photo collage ── */}
        {photos.length > 0 && (
          <div className={`hd-collage ${tiles.length ? '' : 'single'} tiles-${tiles.length}`}>
            <button className="hd-tile hd-tile-main" onClick={() => openPhoto(0)}>
              <img src={photos[0]} alt={hotel.name} />
            </button>
            {tiles.map((p, i) => (
              <button key={i} className="hd-tile" onClick={() => openPhoto(i + 1)}>
                <img src={p} alt={`${hotel.name} photo ${i + 2}`} />
              </button>
            ))}
            {photos.length > 1 && (
              <button className="hd-all-photos" onClick={() => openPhoto(0)}><Images size={15} /> View all {photos.length} photos</button>
            )}
          </div>
        )}

        <div className="hd-layout">
          {/* ── Main content ── */}
          <main className="hd-content">
            {/* Quick facts */}
            <div className="hd-facts">
              <div className="hd-fact"><span className="hd-ico"><LogIn size={18} /></span><div><small>Check-in</small><strong>{hotel.checkInTime || '12:00 PM'}</strong></div></div>
              <div className="hd-fact"><span className="hd-ico"><LogOut size={18} /></span><div><small>Check-out</small><strong>{hotel.checkOutTime || '11:00 AM'}</strong></div></div>
              <div className="hd-fact"><span className="hd-ico"><BedDouble size={18} /></span><div><small>Rooms</small><strong>{hotel.totalRooms} rooms</strong></div></div>
              <div className="hd-fact"><span className="hd-ico"><Star size={18} /></span><div><small>Guest rating</small><strong>{hotel.rating} / 5{hotel.reviewCount > 0 ? ` (${hotel.reviewCount})` : ''}</strong></div></div>
            </div>

            {hotel.description && (
              <section className="hd-section">
                <h2>About this stay</h2>
                <p className="hd-about">{hotel.description}</p>
              </section>
            )}

            {hotel.highlights?.length > 0 && (
              <section className="hd-section">
                <h2>Why guests love it</h2>
                <div className="hd-highlights">
                  {hotel.highlights.map(h => (
                    <div key={h} className="hd-highlight"><span className="hd-ico"><Sparkles size={17} /></span><p>{h}</p></div>
                  ))}
                </div>
              </section>
            )}

            {hotel.amenities?.length > 0 && (
              <section className="hd-section">
                <h2>Amenities</h2>
                <div className="hd-amenities">
                  {hotel.amenities.map(a => {
                    const Icon = amenityIcon(a)
                    return <div key={a} className="hd-amenity"><Icon size={19} /><span>{a}</span></div>
                  })}
                </div>
              </section>
            )}

            {hotel.nearby?.length > 0 && (
              <section className="hd-section">
                <h2>What’s nearby</h2>
                <ul className="hd-nearby">
                  {hotel.nearby.map(n => {
                    const { place, distance } = splitNearby(n)
                    return (
                      <li key={n}>
                        <span className="hd-nearby-place"><MapPin size={16} /> {place}</span>
                        {distance && <span className="hd-pill">{distance}</span>}
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {hotel.policies?.length > 0 && (
              <section className="hd-section">
                <h2>Good to know</h2>
                <ul className="hd-rules">
                  {hotel.policies.map(p => <li key={p}><ShieldCheck size={17} /> {p}</li>)}
                </ul>
              </section>
            )}

            <section className="hd-section" id="reviews">
              <h2>Guest reviews</h2>
              {reviews.count === 0 ? (
                <p className="hd-about">No reviews yet. Guests can review their stay after check-out.</p>
              ) : (
                <>
                  <div className="hd-rev-summary"><span className="hd-rating"><Star size={13} fill="currentColor" /> {reviews.avg}</span> <span>based on {reviews.count} review{reviews.count > 1 ? 's' : ''}</span></div>
                  <ul className="hd-rev-list">
                    {reviews.reviews.map(r => (
                      <li key={r._id} className="hd-rev">
                        <div className="hd-rev-top">
                          <strong>{r.userName}</strong>
                          <span className="hd-rev-stars">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={14} fill={n <= r.rating ? 'currentColor' : 'none'} />)}</span>
                          <small>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                        </div>
                        {r.comment && <p>{r.comment}</p>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="hd-section">
              <h2>Location</h2>
              {hotel.mapEmbed
                ? <iframe className="hd-map" src={hotel.mapEmbed} title={`${hotel.name} map`} loading="lazy" allowFullScreen />
                : (
                  <div className="hd-map-card">
                    <span className="hd-ico hd-ico-lg"><MapPin size={22} /></span>
                    <div>
                      <strong>{hotel.name}</strong>
                      <p>{location}</p>
                    </div>
                  </div>
                )}
              <a href={mapsLink} target="_blank" rel="noreferrer" className="hd-link-btn"><Navigation size={15} /> Get directions on Google Maps</a>
            </section>
          </main>

          {/* ── Booking card ── */}
          <aside className="hd-aside">
            <div className="hd-book">
              <div className="hd-book-top">
                <div>
                  <span className="hd-from">Starting from</span>
                  <div className="hd-price">{rupees(hotel.pricePerNight)} <small>/ night</small></div>
                </div>
                <span className="hd-rating"><Star size={13} fill="currentColor" /> {hotel.rating}</span>
              </div>

              <div className="hd-book-times">
                <div><small>Check-in</small><strong>{hotel.checkInTime || '12:00 PM'}</strong></div>
                <div><small>Check-out</small><strong>{hotel.checkOutTime || '11:00 AM'}</strong></div>
              </div>

              <button className="hd-book-btn" onClick={() => setBooking(true)}>Book Now</button>
              <p className="hd-book-note">You won’t be charged now — pay at the hotel.</p>

              <div className="hd-cab-tip">
                <span className="hd-ico"><Car size={17} /></span>
                <p><strong>Need a ride?</strong> Add a cab for check-in & check-out while booking.</p>
              </div>

              {(hotel.phone || hotel.email) && (
                <div className="hd-contact">
                  <small>Contact the hotel</small>
                  {hotel.phone && <a href={`tel:${hotel.phone}`}><Phone size={15} /> {hotel.phone}</a>}
                  {hotel.email && <a href={`mailto:${hotel.email}`}><Mail size={15} /> {hotel.email}</a>}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="hd-mobile-bar">
        <div><strong>{rupees(hotel.pricePerNight)}</strong><small> / night</small></div>
        <button className="hd-book-btn" onClick={() => setBooking(true)}>Book Now</button>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="hd-lightbox" onClick={() => setLightbox(false)}>
          <button className="hd-lb-close" aria-label="Close"><X size={22} /></button>
          {photos.length > 1 && <button className="hd-lb-nav prev" onClick={e => { e.stopPropagation(); go(-1) }} aria-label="Previous"><ChevronLeft size={28} /></button>}
          <img src={photos[active]} alt="" onClick={e => e.stopPropagation()} />
          {photos.length > 1 && <button className="hd-lb-nav next" onClick={e => { e.stopPropagation(); go(1) }} aria-label="Next"><ChevronRight size={28} /></button>}
          <div className="hd-lb-strip" onClick={e => e.stopPropagation()}>
            {photos.map((p, i) => (
              <button key={i} className={i === active ? 'active' : ''} onClick={() => setActive(i)}><img src={p} alt="" /></button>
            ))}
          </div>
        </div>
      )}

      {booking && <HotelBookingModal hotel={hotel} onClose={() => setBooking(false)} />}
    </div>
  )
}
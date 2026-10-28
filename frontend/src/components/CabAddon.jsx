import React, { useEffect, useState } from 'react'
import { Car, MapPin, Clock, Users, Route } from 'lucide-react'
import { API_BASE } from '../data/dishes.js'
import './CabAddon.css'

/* Fallback rates if /api/cabs/rates is unavailable (same as backend) */
export const DEFAULT_RATES = {
  auto:  { label: 'Auto',  seats: 3, base: 30,  perKm: 12 },
  mini:  { label: 'Mini',  seats: 4, base: 50,  perKm: 14 },
  sedan: { label: 'Sedan', seats: 4, base: 80,  perKm: 18 },
  suv:   { label: 'SUV',   seats: 6, base: 120, perKm: 24 },
}
/* Cab photos (used on the Home page). Falls back to a Car icon if an image fails to load. */
export const CAB_IMAGES = {
  auto:  'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=800&fit=crop',
  mini:  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&fit=crop',
  sedan: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&fit=crop',
  suv:   'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&fit=crop',
}

export const TRIP_TYPES = [
  { key: 'pickup', label: 'Pickup',          sub: 'Home → Venue' },
  { key: 'drop',   label: 'Drop',            sub: 'Venue → Home' },
  { key: 'round',  label: 'Round Trip',      sub: 'Pickup + Drop' },
]

export function useCabRates() {
  const [rates, setRates] = useState(DEFAULT_RATES)
  useEffect(() => {
    fetch(`${API_BASE}/cabs/rates`)
      .then(r => r.json())
      .then(d => { if (d.success) setRates(d.data) })
      .catch(() => {})
  }, [])
  return rates
}

export function calcFare(rates, carType, distanceKm, tripType) {
  const r  = rates[carType] || rates.mini
  const km = Math.max(1, Number(distanceKm) || 5)
  const oneWay = r.base + r.perKm * km
  return Math.round(tripType === 'round' ? oneWay * 2 : oneWay)
}

export const emptyCab = {
  enabled: false, tripType: 'round', carType: 'mini',
  homeAddress: '', pickupTime: '', returnTime: '', passengers: 2, distanceKm: 5,
}

/* Pre-submit check — returns an error string, or '' */
export function validateCab(cab) {
  if (!cab.enabled) return ''
  if (!cab.homeAddress.trim()) return 'Please enter your address for the cab.'
  if (cab.tripType !== 'drop' && !cab.pickupTime) return 'Please enter the cab pickup time.'
  if (cab.tripType !== 'pickup' && !cab.returnTime) return 'Please enter the cab return time.'
  return ''
}

/* CabAddon state → backend payload */
export function buildCabPayload(cab, venueAddress) {
  const home  = cab.homeAddress.trim()
  const toVenue = cab.tripType !== 'drop'
  return {
    tripType:      cab.tripType,
    carType:       cab.carType,
    pickupAddress: toVenue ? home : venueAddress,
    dropAddress:   toVenue ? venueAddress : home,
    pickupTime:    cab.pickupTime,
    returnTime:    cab.returnTime,
    passengers:    cab.passengers,
    distanceKm:    cab.distanceKm,
  }
}

/* Car type cards — also used by the standalone Cab page */
export function CarTypePicker({ rates, value, onChange, distanceKm, tripType }) {
  return (
    <div className="cab-cars">
      {Object.entries(rates).map(([key, r]) => (
        <button
          type="button"
          key={key}
          className={`cab-car ${value === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          <span className="cab-car-emoji"><Car size={26} /></span>
          <span className="cab-car-name">{r.label}</span>
          <span className="cab-car-meta">{r.seats} seats · ₹{r.perKm}/km</span>
          <span className="cab-car-fare">₹{calcFare(rates, key, distanceKm, tripType)}</span>
        </button>
      ))}
    </div>
  )
}

/*
  "Need a cab too?" section inside a booking form.
  Props:
    cab, setCab        — state (emptyCab shape)
    venueName          — "Hungry Hub" / hotel ka naam
    venueAddress       — venue ka address (cab ka destination/source)
    suggestedPickup    — suggested pickup time (datetime-local string)
    suggestedReturn    — suggested return time
*/
export default function CabAddon({ cab, setCab, venueName, venueAddress, suggestedPickup, suggestedReturn }) {
  const rates = useCabRates()
  const set   = (k, v) => setCab(c => ({ ...c, [k]: v }))

  // Auto-suggest cab times from the booking time (unless the user edited them)
  useEffect(() => {
    if (suggestedPickup) setCab(c => (c.pickupTimeTouched ? c : { ...c, pickupTime: suggestedPickup }))
  }, [suggestedPickup, setCab])
  useEffect(() => {
    if (suggestedReturn) setCab(c => (c.returnTimeTouched ? c : { ...c, returnTime: suggestedReturn }))
  }, [suggestedReturn, setCab])

  const fare = calcFare(rates, cab.carType, cab.distanceKm, cab.tripType)

  return (
    <div className={`cab-addon ${cab.enabled ? 'open' : ''}`}>
      <label className="cab-toggle">
        <input type="checkbox" checked={cab.enabled} onChange={e => set('enabled', e.target.checked)} />
        <span className="cab-toggle-icon"><Car size={18} /></span>
        <span>
          <strong>Need a cab too?</strong>
          <small>Get a cab to and from {venueName} — we will send it on time</small>
        </span>
      </label>

      {cab.enabled && (
        <div className="cab-body">
          <div className="cab-trips">
            {TRIP_TYPES.map(t => (
              <button
                type="button"
                key={t.key}
                className={`cab-trip ${cab.tripType === t.key ? 'active' : ''}`}
                onClick={() => set('tripType', t.key)}
              >
                <strong>{t.label}</strong>
                <small>{t.sub}</small>
              </button>
            ))}
          </div>

          <div className="cab-field">
            <label><MapPin size={13} /> Your address (home / office) *</label>
            <input
              value={cab.homeAddress}
              onChange={e => set('homeAddress', e.target.value)}
              placeholder="Flat no, street, area, city"
            />
          </div>

          <div className="cab-route">
            <Route size={14} />
            {cab.tripType === 'drop'
              ? <span>{venueName} → {cab.homeAddress || 'Your address'}</span>
              : <span>{cab.homeAddress || 'Your address'} → {venueName}{cab.tripType === 'round' ? ' → back' : ''}</span>}
          </div>

          <div className="cab-row">
            {cab.tripType !== 'drop' && (
              <div className="cab-field">
                <label><Clock size={13} /> Pickup time *</label>
                <input
                  type="datetime-local"
                  value={cab.pickupTime}
                  onChange={e => setCab(c => ({ ...c, pickupTime: e.target.value, pickupTimeTouched: true }))}
                />
              </div>
            )}
            {cab.tripType !== 'pickup' && (
              <div className="cab-field">
                <label><Clock size={13} /> Return time *</label>
                <input
                  type="datetime-local"
                  value={cab.returnTime}
                  onChange={e => setCab(c => ({ ...c, returnTime: e.target.value, returnTimeTouched: true }))}
                />
              </div>
            )}
          </div>

          <div className="cab-row">
            <div className="cab-field">
              <label><Users size={13} /> Passengers</label>
              <input type="number" min={1} max={8} value={cab.passengers}
                onChange={e => set('passengers', e.target.value)} />
            </div>
            <div className="cab-field">
              <label><Route size={13} /> Approx distance (km)</label>
              <input type="number" min={1} max={200} value={cab.distanceKm}
                onChange={e => set('distanceKm', e.target.value)} />
            </div>
          </div>

          <CarTypePicker
            rates={rates}
            value={cab.carType}
            onChange={v => set('carType', v)}
            distanceKm={cab.distanceKm}
            tripType={cab.tripType}
          />

          <div className="cab-fare">
            <span>Estimated cab fare {cab.tripType === 'round' && '(round trip)'}</span>
            <strong>₹{fare}</strong>
          </div>
          {venueAddress && <p className="cab-note">Venue address: {venueAddress}. Final fare depends on the actual distance.</p>}
        </div>
      )}
    </div>
  )
}

/* datetime helper — derives suggested cab times from the booking time */
export function shiftDateTime(dtLocal, minutes) {
  if (!dtLocal) return ''
  const d = new Date(dtLocal)
  if (isNaN(d)) return ''
  d.setMinutes(d.getMinutes() + minutes)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const CabBooking = require('../models/CabBooking')

/* Rates per car type — base fare + per km */
const CAB_RATES = {
  auto:  { label: 'Auto',  seats: 3, base: 30,  perKm: 12 },
  mini:  { label: 'Mini',  seats: 4, base: 50,  perKm: 14 },
  sedan: { label: 'Sedan', seats: 4, base: 80,  perKm: 18 },
  suv:   { label: 'SUV',   seats: 6, base: 120, perKm: 24 },
}

// Round trip = fare charged twice
function calcFare(carType, distanceKm, tripType) {
  const r  = CAB_RATES[carType] || CAB_RATES.mini
  const km = Math.max(1, Number(distanceKm) || 5)
  const oneWay = r.base + r.perKm * km
  return Math.round(tripType === 'round' ? oneWay * 2 : oneWay)
}

/*
  Builds a cab booking from the request body (fare is calculated on the
  server; the client-sent fare is never trusted).
  link = { linkedType, linkedModel, linkedId, venueName } — {} for standalone
*/
function normalize(body) {
  const tripType = ['pickup', 'drop', 'round'].includes(body.tripType) ? body.tripType : 'pickup'
  const carType  = CAB_RATES[body.carType] ? body.carType : 'mini'

  if (!body.name || !body.email)
    throw new Error('Name and email are required for cab booking.')
  if (!body.pickupAddress || !body.dropAddress)
    throw new Error('Pickup and drop address are required for cab booking.')
  if (tripType !== 'drop' && !body.pickupTime)
    throw new Error('Pickup time is required for the cab.')
  if (tripType !== 'pickup' && !body.returnTime)
    throw new Error('Return time is required for the cab.')

  return {
    name:          body.name,
    email:         body.email,
    phone:         body.phone || '',
    tripType,
    carType,
    pickupAddress: body.pickupAddress,
    dropAddress:   body.dropAddress,
    pickupTime:    tripType === 'drop'   ? '' : body.pickupTime,
    returnTime:    tripType === 'pickup' ? '' : body.returnTime,
    passengers:    Number(body.passengers) || 1,
    distanceKm:    Math.max(1, Number(body.distanceKm) || 5),
    estimatedFare: calcFare(carType, body.distanceKm, tripType),
    message:       body.message || '',
  }
}

// Validates only (does not save) — throws if anything is invalid
function validateCab(body) { normalize(body) }

async function createCab(body, link = {}) {
  return CabBooking.create({
    ...normalize(body),
    linkedType:  link.linkedType || 'none',
    linkedModel: link.linkedModel,
    linkedId:    link.linkedId,
    venueName:   link.venueName || body.venueName || '',
  })
}

module.exports = { CAB_RATES, calcFare, createCab, validateCab }

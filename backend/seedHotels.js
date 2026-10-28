// Run: node seedHotels.js
// Adds 15 sample hotels. A hotel is only inserted if no hotel with the same
// name exists, so running it again (or hotels you added yourself) is safe.
require('dotenv').config()
const mongoose = require('mongoose')
const Hotel    = require('./models/Hotel')

const img = id => `https://images.unsplash.com/photo-${id}?w=1000&fit=crop&q=80`

const hotels = [
  { name: 'The Grand Palace', city: 'Mumbai', address: 'Marine Drive, Churchgate', pricePerNight: 6500, rating: 4.8, totalRooms: 60,
    image: img('1566073771259-6a8506099945'),
    description: 'Sea-facing luxury rooms with a rooftop pool and sunset views over the Queen’s Necklace.',
    amenities: ['WiFi', 'Pool', 'Breakfast', 'Spa', 'Parking'] },
  { name: 'Azure Skyline Suites', city: 'Mumbai', address: 'Worli Sea Face, Worli', pricePerNight: 8200, rating: 4.9, totalRooms: 45,
    image: img('1586611292717-f828b167408c'),
    description: 'Infinity pool overlooking the Arabian Sea, designer suites and a 24-hour concierge.',
    amenities: ['WiFi', 'Infinity Pool', 'Gym', 'Bar', 'Airport Transfer'] },
  { name: 'Comfort Inn Bandra', city: 'Mumbai', address: 'Linking Road, Bandra West', pricePerNight: 2400, rating: 4.2, totalRooms: 30,
    image: img('1551882547-ff40c63fe5fa'),
    description: 'Budget-friendly, spotless rooms just five minutes from Hungry Hub.',
    amenities: ['WiFi', 'AC', 'Breakfast', 'Parking'] },
  { name: 'Royal Heritage Haveli', city: 'Jaipur', address: 'MI Road, near Hawa Mahal', pricePerNight: 4200, rating: 4.7, totalRooms: 28,
    image: img('1542314831-068cd1dbfeeb'),
    description: 'A restored haveli with royal Rajasthani hospitality, folk music evenings and rooftop dining.',
    amenities: ['WiFi', 'Pool', 'Restaurant', 'Cultural Shows'] },
  { name: 'Pink City Courtyard', city: 'Jaipur', address: 'C-Scheme, Ashok Marg', pricePerNight: 3600, rating: 4.5, totalRooms: 36,
    image: img('1535827841776-24afc1e255ac'),
    description: 'Calm palm-lined courtyard pool in the heart of the city, close to markets and forts.',
    amenities: ['WiFi', 'Pool', 'Breakfast', 'Room Service'] },
  { name: 'Hill View Resort', city: 'Shimla', address: 'The Mall Road, Shimla', pricePerNight: 3800, rating: 4.4, totalRooms: 24,
    image: img('1520250497591-112f2f40a3f4'),
    description: 'Cosy rooms with mountain views, fireplaces and hot chocolate by the lounge.',
    amenities: ['WiFi', 'Heater', 'Parking', 'Restaurant'] },
  { name: 'Aravalli Sunset Retreat', city: 'Udaipur', address: 'Ambrai Ghat, Lake Pichola', pricePerNight: 5400, rating: 4.7, totalRooms: 22,
    image: img('1445019980597-93fa8acb246c'),
    description: 'Rooftop loungers facing the Aravalli hills — perfect for slow mornings and golden sunsets.',
    amenities: ['WiFi', 'Rooftop Lounge', 'Breakfast', 'Lake View'] },
  { name: 'Palm Grove Beach Resort', city: 'Goa', address: 'Calangute Beach Road, North Goa', pricePerNight: 5200, rating: 4.6, totalRooms: 50,
    image: img('1549294413-26f195200c16'),
    description: 'Tall palms, sunny balconies and a short walk to the beach shacks of Calangute.',
    amenities: ['WiFi', 'Pool', 'Beach Access', 'Bar', 'Breakfast'] },
  { name: 'Coral Bay Villas', city: 'Goa', address: 'Palolem Beach, South Goa', pricePerNight: 6800, rating: 4.8, totalRooms: 18,
    image: img('1584132967334-10e028bd69f7'),
    description: 'Private villas under the trees with a seaside pool and wooden sun decks.',
    amenities: ['WiFi', 'Pool', 'Beach Access', 'Spa', 'Kayaking'] },
  { name: 'Backwater Bliss', city: 'Kochi', address: 'Fort Kochi, Kerala', pricePerNight: 4800, rating: 4.6, totalRooms: 26,
    image: img('1561501900-3701fa6a0864'),
    description: 'Waterfront terrace with sunset views, Ayurvedic spa and authentic Kerala cuisine.',
    amenities: ['WiFi', 'Spa', 'Waterfront', 'Restaurant', 'Breakfast'] },
  { name: 'The Lotus Residency', city: 'Delhi', address: 'Connaught Place, New Delhi', pricePerNight: 5600, rating: 4.5, totalRooms: 70,
    image: img('1571896349842-33c89424de2d'),
    description: 'Central location with a resort-style pool, business lounge and metro access.',
    amenities: ['WiFi', 'Pool', 'Gym', 'Business Center', 'Parking'] },
  { name: 'Urban Nest Hotel', city: 'Bengaluru', address: 'Indiranagar 100 Feet Road', pricePerNight: 3900, rating: 4.4, totalRooms: 40,
    image: img('1582719478250-c89cae4dc85b'),
    description: 'Modern rooms in Bengaluru’s café and nightlife district, ideal for work trips.',
    amenities: ['WiFi', 'Workspace', 'Gym', 'Breakfast'] },
  { name: 'Blue Lagoon Inn', city: 'Chennai', address: 'East Coast Road, Injambakkam', pricePerNight: 4400, rating: 4.3, totalRooms: 34,
    image: img('1564501049412-61c2a3083791'),
    description: 'Breezy beach-side stay on ECR with a lagoon-style pool and seafood grill.',
    amenities: ['WiFi', 'Pool', 'Beach Access', 'Restaurant'] },
  { name: 'Sapphire Business Hotel', city: 'Indore', address: 'AB Road, Vijay Nagar', pricePerNight: 2900, rating: 4.3, totalRooms: 48,
    image: img('1590490360182-c33d57733427'),
    description: 'Comfortable rooms near malls and offices, with a quick drive to Sarafa and 56 Dukan.',
    amenities: ['WiFi', 'AC', 'Breakfast', 'Parking', 'Conference Room'] },
  { name: 'Lakeview Boutique Stay', city: 'Bhopal', address: 'Shyamla Hills, near Upper Lake', pricePerNight: 3300, rating: 4.4, totalRooms: 20,
    image: img('1611892440504-42a792e24d32'),
    description: 'Boutique rooms with warm interiors, minutes from the Upper Lake promenade.',
    amenities: ['WiFi', 'AC', 'Breakfast', 'Lake View'] },
]

/* ── Detail page content: gallery, highlights, nearby, rules ── */
const ROOM   = ['1618773928121-c32242e63f39', '1591088398332-8a7791972843', '1631049307264-da0ec9d70304',
                '1578683010236-d716f9a3f461', '1582719478250-c89cae4dc85b', '1590490360182-c33d57733427', '1611892440504-42a792e24d32']
const DINING = '1414235077428-338989a2e8c0'
const SPA    = '1544161515-4ab6ce6db874'
const LOUNGE = '1564078516393-cf04bd966897'
const POOL   = ['1540541338287-41700207dee6', '1582719508461-905c673771fd', '1571896349842-33c89424de2d', '1564501049412-61c2a3083791']
const VIEW   = '1596394516093-501ba68a0ba6'

const BASE_POLICIES = [
  'Valid government photo ID required at check-in',
  'Smoking is not allowed inside rooms',
  'Free cancellation up to 24 hours before check-in',
  'Children below 6 years stay free with parents',
]

const DETAILS = {
  'The Grand Palace': {
    gallery: [ROOM[0], POOL[0], DINING, SPA], phone: '+91 22 4000 1001',
    highlights: ['Rooftop pool with Marine Drive view', 'Award-winning coastal restaurant', 'Full-service spa', 'Walking distance to the promenade'],
    nearby: ['Marine Drive — 100 m', 'Gateway of India — 3 km', 'Hungry Hub, Bandra — 12 km', 'Mumbai Airport — 22 km'],
    policies: [...BASE_POLICIES, 'Pets are not allowed'] },
  'Azure Skyline Suites': {
    gallery: [ROOM[1], POOL[1], LOUNGE, DINING], phone: '+91 22 4000 1002',
    highlights: ['Sea-view infinity pool', 'Every suite has a private balcony', '24-hour concierge & butler', 'Sky lounge bar'],
    nearby: ['Worli Sea Face — 50 m', 'Bandra-Worli Sea Link — 2 km', 'Hungry Hub, Bandra — 6 km', 'Mumbai Airport — 14 km'],
    policies: [...BASE_POLICIES, 'Pool open 7 AM – 10 PM'] },
  'Comfort Inn Bandra': {
    gallery: [ROOM[5], ROOM[2], DINING], phone: '+91 22 4000 1003',
    highlights: ['5 minutes from Hungry Hub', 'Free breakfast buffet', 'Great value for money', 'Close to Linking Road shopping'],
    nearby: ['Hungry Hub — 800 m', 'Linking Road — 200 m', 'Bandstand Promenade — 2 km', 'Bandra Station — 1.5 km'],
    policies: BASE_POLICIES },
  'Royal Heritage Haveli': {
    gallery: [ROOM[3], LOUNGE, DINING, POOL[2]], phone: '+91 141 400 2001',
    highlights: ['Restored 19th-century haveli', 'Folk music & puppet show every evening', 'Rooftop dining with fort views', 'Traditional Rajasthani thali'],
    nearby: ['Hawa Mahal — 1 km', 'City Palace — 1.5 km', 'Johari Bazaar — 800 m', 'Jaipur Airport — 13 km'],
    policies: [...BASE_POLICIES, 'Cultural show at 7:30 PM daily'] },
  'Pink City Courtyard': {
    gallery: [ROOM[4], POOL[3], DINING], phone: '+91 141 400 2002',
    highlights: ['Palm-lined courtyard pool', 'Central C-Scheme location', 'Free breakfast', 'Family rooms available'],
    nearby: ['MI Road — 1 km', 'Albert Hall Museum — 2 km', 'World Trade Park — 4 km', 'Jaipur Airport — 11 km'],
    policies: BASE_POLICIES },
  'Hill View Resort': {
    gallery: [VIEW, ROOM[6], LOUNGE, DINING], phone: '+91 177 400 3001',
    highlights: ['Valley-facing rooms', 'Fireplace in every room', 'Heated rooms in winter', 'Bonfire evenings'],
    nearby: ['The Ridge — 500 m', 'Mall Road — 300 m', 'Jakhoo Temple — 2 km', 'Shimla Station — 3 km'],
    policies: [...BASE_POLICIES, 'Bonfire on request (charges apply)'] },
  'Aravalli Sunset Retreat': {
    gallery: [VIEW, ROOM[1], DINING, SPA], phone: '+91 294 400 4001',
    highlights: ['Rooftop loungers with sunset views', 'Lake Pichola boat rides arranged', 'Rajasthani rooftop dinners', 'Couples spa'],
    nearby: ['Lake Pichola — 100 m', 'City Palace — 1 km', 'Jagdish Temple — 800 m', 'Udaipur Airport — 24 km'],
    policies: BASE_POLICIES },
  'Palm Grove Beach Resort': {
    gallery: [POOL[0], ROOM[2], DINING, LOUNGE], phone: '+91 832 400 5001',
    highlights: ['2-minute walk to Calangute Beach', 'Poolside bar', 'Live music on weekends', 'Water sports desk'],
    nearby: ['Calangute Beach — 200 m', 'Baga Beach — 2 km', 'Fort Aguada — 6 km', 'Goa Airport — 42 km'],
    policies: [...BASE_POLICIES, 'Quiet hours after 11 PM'] },
  'Coral Bay Villas': {
    gallery: [POOL[1], ROOM[3], SPA, DINING], phone: '+91 832 400 5002',
    highlights: ['Private villas under the trees', 'Seaside pool & wooden sun decks', 'Free kayaking', 'Beach candle-light dinners'],
    nearby: ['Palolem Beach — 100 m', 'Butterfly Beach — 4 km', 'Cotigao Wildlife Sanctuary — 10 km', 'Goa Airport — 60 km'],
    policies: [...BASE_POLICIES, 'Pets allowed in garden villas'] },
  'Backwater Bliss': {
    gallery: [ROOM[0], SPA, DINING, POOL[3]], phone: '+91 484 400 6001',
    highlights: ['Waterfront sunset terrace', 'Authentic Ayurvedic spa', 'Kerala seafood kitchen', 'Backwater cruises arranged'],
    nearby: ['Chinese Fishing Nets — 500 m', 'Jew Town — 2 km', 'Marine Drive Kochi — 10 km', 'Kochi Airport — 40 km'],
    policies: BASE_POLICIES },
  'The Lotus Residency': {
    gallery: [ROOM[4], POOL[2], LOUNGE, DINING], phone: '+91 11 4000 7001',
    highlights: ['Resort-style pool in the city centre', 'Business lounge & meeting rooms', 'Metro station next door', 'Multi-cuisine restaurant'],
    nearby: ['Connaught Place — 200 m', 'India Gate — 3 km', 'Rajiv Chowk Metro — 300 m', 'Delhi Airport — 16 km'],
    policies: BASE_POLICIES },
  'Urban Nest Hotel': {
    gallery: [ROOM[5], LOUNGE, DINING], phone: '+91 80 4000 8001',
    highlights: ['In Bengaluru’s café district', 'Fast WiFi & work desks', '24-hour gym', 'Rooftop café'],
    nearby: ['100 Feet Road — 100 m', 'MG Road — 5 km', 'Indiranagar Metro — 1 km', 'Bengaluru Airport — 38 km'],
    policies: BASE_POLICIES },
  'Blue Lagoon Inn': {
    gallery: [POOL[3], ROOM[6], DINING], phone: '+91 44 4000 9001',
    highlights: ['Lagoon-style pool', 'Beach access on ECR', 'Seafood grill', 'Cycling on the coast road'],
    nearby: ['Injambakkam Beach — 300 m', 'VGP Golden Beach — 3 km', 'Dakshinachitra — 15 km', 'Chennai Airport — 22 km'],
    policies: BASE_POLICIES },
  'Sapphire Business Hotel': {
    gallery: [ROOM[2], LOUNGE, DINING], phone: '+91 731 400 1001',
    highlights: ['Close to malls & offices', 'Conference room for 40', 'Free breakfast', 'Easy drive to Sarafa & 56 Dukan'],
    nearby: ['C21 Mall — 1 km', '56 Dukan — 3 km', 'Sarafa Bazaar — 8 km', 'Indore Airport — 12 km'],
    policies: BASE_POLICIES },
  'Lakeview Boutique Stay': {
    gallery: [ROOM[1], VIEW, DINING], phone: '+91 755 400 1101',
    highlights: ['Minutes from the Upper Lake', 'Warm boutique interiors', 'Lake-view breakfast terrace', 'Quiet hillside location'],
    nearby: ['Upper Lake — 600 m', 'Van Vihar — 2 km', 'Bharat Bhavan — 1 km', 'Bhopal Airport — 14 km'],
    policies: BASE_POLICIES },
}

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const ops = hotels.map(h => ({
    updateOne: { filter: { name: h.name }, update: { $setOnInsert: { ...h, isActive: true } }, upsert: true },
  }))
  const r = await Hotel.bulkWrite(ops)
  console.log(`[OK] ${r.upsertedCount} hotel(s) added, ${hotels.length - r.upsertedCount} already existed`)

  // Fill detail-page content — only for hotels whose gallery is still empty,
  // so anything edited from the admin panel is never overwritten.
  const detailOps = Object.entries(DETAILS).map(([name, d]) => ({
    updateOne: {
      filter: { name, $or: [{ images: { $exists: false } }, { images: { $size: 0 } }] },
      update: { $set: {
        images: d.gallery.map(img), highlights: d.highlights, nearby: d.nearby, policies: d.policies,
        phone: d.phone, email: `stay@${name.toLowerCase().replace(/[^a-z]+/g, '')}.in`,
        checkInTime: '12:00 PM', checkOutTime: '11:00 AM',
      } },
    },
  }))
  const d = await Hotel.bulkWrite(detailOps)
  console.log(`[OK] Detail content added to ${d.modifiedCount} hotel(s)`)
  console.log(`[OK] Total hotels now: ${await Hotel.countDocuments()}`)
  process.exit(0)
}).catch(err => { console.error(err.message); process.exit(1) })

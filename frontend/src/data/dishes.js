export const API_BASE = 'https://restaurant-app-djxk.onrender.com'

export const categories = ['All', 'Starters', 'Main Course', 'Rice & Biryani', 'Breads', 'Desserts', 'Drinks']

/* ── Generic home data fetcher ── */
async function fetchHomeData(endpoint) {
  const res = await fetch(`${API_BASE}/home/${endpoint}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || `Failed to fetch ${endpoint}`)
  return data.data
}

export const fetchTestimonials = () => fetchHomeData('testimonials')
export const fetchCategories   = () => fetchHomeData('categories')
export const fetchChefs        = () => fetchHomeData('chefs')
export const fetchGallery      = () => fetchHomeData('gallery')

/* Fetch all dishes from backend */
export async function fetchDishes() {
  const res = await fetch(`${API_BASE}/dishes`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch dishes')
  return data.dishes.map(d => ({ ...d, id: d._id }))
}

/* Fetch featured dishes for Home page —
   Bestsellers pehle, agar 4 se kam ho to baaki se fill karo */
export async function fetchFeaturedDishes() {
  const dishes = await fetchDishes()
  const bestsellers = dishes.filter(d => d.bestseller)
  if (bestsellers.length >= 4) return bestsellers.slice(0, 4)
  const others = dishes.filter(d => !d.bestseller)
  return [...bestsellers, ...others].slice(0, 4)
}

/* Admin: add dish */
export async function addDish(dish, token) {
  const res = await fetch(`${API_BASE}/dishes`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(dish),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to add dish')
  return { ...data.dish, id: data.dish._id }
}

/* Admin: delete dish */
export async function deleteDish(id, token) {
  const res = await fetch(`${API_BASE}/dishes/${id}`, {
    method:  'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to delete dish')
  return true
}

/* Admin: update dish */
export async function updateDish(id, dish, token) {
  const res = await fetch(`${API_BASE}/dishes/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(dish),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to update dish')
  return { ...data.dish, id: data.dish._id }
}

/* Public: fetch the currently live offer (if any) */
export async function fetchActiveOffer() {
  const res = await fetch(`${API_BASE}/offers/active`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch active offer')
  return data.data
}

/* Admin: fetch all offers */
export async function fetchOffers(token) {
  const res = await fetch(`${API_BASE}/offers`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch offers')
  return data.data
}

/* Admin: create offer */
export async function createOffer(offer, token) {
  const res = await fetch(`${API_BASE}/offers`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(offer),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to create offer')
  return data.data
}

/* Admin: update offer */
export async function updateOffer(id, offer, token) {
  const res = await fetch(`${API_BASE}/offers/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(offer),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to update offer')
  return data.data
}

/* Admin: delete offer */
export async function deleteOffer(id, token) {
  const res = await fetch(`${API_BASE}/offers/${id}`, {
    method:  'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to delete offer')
  return true
}
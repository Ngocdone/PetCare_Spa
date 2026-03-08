// Cart utilities
const CART_KEY = 'petspa_cart'
const BOOKINGS_KEY = 'petspa_bookings'
const USERS_KEY = 'petspa_users'
const CURRENT_USER_KEY = 'petspa_current_user'

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || []
  } catch (e) {
    return []
  }
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + (item.quantity || 1), 0)
}

export function updateCartBadge() {
  const badges = document.querySelectorAll('.header__cart-badge, .cart-count')
  const count = getCartCount()
  badges.forEach(el => {
    if (el) {
      el.textContent = count
      el.style.display = count > 0 ? '' : 'none'
    }
  })
}

export function addToCart(item) {
  const cart = getCart()
  const existing = cart.find(i => i.id === item.id)
  if (existing) {
    existing.quantity += (item.quantity || 1)
  } else {
    cart.push({ ...item, quantity: item.quantity || 1 })
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  updateCartBadge()
}

export function removeFromCart(itemId) {
  const cart = getCart().filter(i => i.id !== itemId)
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  updateCartBadge()
}

export function clearCart() {
  localStorage.setItem(CART_KEY, JSON.stringify([]))
  updateCartBadge()
}

// User utilities
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

export function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
}

export function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem('petspa_user_profile')) || {}
  } catch (e) {
    return {}
  }
}

export function setUserProfile(profile) {
  localStorage.setItem('petspa_user_profile', JSON.stringify(profile))
}

// Booking utilities
export function getBookings() {
  try {
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || []
  } catch (e) {
    return []
  }
}

export function saveBooking(booking) {
  const bookings = getBookings()
  bookings.push({ ...booking, id: 'b' + Date.now(), createdAt: new Date().toISOString() })
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings))
}

// Export constants
export { CART_KEY, BOOKINGS_KEY, USERS_KEY, CURRENT_USER_KEY }

// Format price
export function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

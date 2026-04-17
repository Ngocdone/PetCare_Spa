/**
 * Giỏ hàng client: JSON trong localStorage, tính tổng số lượng dòng.
 */
export const CART_KEY = 'petspa_cart'
export const CURRENT_USER_KEY = 'petspa_current_user'

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || []
  } catch {
    return []
  }
}

export function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new CustomEvent('petspa-cart-updated'))
}

export function getCartCount() {
  return getCart().reduce((s, item) => s + (item.quantity || 1), 0)
}

/** Hai dòng cùng sản phẩm nhưng khác biến thể (size) là khác nhau */
export function cartLinesMatch(a, b) {
  return (
    String(a.id) === String(b.id) &&
    String(a.variantKey ?? '') === String(b.variantKey ?? '')
  )
}

export function addToCartLine(item, maxStock) {
  const cart = getCart()
  const qty = item.quantity || 1
  const existing = cart.find((x) => cartLinesMatch(x, item))
  if (existing) {
    const nextQty = existing.quantity + qty
    if (maxStock != null && nextQty > maxStock) return { ok: false, reason: 'stock' }
    existing.quantity = nextQty
  } else {
    if (maxStock != null && qty > maxStock) return { ok: false, reason: 'stock' }
    cart.push({ ...item, quantity: qty })
  }
  setCart(cart)
  return { ok: true }
}

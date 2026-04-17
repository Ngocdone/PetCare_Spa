/**
 * Định dạng tiền VND (Intl).
 */
export function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(n) || 0)
}

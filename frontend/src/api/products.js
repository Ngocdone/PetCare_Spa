/**
 * Client fetch sản phẩm: REST /api/products (list, theo id, all cho admin).
 */
import { apiUrl } from '../config.js'

export async function fetchProducts() {
  const res = await fetch(apiUrl('/api/products'))
  if (!res.ok) throw new Error('Không tải được danh sách sản phẩm (MySQL)')
  return res.json()
}

/** Gồm cả sản phẩm tạm ẩn (trang quản trị) */
export async function fetchProductsAll() {
  const url = apiUrl('/api/products?all=1')
  const res = await fetch(url)
  if (!res.ok) {
    const hint =
      res.status === 404
        ? ' Kiểm tra backend Node (cd backend && npm start), proxy Vite /api → :3001, hoặc VITE_API_BASE.'
        : ' Kiểm tra MySQL, database petcare_spa (database/petcare_spa_vi.sql), và backend/.env (DB_*).'
    throw new Error(`Không tải được sản phẩm (HTTP ${res.status}).${hint}`)
  }
  return res.json()
}

export async function fetchProductById(id) {
  const enc = encodeURIComponent(id)
  const res = await fetch(apiUrl(`/api/products/${enc}`))
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Không tải được sản phẩm (MySQL)')
  return res.json()
}

export async function fetchProductReviews(productId) {
  const enc = encodeURIComponent(productId)
  const res = await fetch(apiUrl(`/api/products/${enc}/reviews`))
  if (!res.ok) throw new Error('Không tải được đánh giá sản phẩm.')
  return res.json()
}

export async function fetchReviewEligibility(productId, { userId, email } = {}) {
  const enc = encodeURIComponent(productId)
  const q = new URLSearchParams()
  if (userId != null && String(userId).trim() !== '') q.set('user_id', String(userId))
  if (email) q.set('email', String(email))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  const res = await fetch(apiUrl(`/api/products/${enc}/review-eligibility${suffix}`))
  if (!res.ok) throw new Error('Không kiểm tra được quyền đánh giá.')
  return res.json()
}

export async function postProductReview(productId, payload) {
  const enc = encodeURIComponent(productId)
  const res = await fetch(apiUrl(`/api/products/${enc}/reviews`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Gửi đánh giá thất bại.')
  }
  return data
}

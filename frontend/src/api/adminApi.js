/**
 * Gọi API admin (/api/admin/...) và categories: dữ liệu dashboard, đơn, lịch, CRUD, tier.
 */
import { apiUrl } from '../config.js'

/** Danh mục — GET/POST/PATCH/DELETE `/api/categories` */
export async function fetchAdminCategories() {
  const url = apiUrl('/api/categories')
  let res
  try {
    res = await fetch(url)
  } catch (e) {
    const m = e?.message || String(e)
    throw new Error(
      `${m}. Hãy chạy API: cd backend → npm start (cổng 3001), rồi F5 trang.`
    )
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const hint =
      res.status === 404
        ? ' (404 — kiểm tra backend đã mount GET /api/categories).'
        : ''
    throw new Error(
      (data && data.error) ||
        `HTTP ${res.status} khi gọi ${url}.${hint} Kiểm tra terminal backend.`
    )
  }
  return Array.isArray(data) ? data : []
}

export async function postAdminCategory(body) {
  const res = await fetch(apiUrl('/api/categories'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Tạo danh mục thất bại')
  }
  return data.category
}

export async function patchAdminCategory(id, body) {
  const enc = encodeURIComponent(id)
  const res = await fetch(apiUrl(`/api/categories/${enc}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Cập nhật danh mục thất bại')
  }
  return data.category
}

export async function deleteAdminCategory(id) {
  const enc = encodeURIComponent(id)
  const res = await fetch(apiUrl(`/api/categories/${enc}`), {
    method: 'DELETE',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Xóa danh mục thất bại')
  }
  return data
}

export async function fetchAdminData() {
  const res = await fetch(apiUrl('/api/admin/data'))
  if (!res.ok) throw new Error('Không tải được dữ liệu quản trị (/api/admin/data)')
  return res.json()
}

export async function fetchTierThresholds() {
  const res = await fetch(apiUrl('/api/admin/tier-thresholds'))
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Không tải được ngưỡng hạng')
  }
  return data
}

/** Body: { tier, lockAutoTier? } hoặc { lockAutoTier: false } để đồng bộ theo chi tiêu */
export async function patchUserTier(userId, body) {
  const enc = encodeURIComponent(userId)
  const res = await fetch(apiUrl(`/api/admin/users/${enc}/tier`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Cập nhật hạng thất bại')
  }
  return data
}

export async function postProductImageUpload(file) {
  const fd = new FormData()
  fd.append('image', file)
  const res = await fetch(apiUrl('/api/products/upload'), {
    method: 'POST',
    body: fd,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Tải ảnh lên thất bại')
  }
  if (!data.path || typeof data.path !== 'string') {
    throw new Error('Phản hồi upload không hợp lệ')
  }
  return data.path
}

export async function postProductSave(body) {
  const id = body?.id != null ? String(body.id).trim() : ''
  const { id: _omit, ...rest } = body || {}
  const url = id ? apiUrl(`/api/products/${encodeURIComponent(id)}`) : apiUrl('/api/products')
  const method = id ? 'PUT' : 'POST'
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(id ? rest : body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Lưu sản phẩm thất bại')
  }
  return data.product !== undefined ? data.product : data
}

export async function postProductDelete(id) {
  const res = await fetch(apiUrl(`/api/products/${encodeURIComponent(id)}`), {
    method: 'DELETE',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Xóa sản phẩm thất bại')
  }
  return data
}

export async function patchOrderStatus(id, status) {
  const res = await fetch(apiUrl(`/api/admin/orders/${id}/status`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Cập nhật đơn hàng thất bại')
  }
  return data
}

export async function postAppointmentStatus(id, status) {
  const res = await fetch(apiUrl(`/api/admin/appointments/${id}/status`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Cập nhật trạng thái thất bại')
  }
  return data
}

export async function fetchAdminServices() {
  const res = await fetch(apiUrl('/api/admin/services'))
  const data = await res.json().catch(() => ({}))
  if (res.ok) return Array.isArray(data) ? data : []
  if (res.status === 404) {
    const fallbackRes = await fetch(apiUrl('/api/services'))
    const fallbackData = await fallbackRes.json().catch(() => ({}))
    if (!fallbackRes.ok) throw new Error('Không tải được dịch vụ spa')
    const list = Array.isArray(fallbackData) ? fallbackData : []
    return list.map((s) => ({ ...s, status: 'active', __adminRouteMissing: true }))
  }
  throw new Error(data.error || 'Không tải được dịch vụ spa')
}

export async function postAdminServiceSave(body) {
  const id = body?.id != null ? String(body.id).trim() : ''
  const { id: _omit, ...rest } = body || {}
  const url = id ? apiUrl(`/api/admin/services/${encodeURIComponent(id)}`) : apiUrl('/api/admin/services')
  const method = id ? 'PUT' : 'POST'
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(id ? rest : body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Backend chưa cập nhật route /api/admin/services. Vui lòng restart backend.')
    }
    throw new Error(data.error || 'Lưu dịch vụ thất bại')
  }
  return data.service !== undefined ? data.service : data
}

export async function deleteAdminService(id) {
  const res = await fetch(apiUrl(`/api/admin/services/${encodeURIComponent(id)}`), {
    method: 'DELETE',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Backend chưa cập nhật route /api/admin/services. Vui lòng restart backend.')
    }
    throw new Error(data.error || 'Xóa dịch vụ thất bại')
  }
  return data
}

// Note: đổi trạng thái dịch vụ dùng postAdminServiceSave để tương thích backend cũ/mới.

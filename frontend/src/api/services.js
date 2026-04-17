/**
 * Client fetch dịch vụ: ưu tiên admin list nếu có, không thì /api/services.
 */
import { apiUrl } from '../config.js'

export async function fetchServices() {
  // Ưu tiên endpoint admin để lấy đủ cả dịch vụ đang áp dụng + tạm ngưng.
  // Nếu không có route admin thì fallback về endpoint công khai.
  try {
    const adminRes = await fetch(apiUrl('/api/admin/services'))
    if (adminRes.ok) {
      const adminData = await adminRes.json()
      if (Array.isArray(adminData)) return adminData
    }
  } catch {
    // ignore và fallback
  }

  const res = await fetch(apiUrl('/api/services'))
  if (!res.ok) throw new Error('Không tải được dịch vụ')
  return res.json()
}

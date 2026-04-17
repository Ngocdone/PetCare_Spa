/**
 * Chuẩn hoá cờ dịch vụ nổi bật từ nhiều kiểu API/DB (boolean, số, chuỗi).
 */
export function isServiceFeatured(s) {
  if (!s || typeof s !== 'object') return false
  const v = s.featured ?? s.noi_bat
  if (v === true || v === 1) return true
  if (v === false || v === 0 || v == null || v === '') return false
  if (typeof v === 'string') {
    const t = v.trim().toLowerCase()
    if (t === '1' || t === 'true' || t === 'yes') return true
    if (t === '0' || t === 'false' || t === 'no' || t === '') return false
    return false
  }
  return Boolean(v)
}

/** Ngày YYYY-MM-DD theo giờ máy (không dùng toISOString — tránh lệch UTC so với lịch VN). */
export function localDateStr(d = new Date()) {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

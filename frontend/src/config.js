/**
 * Cấu hình SPA: `apiUrl()` (gốc API theo VITE_API_BASE / dev), `LEGACY_HTML_BASE` khi chạy lẫn site PHP cũ.
 * Gốc site legacy (Apache + PHP). Chỉ dùng khi đặt VITE_LEGACY_HTML_BASE — mặc định SPA gọi API qua Express.
 */
export const LEGACY_HTML_BASE = (
  import.meta.env.VITE_LEGACY_HTML_BASE || ''
).replace(/\/$/, '')

/** Ghép path tương đối với Vite `BASE_URL` (dev / hay /webSPA/...) */
function pathUnderAppBase(relNoLead) {
  const base = import.meta.env.BASE_URL || '/'
  const norm = base.endsWith('/') ? base : `${base}/`
  return new URL(relNoLead, `http://vite.local${norm}`).pathname
}

/**
 * URL gốc API (không dấu / cuối).
 * Dev: gọi thẳng cổng 3001 cùng hostname với trang (localhost hoặc 127.0.0.1) — tránh proxy Vite 404 và tránh lệch CORS.
 * Ghi đè: VITE_API_BASE. Legacy Apache: VITE_LEGACY_HTML_BASE.
 */
function resolveApiBase() {
  const explicit = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
  if (explicit) return explicit
  if (LEGACY_HTML_BASE) return ''
  if (import.meta.env.DEV) {
    const host =
      typeof window !== 'undefined' && window.location?.hostname
        ? window.location.hostname
        : '127.0.0.1'
    return `http://${host}:3001`
  }
  return ''
}

/**
 * Legacy Apache/HTML: ghép path tới `VITE_LEGACY_HTML_BASE`. SPA mặc định dùng `apiUrl()`.
 */
export function phpApiUrl(path) {
  const raw = path.replace(/^\//, '')
  if (LEGACY_HTML_BASE) return `${LEGACY_HTML_BASE}/${raw}`
  const base = resolveApiBase()
  if (base) {
    const [pathnamePart, ...rest] = raw.split('?')
    const q = rest.length ? `?${rest.join('?')}` : ''
    return `${base}/${pathnamePart}${q}`
  }
  const [pathnamePart, ...rest] = raw.split('?')
  const q = rest.length ? `?${rest.join('?')}` : ''
  return `${pathUnderAppBase(pathnamePart)}${q}`
}

/** API base tại thời điểm gọi (dev: http://{hostname}:3001) */
export function getApiBase() {
  return resolveApiBase()
}

export function apiUrl(path) {
  const raw = path.startsWith('/') ? path.slice(1) : path
  const base = resolveApiBase()
  if (base) {
    const withSlash = path.startsWith('/') ? path : `/${path}`
    return `${base}${withSlash}`
  }
  const [pathnamePart, ...rest] = raw.split('?')
  const q = rest.length ? `?${rest.join('?')}` : ''
  return `${pathUnderAppBase(pathnamePart)}${q}`
}

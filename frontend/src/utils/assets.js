/**
 * Đường dẫn asset tĩnh (logo shop, v.v.) — hỗ trợ base legacy HTML nếu cấu hình.
 */
import { LEGACY_HTML_BASE } from '../config.js'

/** Ảnh dự phòng khi file `img/...` không tồn tại hoặc URL lỗi */
export const PRODUCT_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80'

/** Logo cửa hàng — đặt file tại `img/logo.png` (thư mục gốc project, cùng cấp `frontend/`) */
export const SHOP_LOGO_IMG = 'img/logo.png'

/**
 * Ảnh trong DB: `img/ten.jpg`, `ten.jpg`, hoặc URL https.
 *
 * - File cục bộ: luôn `/img/...` từ **gốc host** (không ghép `BASE_URL` / subpath).
 *   Vite chỉ mount `/img` → tránh 404 khi `base` là `/webSPA/...` mà ảnh không nằm trong dist.
 * - Express: `app.use('/img', static)` và `${SPA_PUBLIC_BASE}/img` đều phục vụ được.
 * - `VITE_API_BASE`: ảnh tải từ host API (SPA và API khác origin).
 * - `VITE_LEGACY_HTML_BASE`: site HTML/Apache cũ.
 */
export function getProductImageSrc(src) {
  if (!src || typeof src !== 'string') return ''
  const t = src.trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t

  const pathFromT = t.startsWith('/') ? t.slice(1) : t
  const underRoot =
    pathFromT.startsWith('img/') || pathFromT.includes('/')
      ? pathFromT
      : `img/${pathFromT}`

  if (LEGACY_HTML_BASE) {
    return `${LEGACY_HTML_BASE}/${underRoot}`
  }

  const explicitApi = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
  if (explicitApi) {
    return `${explicitApi}/${underRoot}`
  }

  return `/${underRoot}`.replace(/\/{2,}/g, '/')
}

export function getShopLogoSrc() {
  return getProductImageSrc(SHOP_LOGO_IMG)
}

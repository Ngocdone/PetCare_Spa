/**
 * Session khách: đọc/ghi user + token trong localStorage (CURRENT_USER_KEY).
 * Token phiên (`petspa_token`): cookie + localStorage — gửi Bearer khi gọi API cổng khác Vite.
 */
import { CURRENT_USER_KEY } from './cartStorage.js'

const SESSION_TOKEN_LS_KEY = 'petspa_token'

/** Token đăng nhập (cookie trước, rồi localStorage) — dùng cho Authorization: Bearer */
export function getSessionToken() {
  if (typeof document !== 'undefined') {
    const m = document.cookie.match(/(?:^|; )petspa_token=([^;]*)/)
    if (m) {
      let t = m[1]
      try {
        t = decodeURIComponent(t)
      } catch {
        /* raw */
      }
      if (t) {
        try {
          localStorage.setItem(SESSION_TOKEN_LS_KEY, t)
        } catch {
          /* ignore */
        }
      }
      return t
    }
  }
  try {
    return localStorage.getItem(SESSION_TOKEN_LS_KEY) || ''
  } catch {
    return ''
  }
}

/** Lưu token (cookie + localStorage) sau đăng nhập / đổi mật khẩu */
export function setSessionToken(token) {
  const t = String(token || '').trim()
  if (!t) {
    try {
      localStorage.removeItem(SESSION_TOKEN_LS_KEY)
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') {
      document.cookie =
        'petspa_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    }
    return
  }
  try {
    localStorage.setItem(SESSION_TOKEN_LS_KEY, t)
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.cookie = `petspa_token=${encodeURIComponent(t)}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCurrentUser(user) {
  const toSave = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone != null ? user.phone : '',
    address: user.address != null ? String(user.address) : '',
    role: user.role || 'user',
    tier: user.tier || 'bronze',
    avatar:
      user.avatar != null && String(user.avatar).trim()
        ? String(user.avatar).trim()
        : user.avatarUrl != null && String(user.avatarUrl).trim()
          ? String(user.avatarUrl).trim()
          : '',
  }
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(toSave))
}

export function clearUserSession() {
  localStorage.removeItem(CURRENT_USER_KEY)
  localStorage.removeItem('petspa_current_user')
  try {
    localStorage.removeItem(SESSION_TOKEN_LS_KEY)
  } catch {
    /* ignore */
  }
  document.cookie =
    'petspa_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
}

function isSessionErrorPayload(data) {
  const msg = String(data?.error || '').toLowerCase()
  if (!msg) return false
  return (
    msg.includes('no token') ||
    msg.includes('phiên đăng nhập') ||
    msg.includes('đăng nhập lại') ||
    msg.includes('hết hạn') ||
    msg.includes('invalid token') ||
    msg.includes('invalid user') ||
    msg.includes('vui lòng đăng nhập')
  )
}

/**
 * Gọi API có Bearer nếu có token; nếu lỗi xác thực thì retry 1 lần chỉ với cookie.
 * Tránh trường hợp localStorage token cũ/sai làm backend từ chối dù cookie hợp lệ.
 */
export async function fetchWithSessionFallback(input, init = {}) {
  const token = getSessionToken()
  const baseHeaders = { ...(init.headers || {}) }
  const run = (headers) =>
    fetch(input, {
      ...init,
      headers,
      credentials: init.credentials || 'include',
    })

  const withAuthHeaders = token
    ? { ...baseHeaders, Authorization: `Bearer ${token}` }
    : baseHeaders
  let res = await run(withAuthHeaders)

  if (!token) return res

  const probe = await res.clone().json().catch(() => null)
  const shouldRetry = res.status === 401 || isSessionErrorPayload(probe)
  if (!shouldRetry) return res

  const retryHeaders = { ...baseHeaders }
  if ('Authorization' in retryHeaders) delete retryHeaders.Authorization
  res = await run(retryHeaders)
  const retryProbe = await res.clone().json().catch(() => null)
  if (res.status === 401 || isSessionErrorPayload(retryProbe)) {
    clearUserSession()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('petspa-user-updated'))
    }
  }
  return res
}

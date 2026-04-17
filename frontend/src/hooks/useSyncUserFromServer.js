/**
 * Hook: khi có session user, gọi GET /api/me để đồng bộ tên/SĐT/địa chỉ/avatar (MySQL) vào localStorage.
 */
import { useEffect } from 'react'
import { apiUrl } from '../config.js'
import { fetchWithSessionFallback, getCurrentUser, setCurrentUser } from '../utils/auth.js'
import { getUserProfile, saveUserProfile } from '../utils/userProfile.js'

export function useSyncUserFromServer() {
  useEffect(() => {
    const u = getCurrentUser()
    if (!u || !u.id) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetchWithSessionFallback(apiUrl('/api/me'), {
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await res.json().catch(() => ({}))
        if (cancelled || !data.success || !data.user) return
        const su = data.user
        setCurrentUser({ ...u, ...su })
        const prof = getUserProfile()
        saveUserProfile(
          {
            ...prof,
            name: su.name ?? prof.name,
            phone: su.phone ?? prof.phone,
            address: su.address != null ? String(su.address) : prof.address,
            avatar: su.avatar ?? prof.avatar,
          },
          su
        )
        window.dispatchEvent(new CustomEvent('petspa-user-updated'))
      } catch {
        /* offline hoặc token demo không hợp lệ */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])
}

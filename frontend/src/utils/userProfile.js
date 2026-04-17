/**
 * Cache profile bổ sung (theo user) trong localStorage — dùng cùng auth.
 */
import { getCurrentUser } from './auth.js'

const USER_PROFILE_KEY = 'petspa_user_profile'

function profileKeyFor(userOrIdentity) {
  const u =
    typeof userOrIdentity === 'object' && userOrIdentity
      ? userOrIdentity
      : getCurrentUser()
  const email = String(u?.email || '').trim().toLowerCase()
  const id = String(u?.id || '').trim()
  if (email) return `${USER_PROFILE_KEY}:${email}`
  if (id) return `${USER_PROFILE_KEY}:id:${id}`
  return USER_PROFILE_KEY
}

export function getUserProfile(userOrIdentity) {
  try {
    const key = profileKeyFor(userOrIdentity)
    return JSON.parse(localStorage.getItem(key)) || {}
  } catch {
    return {}
  }
}

export function saveUserProfile(profile, userOrIdentity) {
  const key = profileKeyFor(userOrIdentity)
  localStorage.setItem(key, JSON.stringify(profile))
}

/**
 * Thú cưng (MySQL `thu_cung`) — cần đăng nhập.
 */
import { apiUrl } from '../config.js'
import { fetchWithSessionFallback } from '../utils/auth.js'

/** @returns {Promise<{ success: boolean, pets?: Array, error?: string }>} */
export async function fetchMyPets() {
  const res = await fetchWithSessionFallback(apiUrl('/api/pets/me'), {
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok && !data.success) {
    return { success: false, pets: [], error: data.error || 'Không tải được danh sách.' }
  }
  return {
    success: data.success !== false,
    pets: Array.isArray(data.pets) ? data.pets : [],
    error: data.error,
  }
}

export async function createPet({ name, pet_type, weight_kg }) {
  const res = await fetchWithSessionFallback(apiUrl('/api/pets'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, pet_type, weight_kg }),
  })
  return res.json().catch(() => ({}))
}

export async function updatePet(id, { name, pet_type, weight_kg }) {
  const res = await fetchWithSessionFallback(apiUrl(`/api/pets/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, pet_type, weight_kg }),
  })
  return res.json().catch(() => ({}))
}

export async function deletePet(id) {
  const res = await fetchWithSessionFallback(apiUrl(`/api/pets/${id}`), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  return res.json().catch(() => ({}))
}

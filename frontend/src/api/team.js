/**
 * Client fetch đội ngũ: GET /api/team.
 */
import { apiUrl } from '../config.js'

export async function fetchTeam() {
  const res = await fetch(apiUrl('/api/team'))
  if (!res.ok) throw new Error('Không tải được đội ngũ')
  return res.json()
}

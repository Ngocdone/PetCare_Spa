/**
 * Bảo vệ route /admin: chỉ cho user có role admin (không thì redirect).
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getCurrentUser } from '../utils/auth.js'

export default function RequireAdmin() {
  const user = getCurrentUser()
  const loc = useLocation()
  if (!user || user.role !== 'admin') {
    const ret = encodeURIComponent(loc.pathname + loc.search)
    return <Navigate to={`/login?return=${ret}`} replace />
  }
  return <Outlet />
}

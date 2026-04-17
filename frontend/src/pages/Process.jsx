/**
 * Legacy URL /process — chuyển hướng sang trang Giới thiệu (quy trình).
 */
import { Navigate } from 'react-router-dom'

export default function Process() {
  return <Navigate to="/about#quy-trinh" replace />
}

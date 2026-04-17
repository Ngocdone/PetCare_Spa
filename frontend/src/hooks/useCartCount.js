/**
 * Số lượng món trong giỏ (localStorage), lắng nghe sự kiện cập nhật giỏ.
 */
import { useCallback, useEffect, useState } from 'react'
import { getCartCount } from '../utils/cartStorage.js'

export function useCartCount() {
  const [count, setCount] = useState(() => getCartCount())

  const refresh = useCallback(() => setCount(getCartCount()), [])

  useEffect(() => {
    window.addEventListener('petspa-cart-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('petspa-cart-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])

  return count
}

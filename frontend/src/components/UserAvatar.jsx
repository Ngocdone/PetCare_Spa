/**
 * Avatar người dùng: ảnh hoặc chữ cái từ tên; resolve đường dẫn ảnh.
 */
import { useEffect, useState } from 'react'
import { getProductImageSrc } from '../utils/assets.js'

/** Chữ đại diện: ưu tiên tên, sau đó email */
export function userDisplayInitial(name, email) {
  const n = (name || '').trim()
  if (n) {
    const ch = n.charAt(0)
    return ch.toLocaleUpperCase('vi-VN')
  }
  const e = (email || '').trim()
  if (e) return e.charAt(0).toLocaleUpperCase('vi-VN')
  return '?'
}

/**
 * Ảnh đại diện hoặc chữ cái đầu (khi không có ảnh / ảnh lỗi).
 * `user.avatar` từ MySQL `anh_dai_dien` hoặc URL; đường dẫn tương đối qua getProductImageSrc.
 */
export default function UserAvatar({
  user,
  size = 40,
  className = '',
  alt = '',
  id,
}) {
  const [broken, setBroken] = useState(false)
  if (!user) {
    return (
      <span
        id={id}
        className={`user-avatar user-avatar--initial ${className}`.trim()}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
        aria-hidden
      >
        ?
      </span>
    )
  }

  const raw = (user.avatar || user.avatarUrl || '').trim()
  useEffect(() => {
    setBroken(false)
  }, [raw])
  const directSrc = /^data:image\//i.test(raw) || /^blob:/i.test(raw)
  const imgSrc = raw && !broken ? (directSrc ? raw : getProductImageSrc(raw)) : ''
  const initial = userDisplayInitial(user.name, user.email)

  if (imgSrc) {
    return (
      <span
        id={id}
        className={`user-avatar user-avatar--image-wrap ${className}`.trim()}
        style={{ width: size, height: size }}
      >
        <img
          src={imgSrc}
          alt={alt || user.name || 'Ảnh đại diện'}
          className="user-avatar__img"
          width={size}
          height={size}
          onError={() => setBroken(true)}
        />
      </span>
    )
  }

  return (
    <span
      id={id}
      className={`user-avatar user-avatar--initial ${className}`.trim()}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden={!alt}
      title={user.name || user.email || ''}
    >
      {initial}
    </span>
  )
}

/**
 * Ảnh sản phẩm: resolve `img/...` hoặc URL; lỗi tải → ảnh dự phòng.
 */
import { getProductImageSrc, PRODUCT_IMAGE_FALLBACK } from '../utils/assets.js'

export default function ProductImage({ image, alt, className, loading, ...rest }) {
  const src = getProductImageSrc(image || '') || PRODUCT_IMAGE_FALLBACK
  return (
    <img
      {...rest}
      src={src}
      alt={alt || ''}
      className={className}
      loading={loading}
      onError={(e) => {
        const el = e.currentTarget
        if (el.dataset.petspaImgFallback) return
        el.dataset.petspaImgFallback = '1'
        el.src = PRODUCT_IMAGE_FALLBACK
      }}
    />
  )
}

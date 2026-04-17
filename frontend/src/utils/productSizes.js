/**
 * Biến thể kích cỡ / trọng lượng (JSON từ API `sizes`).
 * Mỗi phần tử: { label, price, oldPrice?, stock? }
 */

export function getProductSizes(product) {
  const arr = product?.sizes
  return Array.isArray(arr) && arr.length ? arr : []
}

export function getVariantAt(product, index) {
  const sizes = getProductSizes(product)
  if (!sizes.length) return null
  const i = Math.min(Math.max(0, index), sizes.length - 1)
  const v = sizes[i]
  const label = String(v.label || '').trim() || `Tuỳ chọn ${i + 1}`
  return {
    label,
    variantKey: label,
    price: v.price != null ? Number(v.price) : 0,
    oldPrice:
      v.oldPrice != null && v.oldPrice !== ''
        ? Number(v.oldPrice)
        : null,
    stock:
      v.stock != null && v.stock !== ''
        ? Number(v.stock)
        : null,
  }
}

/** Tồn kho cho một dòng giỏ: theo biến thể nếu có, không thì theo sản phẩm gốc */
export function stockForCartLine(item, product) {
  if (!product) return null
  const vk = item?.variantKey
  if (vk != null && String(vk).trim() !== '' && Array.isArray(product.sizes)) {
    const v = product.sizes.find(
      (s) => String(s.label).trim() === String(vk).trim()
    )
    if (v) {
      if (v.stock == null || v.stock === '') return null
      const n = parseInt(String(v.stock), 10)
      return Number.isNaN(n) ? null : n
    }
  }
  if (product.stock == null || product.stock === '') return null
  const n = parseInt(String(product.stock), 10)
  return Number.isNaN(n) ? null : n
}

export function isLineOutOfStock(item, product) {
  const n = stockForCartLine(item, product)
  return n !== null && n <= 0
}

/** Giá hiển thị trên thẻ sản phẩm: dùng biến thể đầu hoặc giá gốc */
/** Thẻ sản phẩm: hết hàng nếu mọi biến thể đều hết (hoặc không có tồn được khai báo) */
export function isProductUnavailable(product) {
  const sizes = getProductSizes(product)
  if (sizes.length) {
    return sizes.every((s) => {
      if (s.stock == null || s.stock === '') return false
      const n = parseInt(String(s.stock), 10)
      return !Number.isNaN(n) && n <= 0
    })
  }
  if (product.stock == null || product.stock === '') return false
  const n = parseInt(String(product.stock), 10)
  return !Number.isNaN(n) && n <= 0
}

export function cardDisplayPrices(product) {
  const sizes = getProductSizes(product)
  if (!sizes.length) {
    return {
      price: Number(product.price) || 0,
      oldPrice:
        product.oldPrice != null ? Number(product.oldPrice) : null,
      fromLabel: false,
    }
  }
  const prices = sizes.map((s) => Number(s.price) || 0)
  const minP = Math.min(...prices)
  const idx = sizes.findIndex((s) => (Number(s.price) || 0) === minP)
  const s = sizes[idx >= 0 ? idx : 0]
  const op = s.oldPrice != null ? Number(s.oldPrice) : null
  const distinct = new Set(prices)
  return {
    price: minP,
    oldPrice: op,
    fromLabel: distinct.size > 1,
  }
}

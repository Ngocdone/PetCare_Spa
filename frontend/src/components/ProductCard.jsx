/**
 * Thẻ sản phẩm trong lưới cửa hàng: ảnh, giá, thêm nhanh vào giỏ / xem chi tiết.
 */
import { Link, useNavigate } from 'react-router-dom'
import ProductImage from './ProductImage.jsx'
import IconCart from './IconCart.jsx'
import { formatPrice } from '../utils/format.js'
import { getCurrentUser } from '../utils/auth.js'
import { addToCartLine } from '../utils/cartStorage.js'
import ProductStars from './ProductStars.jsx'
import {
  cardDisplayPrices,
  getProductSizes,
  getVariantAt,
  isProductUnavailable,
} from '../utils/productSizes.js'

function firstBuyableVariant(product) {
  const sizes = getProductSizes(product)
  if (!sizes.length) return null
  for (let i = 0; i < sizes.length; i++) {
    const v = getVariantAt(product, i)
    if (v.stock == null || v.stock === '') return v
    const n = parseInt(String(v.stock), 10)
    if (!Number.isNaN(n) && n > 0) return v
  }
  return getVariantAt(product, 0)
}

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const p = product
  const reviewCount = Number(p.reviewCount) || 0
  const displayRating = reviewCount > 0 ? Number(p.rating || 0) : 0
  const { price: cardPrice, oldPrice: cardOldPrice, fromLabel } =
    cardDisplayPrices(p)
  const discount =
    cardOldPrice && cardOldPrice > cardPrice
      ? Math.round((1 - cardPrice / cardOldPrice) * 100)
      : 0
  const out = isProductUnavailable(p)
  function onAddCart(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!getCurrentUser()) {
      const ret = encodeURIComponent(window.location.pathname + window.location.search)
      navigate(`/login?return=${ret}&reason=product_required`)
      return
    }
    if (out) {
      alert('Sản phẩm đã hết hàng.')
      return
    }
    const v = firstBuyableVariant(p)
    const linePrice = v ? v.price : p.price
    const lineName = v ? `${p.name} (${v.label})` : p.name
    const stock = v
      ? v.stock != null && v.stock !== ''
        ? parseInt(String(v.stock), 10)
        : null
      : p.stock != null
        ? parseInt(String(p.stock), 10)
        : null
    const r = addToCartLine(
      {
        id: p.id,
        name: lineName,
        price: linePrice,
        image: p.image,
        quantity: 1,
        variantKey: v ? v.variantKey : undefined,
      },
      stock
    )
    if (!r.ok && r.reason === 'stock') {
      alert('Không đủ số lượng trong kho.')
      return
    }
    window.dispatchEvent(new CustomEvent('petspa-cart-updated'))
    // toast giống common.js
    let toast = document.querySelector('.toast-msg--react')
    if (!toast) {
      toast = document.createElement('div')
      toast.className = 'toast-msg toast-msg--react'
      toast.setAttribute('aria-live', 'polite')
      toast.innerHTML =
        '<span class="toast-msg__text"></span>'
      document.body.appendChild(toast)
    }
    toast.querySelector('.toast-msg__text').textContent =
      'Đã thêm vào giỏ hàng!'
    toast.classList.add('toast-msg--visible')
    setTimeout(() => toast.classList.remove('toast-msg--visible'), 1000)
  }

  return (
    <div
      className="card card--product"
      {...(discount ? { 'data-discount': discount } : {})}
    >
      <Link to={`/product/${p.id}`} className="card__image-wrap">
        <ProductImage className="card__image" image={p.image} alt={p.name} />
      </Link>
      <div className="card__body">
        <h3 className="card__title">
          <Link to={`/product/${p.id}`}>{p.name}</Link>
        </h3>
        <div className="card__rating" title={String(displayRating)}>
          <ProductStars rating={displayRating} />
          <span className="card__rating-count">{reviewCount} đánh giá</span>
        </div>
        <div className="card__footer">
          <div className="card__price-wrap">
            <div className="card__price-line">
              {fromLabel ? (
                <span className="card__price-from">Từ </span>
              ) : null}
              <span className="card__price">{formatPrice(cardPrice)}</span>
              {cardOldPrice && cardOldPrice > cardPrice ? (
                <span className="card__price-old">
                  {formatPrice(cardOldPrice)}
                </span>
              ) : null}
            </div>
          </div>
          {out ? (
            <span className="btn btn--sm btn--out-of-stock" aria-disabled>
              Hết hàng
            </span>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--sm btn--icon-cart"
              onClick={onAddCart}
              aria-label="Thêm vào giỏ"
            >
              <IconCart size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

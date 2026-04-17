/**
 * Chi tiết SP: slug/id, chọn biến thể/size, thêm giỏ, đánh giá & form gửi review.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  fetchProductById,
  fetchProducts,
  fetchProductReviews,
  fetchReviewEligibility,
  postProductReview,
} from '../api/products.js'
import ProductImage from '../components/ProductImage.jsx'
import { formatPrice } from '../utils/format.js'
import { getCurrentUser } from '../utils/auth.js'
import { addToCartLine } from '../utils/cartStorage.js'
import ProductCard from '../components/ProductCard.jsx'
import IconCart from '../components/IconCart.jsx'
import { getProductSizes, getVariantAt } from '../utils/productSizes.js'

const CAT_LABEL = {
  'cham-soc': 'Chăm sóc',
  'thuc-an': 'Thức ăn',
  'phu-kien': 'Phụ kiện',
  'do-choi': 'Đồ chơi',
}

const PET_LABEL = {
  both: 'Chó & mèo',
  dog: 'Chó',
  cat: 'Mèo',
  ca_hai: 'Chó & mèo',
  cho: 'Chó',
  meo: 'Mèo',
}

function formatDateVi(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function RatingStars({ rating, className = '' }) {
  const r = Math.min(5, Math.max(0, parseFloat(rating) || 0))
  const full = Math.round(r)
  return (
    <span className={`pdp-stars ${className}`.trim()} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= full ? 'pdp-stars__fill' : 'pdp-stars__empty'}
        >
          ★
        </span>
      ))}
    </span>
  )
}

function parseStock(p) {
  if (p?.stock == null || p.stock === '') return null
  const n = parseInt(String(p.stock), 10)
  return Number.isNaN(n) ? null : n
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [product, setProduct] = useState(null)
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('desc')
  const [err, setErr] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState({ avg: null, total: 0 })
  const [reviewLoading, setReviewLoading] = useState(true)
  const [reviewEligibility, setReviewEligibility] = useState({
    canReview: false,
    reason: 'not_logged_in',
    orderId: null,
  })
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' })
  const [reviewSubmitBusy, setReviewSubmitBusy] = useState(false)
  const [reviewSubmitMsg, setReviewSubmitMsg] = useState('')
  const reviewTargetId = product?.id || id
  /** Chuỗi cho ô nhập số lượng (có thể rỗng lúc đang gõ) */
  const [qtyInput, setQtyInput] = useState('1')
  /** Chỉ số biến thể kích cỡ / trọng lượng (mảng `sizes` từ API) */
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [p, list] = await Promise.all([
          fetchProductById(id),
          fetchProducts(),
        ])
        if (cancelled) return
        if (!p) {
          setErr('Không tìm thấy sản phẩm')
          setProduct(null)
        } else {
          setProduct(p)
          setErr(null)
        }
        setAll(list)
      } catch (e) {
        if (!cancelled) setErr(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    setQtyInput('1')
    setSelectedSizeIndex(0)
  }, [id])

  useEffect(() => {
    const loc = getProductSizes(product).length
    if (loc && selectedSizeIndex >= loc) setSelectedSizeIndex(0)
  }, [product, selectedSizeIndex])

  useEffect(() => {
    if (searchParams.get('tab') === 'reviews') setTab('reviews')
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    setReviewLoading(true)
    fetchProductReviews(reviewTargetId)
      .then((data) => {
        if (cancelled) return
        setReviews(Array.isArray(data?.reviews) ? data.reviews : [])
        setReviewStats({
          avg:
            data?.avgRating != null && Number.isFinite(Number(data.avgRating))
              ? Number(data.avgRating)
              : null,
          total: Number(data?.total) || 0,
        })
      })
      .catch(() => {
        if (cancelled) return
        setReviews([])
        setReviewStats({ avg: null, total: 0 })
      })
      .finally(() => {
        if (!cancelled) setReviewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reviewTargetId])

  useEffect(() => {
    const u = getCurrentUser()
    if (!u?.id && !u?.email) {
      setReviewEligibility({
        canReview: false,
        reason: 'not_logged_in',
        orderId: null,
      })
      return
    }
    let cancelled = false
    fetchReviewEligibility(reviewTargetId, { userId: u?.id, email: u?.email || '' })
      .then((r) => {
        if (cancelled) return
        setReviewEligibility({
          canReview: !!r?.canReview,
          reason: r?.reason || 'unknown',
          orderId: r?.orderId || null,
        })
      })
      .catch(() => {
        if (!cancelled) {
          setReviewEligibility({
            canReview: false,
            reason: 'cannot_check',
            orderId: null,
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [reviewTargetId])

  const related = useMemo(() => {
    if (!product) return []
    return all
      .filter((x) => x.id !== product.id && x.category === product.category)
      .slice(0, 4)
  }, [all, product])

  function isOutOfStock(p) {
    const n = parseStock(p)
    return n !== null && n <= 0
  }

  function addCart(amount) {
    if (!product) return
    if (!getCurrentUser()) {
      const ret = encodeURIComponent(window.location.pathname + window.location.search)
      navigate(`/login?return=${ret}&reason=product_required`)
      return
    }
    const sizes = getProductSizes(product)
    const v = sizes.length ? getVariantAt(product, selectedSizeIndex) : null
    const linePrice = v ? v.price : product.price
    const lineName = v
      ? `${product.name} (${v.label})`
      : product.name
    const stock = v
      ? v.stock != null && !Number.isNaN(v.stock)
        ? parseInt(String(v.stock), 10)
        : null
      : parseStock(product)
    if (sizes.length && v && stock !== null && stock <= 0) {
      alert('Phân loại này đã hết hàng.')
      return
    }
    if (!sizes.length && isOutOfStock(product)) {
      alert('Sản phẩm đã hết hàng.')
      return
    }
    const r = addToCartLine(
      {
        id: product.id,
        name: lineName,
        price: linePrice,
        image: product.image,
        quantity: amount,
        variantKey: v ? v.variantKey : undefined,
      },
      stock
    )
    if (!r.ok && r.reason === 'stock') {
      alert('Không đủ số lượng trong kho.')
      return
    }
    window.dispatchEvent(new CustomEvent('petspa-cart-updated'))
    alert('Đã thêm vào giỏ hàng!')
  }

  function buyNow(amount) {
    if (!product) return
    if (!getCurrentUser()) {
      const ret = encodeURIComponent(window.location.pathname + window.location.search)
      navigate(`/login?return=${ret}&reason=product_required`)
      return
    }
    const sizes = getProductSizes(product)
    const v = sizes.length ? getVariantAt(product, selectedSizeIndex) : null
    const linePrice = v ? v.price : product.price
    const lineName = v
      ? `${product.name} (${v.label})`
      : product.name
    const stock = v
      ? v.stock != null && !Number.isNaN(v.stock)
        ? parseInt(String(v.stock), 10)
        : null
      : parseStock(product)
    if (sizes.length && v && stock !== null && stock <= 0) {
      alert('Phân loại này đã hết hàng.')
      return
    }
    if (!sizes.length && isOutOfStock(product)) {
      alert('Sản phẩm đã hết hàng.')
      return
    }
    if (stock != null && amount > stock) {
      alert('Không đủ số lượng trong kho.')
      return
    }
    navigate('/checkout', {
      state: {
        buyNow: [
          {
            id: product.id,
            name: lineName,
            price: linePrice,
            image: product.image,
            quantity: amount,
            variantKey: v ? v.variantKey : undefined,
          },
        ],
      },
    })
  }

  function reviewHintByReason(reason) {
    if (reason === 'not_logged_in') return 'Vui lòng đăng nhập để đánh giá.'
    if (reason === 'not_completed_order')
      return 'Bạn chỉ có thể đánh giá sau khi đã mua và nhận hàng (đơn hoàn thành).'
    if (reason === 'already_reviewed')
      return 'Bạn đã đánh giá sản phẩm này cho các đơn hàng đủ điều kiện.'
    if (reason === 'cannot_check')
      return 'Không thể kiểm tra quyền đánh giá lúc này. Vui lòng thử lại sau.'
    return ''
  }

  async function submitReview() {
    const u = getCurrentUser()
    if (!u?.id && !u?.email) {
      alert('Vui lòng đăng nhập để đánh giá.')
      navigate(`/login?return=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    if (!reviewEligibility.canReview || !reviewEligibility.orderId) {
      setReviewSubmitMsg(reviewHintByReason(reviewEligibility.reason))
      return
    }
    const content = String(reviewForm.content || '').trim()
    if (content.length < 8) {
      setReviewSubmitMsg('Vui lòng nhập tối thiểu 8 ký tự.')
      return
    }
    setReviewSubmitBusy(true)
    setReviewSubmitMsg('')
    try {
      await postProductReview(reviewTargetId, {
        order_id: reviewEligibility.orderId,
        user_id: u?.id || null,
        email: u?.email || '',
        reviewer_name: u?.name || 'Khách hàng',
        rating: reviewForm.rating,
        content,
      })
      const fresh = await fetchProductReviews(reviewTargetId)
      setReviews(Array.isArray(fresh?.reviews) ? fresh.reviews : [])
      setReviewStats({
        avg:
          fresh?.avgRating != null && Number.isFinite(Number(fresh.avgRating))
            ? Number(fresh.avgRating)
            : null,
        total: Number(fresh?.total) || 0,
      })
      const recheck = await fetchReviewEligibility(reviewTargetId, {
        userId: u?.id,
        email: u?.email || '',
      })
      setReviewEligibility({
        canReview: !!recheck?.canReview,
        reason: recheck?.reason || 'unknown',
        orderId: recheck?.orderId || null,
      })
      setReviewForm({ rating: 5, content: '' })
      setReviewSubmitMsg('Cảm ơn bạn! Đánh giá đã được gửi.')
    } catch (e) {
      setReviewSubmitMsg(e?.message || 'Gửi đánh giá thất bại.')
    } finally {
      setReviewSubmitBusy(false)
    }
  }

  const descriptionBlocks = useMemo(() => {
    if (!product?.description?.trim()) return []
    return product.description
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }, [product])

  const lineQty = useMemo(() => {
    if (!product) return 1
    const sizes = getProductSizes(product)
    let sn
    let o
    if (sizes.length) {
      const v = getVariantAt(product, selectedSizeIndex)
      sn =
        v?.stock != null && !Number.isNaN(v.stock)
          ? parseInt(String(v.stock), 10)
          : null
      o = sn !== null && sn <= 0
    } else {
      o = isOutOfStock(product)
      sn = parseStock(product)
    }
    const cap = sn != null && sn > 0 ? sn : o ? 0 : 99
    let n = parseInt(String(qtyInput).replace(/\D/g, ''), 10)
    if (qtyInput === '' || Number.isNaN(n) || n < 1) n = 1
    if (!o && cap > 0) n = Math.min(n, cap)
    return n
  }, [product, qtyInput, selectedSizeIndex])

  if (loading) {
    return (
      <main className="page-main product-detail-v2">
        <section className="product-detail-v2__section">
          <div className="container">
            <div className="product-detail-v2__skeleton" aria-busy="true">
              <div className="product-detail-v2__skeleton-gallery" />
              <div className="product-detail-v2__skeleton-info">
                <div className="product-detail-v2__skeleton-line product-detail-v2__skeleton-line--short" />
                <div className="product-detail-v2__skeleton-line" />
                <div className="product-detail-v2__skeleton-line" />
                <div className="product-detail-v2__skeleton-line product-detail-v2__skeleton-line--btn" />
              </div>
            </div>
            <p className="product-detail-v2__loading-text">Đang tải sản phẩm…</p>
          </div>
        </section>
      </main>
    )
  }

  if (err || !product) {
    return (
      <main className="page-main product-detail-v2">
        <section className="product-detail-v2__section">
          <div className="container">
            <div className="product-detail-v2__empty">
              <p className="product-detail-v2__empty-title">
                {err || 'Không tìm thấy sản phẩm'}
              </p>
              <p className="product-detail-v2__empty-hint">
                Có thể sản phẩm đã ngừng kinh doanh hoặc đường dẫn không đúng.
              </p>
              <div className="product-detail-v2__empty-actions">
                <Link to="/shop" className="product-detail-v2__btn product-detail-v2__btn--primary">
                  Về cửa hàng
                </Link>
                <Link to="/" className="product-detail-v2__btn product-detail-v2__btn--ghost">
                  Trang chủ
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const catLabel = CAT_LABEL[product.category] || product.category || 'Sản phẩm'
  const petLabel =
    PET_LABEL[product.petType] ||
    (product.petType ? String(product.petType) : 'Chó & mèo')
  const sizeOptions = getProductSizes(product)
  const selectedVariant = sizeOptions.length
    ? getVariantAt(product, selectedSizeIndex)
    : null
  const priceCurrent = selectedVariant ? selectedVariant.price : product.price
  const oldPriceCurrent =
    selectedVariant && selectedVariant.oldPrice != null
      ? selectedVariant.oldPrice
      : !sizeOptions.length
        ? product.oldPrice
        : null
  let stockNum
  let out
  if (sizeOptions.length && selectedVariant) {
    const sn =
      selectedVariant.stock != null && !Number.isNaN(selectedVariant.stock)
        ? parseInt(String(selectedVariant.stock), 10)
        : null
    stockNum = sn
    out = sn !== null && sn <= 0
  } else {
    stockNum = parseStock(product)
    out = isOutOfStock(product)
  }
  const maxQty =
    stockNum != null && stockNum > 0 ? stockNum : out ? 0 : 99
  const discountPct =
    oldPriceCurrent && oldPriceCurrent > priceCurrent
      ? Math.round((1 - priceCurrent / oldPriceCurrent) * 100)
      : 0

  const lowStock =
    !out && stockNum != null && stockNum > 0 && stockNum <= 5
  const displayReviewCount = reviewStats.total || 0
  const displayAvgRating =
    displayReviewCount > 0
      ? Number(reviewStats.avg != null ? reviewStats.avg : product.rating || 0)
      : 0

  return (
    <main className="page-main product-detail-v2">
      <section className="product-detail-v2__section">
        <div className="container">
          <nav className="product-detail-v2__crumb" aria-label="Breadcrumb">
            <ol className="product-detail-v2__crumb-list">
              <li className="product-detail-v2__crumb-item">
                <Link to="/" className="product-detail-v2__crumb-link">
                  Trang chủ
                </Link>
              </li>
              <li className="product-detail-v2__crumb-item">
                <span className="product-detail-v2__crumb-current">Chi tiết sản phẩm</span>
              </li>
            </ol>
          </nav>

          <div className="product-detail-v2__hero">
            <div className="product-detail-v2__gallery">
              <div className="product-detail-v2__gallery-frame">
                <ProductImage
                  image={product.image}
                  alt={product.name}
                  className="product-detail-v2__main-image"
                />
                {product.bestSeller ? (
                  <span className="product-detail-v2__badge product-detail-v2__badge--hot">
                    Bán chạy
                  </span>
                ) : null}
                {discountPct > 0 ? (
                  <span className="product-detail-v2__badge product-detail-v2__badge--sale">
                    −{discountPct}%
                  </span>
                ) : null}
              </div>
            </div>

            <div className="product-detail-v2__panel">
              <div className="product-detail-v2__tags">
                <span className="product-detail-v2__tag">{catLabel}</span>
                <span className="product-detail-v2__tag product-detail-v2__tag--muted">
                  {petLabel}
                </span>
              </div>

              <h1 className="product-detail-v2__title">{product.name}</h1>

              <div className="product-detail-v2__rating-row">
                <RatingStars rating={displayAvgRating} />
                <span className="product-detail-v2__rating-score">
                  {Number(displayAvgRating || 0).toFixed(1)}
                </span>
                <span className="product-detail-v2__rating-meta">/ 5</span>
                <span className="product-detail-v2__rating-dot" aria-hidden>
                  ·
                </span>
                <span className="product-detail-v2__rating-count">
                  {displayReviewCount} đánh giá
                </span>
              </div>

              <div className="product-detail-v2__price-row">
                <span className="product-detail-v2__price">
                  {formatPrice(priceCurrent)}
                </span>
                {oldPriceCurrent && oldPriceCurrent > priceCurrent ? (
                  <span className="product-detail-v2__price-old">
                    {formatPrice(oldPriceCurrent)}
                  </span>
                ) : null}
              </div>

              <div
                className={`product-detail-v2__stock ${out ? 'product-detail-v2__stock--out' : ''} ${lowStock ? 'product-detail-v2__stock--low' : ''}`}
              >
                {out ? (
                  <>
                    <span className="product-detail-v2__stock-dot" aria-hidden />
                    <span>Hết hàng — vui lòng xem sản phẩm khác hoặc quay lại sau.</span>
                  </>
                ) : (
                  <>
                    <span className="product-detail-v2__stock-dot" aria-hidden />
                    <span>
                      {stockNum != null
                        ? `Còn ${stockNum} sản phẩm trong kho`
                        : 'Đang có hàng'}
                    </span>
                    {stockNum != null && stockNum > 0 ? (
                      <span className="product-detail-v2__stock-bar-wrap" aria-hidden>
                        <span
                          className="product-detail-v2__stock-bar"
                          style={{
                            width: `${Math.min(100, 12 + (stockNum / 50) * 88)}%`,
                          }}
                        />
                      </span>
                    ) : null}
                  </>
                )}
              </div>

              {sizeOptions.length ? (
                <div className="product-detail-v2__sizes">
                  <span className="product-detail-v2__sizes-label" id="pdp-size-label">
                    Trọng lượng / quy cách
                  </span>
                  <div
                    className="product-detail-v2__size-chips"
                    role="group"
                    aria-labelledby="pdp-size-label"
                  >
                    {sizeOptions.map((opt, i) => {
                      const vs =
                        opt.stock != null && opt.stock !== ''
                          ? parseInt(String(opt.stock), 10)
                          : null
                      const dead = vs !== null && !Number.isNaN(vs) && vs <= 0
                      return (
                        <button
                          key={`${opt.label}-${i}`}
                          type="button"
                          className={`product-detail-v2__size-chip${selectedSizeIndex === i ? ' product-detail-v2__size-chip--active' : ''}`}
                          disabled={dead}
                          onClick={() => {
                            if (!dead) {
                              setSelectedSizeIndex(i)
                              setQtyInput('1')
                            }
                          }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <div className="product-detail-v2__buy-row">
                <div className="product-detail-v2__qty">
                  <span className="product-detail-v2__qty-label">Số lượng</span>
                  {out ? (
                    <span className="product-detail-v2__qty-unavailable">—</span>
                  ) : (
                    <div className="product-detail-v2__qty-ctrl">
                      <button
                        type="button"
                        className="product-detail-v2__qty-btn"
                        aria-label="Giảm số lượng"
                        disabled={lineQty <= 1}
                        onClick={() =>
                          setQtyInput(String(Math.max(1, lineQty - 1)))
                        }
                      >
                        −
                      </button>
                      <input
                        className="product-detail-v2__qty-input"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={qtyInput}
                        onChange={(e) => {
                          let t = e.target.value.replace(/[^\d]/g, '')
                          if (t === '') {
                            setQtyInput('')
                            return
                          }
                          let n = parseInt(t, 10)
                          if (Number.isNaN(n) || n < 1) {
                            setQtyInput('1')
                            return
                          }
                          if (maxQty > 0 && n > maxQty) {
                            setQtyInput(String(maxQty))
                            return
                          }
                          setQtyInput(String(n))
                        }}
                        onBlur={() => {
                          let n = parseInt(qtyInput, 10)
                          if (
                            qtyInput === '' ||
                            Number.isNaN(n) ||
                            n < 1
                          ) {
                            n = 1
                          }
                          if (maxQty > 0) n = Math.min(n, maxQty)
                          setQtyInput(String(n))
                        }}
                        aria-label="Số lượng"
                      />
                      <button
                        type="button"
                        className="product-detail-v2__qty-btn"
                        aria-label="Tăng số lượng"
                        disabled={lineQty >= maxQty}
                        onClick={() =>
                          setQtyInput(String(Math.min(maxQty, lineQty + 1)))
                        }
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
                {out ? (
                  <span className="product-detail-v2__cta product-detail-v2__cta--disabled">
                    Hết hàng
                  </span>
                ) : (
                  <div className="product-detail-v2__cta-group">
                    <button
                      type="button"
                      className="product-detail-v2__cta"
                      onClick={() => addCart(lineQty)}
                    >
                      <IconCart size={22} />
                      <span>Thêm vào giỏ</span>
                    </button>
                    <button
                      type="button"
                      className="product-detail-v2__cta product-detail-v2__cta--now"
                      onClick={() => buyNow(lineQty)}
                    >
                      Mua ngay
                    </button>
                  </div>
                )}
              </div>

              <p className="product-detail-v2__buy-note">
                Giá đã bao gồm VAT (nếu có). Phí giao hàng tính theo khu vực khi thanh
                toán.
              </p>
            </div>
          </div>

          <div className="product-detail-v2__tabs-wrap">
            <div className="product-detail-v2__tabs" role="tablist">
              {[
                ['desc', 'Mô tả chi tiết'],
                ['info', 'Thông tin & hướng dẫn sử dụng'],
                ['reviews', 'Đánh giá'],
              ].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  className={`product-detail-v2__tab${tab === k ? ' product-detail-v2__tab--active' : ''}`}
                  onClick={() => setTab(k)}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'desc' ? (
              <div
                className="product-detail-v2__tab-panel"
                role="tabpanel"
              >
                {descriptionBlocks.length ? (
                  <div className="product-detail-v2__prose">
                    {descriptionBlocks.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <div className="product-detail-v2__prose product-detail-v2__prose--fallback">
                    <p>
                      Sản phẩm thuộc danh mục <strong>{catLabel}</strong>, phù hợp cho{' '}
                      <strong>{petLabel}</strong>. Vui lòng đọc kỹ hướng dẫn trên nhãn
                      trước khi sử dụng; tránh để thú cưng liếm trực tiếp khi chưa tráng
                      sạch.
                    </p>
                    <p>
                      Nếu thú cưng có tiền sử dị ứng da, hãy thử một vùng nhỏ trước hoặc
                      tham khảo bác sĩ thú y. PetCare Spa cam kết hỗ trợ đổi trả theo
                      chính sách khi sản phẩm không đạt chất lượng.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {tab === 'info' ? (
              <div className="product-detail-v2__tab-panel" role="tabpanel">
                <dl className="product-detail-v2__spec">
                  <div>
                    <dt>Danh mục</dt>
                    <dd>{catLabel}</dd>
                  </div>
                  <div>
                    <dt>Đối tượng sử dụng</dt>
                    <dd>{petLabel}</dd>
                  </div>
                  <div>
                    <dt>Tình trạng kho</dt>
                    <dd>
                      {out
                        ? 'Hết hàng'
                        : stockNum != null
                          ? `${stockNum} sản phẩm`
                          : 'Còn hàng'}
                    </dd>
                  </div>
                  <div>
                    <dt>Đánh giá trung bình</dt>
                    <dd>
                      {Number(displayAvgRating || 0).toFixed(1)} / 5 sao
                    </dd>
                  </div>
                  <div className="product-detail-v2__spec--wide">
                    <dt>Thông tin</dt>
                    <dd>
                      {String(product?.storageGuide || '').trim() ||
                        'Bảo quản nơi khô ráo, tránh ánh nắng trực tiếp. Hạn sử dụng và thành phần chi tiết in trên bao bì sản phẩm.'}
                    </dd>
                  </div>
                  <div className="product-detail-v2__spec--wide">
                    <dt>Hướng dẫn sử dụng</dt>
                    <dd>
                      {String(product?.safetyGuide || '').trim() ||
                        'Chỉ dùng ngoài da lông thú cưng theo đúng liều lượng. Tránh tiếp xúc mắt và vết thương hở. Ngừng sử dụng và liên hệ bác sĩ thú y nếu có dấu hiệu kích ứng.'}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {tab === 'reviews' ? (
              <div className="product-detail-v2__tab-panel" role="tabpanel">
                <div className="product-detail-v2__reviews-head">
                  <div>
                    <p className="product-detail-v2__reviews-label">Điểm trung bình</p>
                    <p className="product-detail-v2__reviews-avg">
                      {Number(displayAvgRating || 0).toFixed(1)}
                      <span>/5</span>
                    </p>
                    <RatingStars rating={displayAvgRating} />
                  </div>
                  <p className="product-detail-v2__reviews-disclaimer">
                    Chỉ khách đã mua và nhận hàng mới có thể gửi đánh giá sản phẩm.
                  </p>
                </div>
                <div className="product-detail-v2__review-form">
                  <p className="product-detail-v2__review-form-title">Viết đánh giá</p>
                  {reviewEligibility.canReview ? (
                    <>
                      <div className="product-detail-v2__review-form-rating">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`product-detail-v2__star-btn${reviewForm.rating >= n ? ' active' : ''}`}
                            onClick={() =>
                              setReviewForm((x) => ({ ...x, rating: n }))
                            }
                            aria-label={`${n} sao`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={3}
                        className="product-detail-v2__review-textarea"
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                        value={reviewForm.content}
                        onChange={(e) =>
                          setReviewForm((x) => ({
                            ...x,
                            content: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="product-detail-v2__review-submit"
                        onClick={submitReview}
                        disabled={reviewSubmitBusy}
                      >
                        {reviewSubmitBusy ? 'Đang gửi…' : 'Gửi đánh giá'}
                      </button>
                    </>
                  ) : (
                    <p className="product-detail-v2__review-lock">
                      {reviewHintByReason(reviewEligibility.reason)}
                    </p>
                  )}
                  {reviewSubmitMsg ? (
                    <p className="product-detail-v2__review-msg">{reviewSubmitMsg}</p>
                  ) : null}
                </div>
                <ul className="product-detail-v2__review-list">
                  {reviewLoading ? (
                    <li className="product-detail-v2__review-card">
                      <p className="product-detail-v2__review-text">Đang tải đánh giá…</p>
                    </li>
                  ) : reviews.length === 0 ? (
                    <li className="product-detail-v2__review-card">
                      <p className="product-detail-v2__review-text">
                        Chưa có đánh giá nào cho sản phẩm này.
                      </p>
                    </li>
                  ) : (
                    reviews.map((rev) => (
                      <li key={rev.id} className="product-detail-v2__review-card">
                        <div className="product-detail-v2__review-top">
                          <span className="product-detail-v2__review-name">
                            {rev.reviewerName || 'Khách hàng'}
                          </span>
                          <RatingStars rating={rev.rating} />
                          <span className="product-detail-v2__review-date">
                            {formatDateVi(rev.createdAt)}
                          </span>
                        </div>
                        <p className="product-detail-v2__review-text">{rev.content}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : null}
          </div>

          {related.length ? (
            <div className="product-detail-v2__related">
              <div className="product-detail-v2__related-head">
                <h2 className="product-detail-v2__related-title">Có thể bạn cũng cần</h2>
                <p className="product-detail-v2__related-sub">
                  Gợi ý cùng danh mục <strong>{catLabel}</strong> — dùng kèm để chăm sóc
                  bộ lông trọn vẹn hơn.
                </p>
              </div>
              <div className="products-grid product-detail-v2__related-grid">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}

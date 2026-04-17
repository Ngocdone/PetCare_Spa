/**
 * Giỏ hàng: đọc/ghi localStorage (cartStorage), chỉnh số lượng, link sang thanh toán.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductImage from '../components/ProductImage.jsx'
import { formatPrice } from '../utils/format.js'
import { getCart, setCart } from '../utils/cartStorage.js'
import { fetchProductsAll, fetchProducts } from '../api/products.js'
import { stockForCartLine } from '../utils/productSizes.js'

export default function Cart() {
  const [cart, setCartState] = useState(() => getCart())
  const [stockMap, setStockMap] = useState({})
  const [productsCache, setProductsCache] = useState([])

  const refresh = useCallback(() => {
    setCartState(getCart())
  }, [])

  useEffect(() => {
    const fn = () => refresh()
    window.addEventListener('petspa-cart-updated', fn)
    return () => window.removeEventListener('petspa-cart-updated', fn)
  }, [refresh])

  useEffect(() => {
    let cancelled = false
    async function loadStocks() {
      try {
        const rows = await fetchProductsAll()
        if (cancelled) return
        const map = {}
        rows.forEach((p) => {
          map[String(p.id)] = Number(p.stock)
        })
        setStockMap(map)
        setProductsCache(rows)
      } catch {
        try {
          const rows = await fetchProducts()
          if (cancelled) return
          const map = {}
          rows.forEach((p) => {
            map[String(p.id)] = Number(p.stock)
          })
          setStockMap(map)
          setProductsCache(rows)
        } catch {
          if (!cancelled) {
            setStockMap({})
            setProductsCache([])
          }
        }
      }
    }
    loadStocks()
    return () => {
      cancelled = true
    }
  }, [])

  function maxQtyFor(item) {
    const p = productsCache.find((x) => String(x.id) === String(item?.id))
    const st = stockForCartLine(item, p)
    if (st != null && Number.isFinite(st) && st >= 0) return Math.max(1, st)
    const n = Number(stockMap[String(item?.id)])
    if (Number.isFinite(n) && n >= 0) return Math.max(1, n)
    return 99
  }

  useEffect(() => {
    if (!cart.length) return
    const current = getCart()
    let changed = false
    const next = current.map((it) => {
      const cap = maxQtyFor(it)
      const qty = Math.max(1, Math.min(Number(it.quantity) || 1, cap))
      if (qty !== (Number(it.quantity) || 1)) changed = true
      return { ...it, quantity: qty }
    })
    if (changed) {
      setCart(next)
      setCartState(next)
    }
  }, [stockMap, cart.length])

  const total = cart.reduce(
    (s, item) => s + item.price * (item.quantity || 1),
    0
  )

  function updateQty(index, delta) {
    const c = getCart()
    const item = c[index]
    if (!item) return
    if (delta < 0 && item.quantity <= 1) return
    const cap = maxQtyFor(item)
    const next = item.quantity + delta
    if (next < 1) return
    item.quantity = Math.min(next, cap)
    setCart(c)
    refresh()
  }

  function setQty(index, rawValue) {
    const c = getCart()
    const item = c[index]
    if (!item) return
    const cap = maxQtyFor(item)
    const t = String(rawValue || '').replace(/[^\d]/g, '')
    if (t === '') {
      item.quantity = 1
    } else {
      const n = parseInt(t, 10)
      item.quantity = Number.isNaN(n) ? 1 : Math.max(1, Math.min(cap, n))
    }
    setCart(c)
    refresh()
  }

  function removeAt(index) {
    const c = getCart().filter((_, i) => i !== index)
    setCart(c)
    refresh()
  }

  return (
    <main className="page-main page-main--cart">
      <section className="cart-hero">
        <div className="cart-hero__bg" />
        <div className="container cart-hero__inner">
          <h1 className="cart-hero__title">Giỏ hàng</h1>
          <p className="cart-hero__subtitle">
            Xem và chỉnh sửa giỏ hàng của bạn trước khi thanh toán.
          </p>
        </div>
      </section>

      <section className="section cart-section">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb__list">
              <li className="breadcrumb__item">
                <Link to="/" className="breadcrumb__link">
                  Trang chủ
                </Link>
              </li>
              <li className="breadcrumb__item">
                <Link to="/shop" className="breadcrumb__link">
                  Cửa hàng
                </Link>
              </li>
              <li className="breadcrumb__item">
                <span className="breadcrumb__current">Giỏ hàng</span>
              </li>
            </ol>
          </nav>

          {!cart.length ? (
            <div className="cart-empty" id="cartEmpty">
              <h2 className="cart-empty__title">Giỏ hàng trống</h2>
              <p className="cart-empty__text">
                Bạn chưa thêm sản phẩm nào. Khám phá cửa hàng để tìm sản phẩm
                phù hợp cho thú cưng.
              </p>
              <Link
                to="/shop"
                className="btn-modern btn-modern--primary"
              >
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <>
              <div className="cart-wrap" id="cartWrap">
                <div className="cart-main">
                  <div className="cart-list" id="cartList">
                    {cart.map((item, index) => {
                      const subtotal = item.price * (item.quantity || 1)
                      return (
                        <div className="cart-item" key={`${item.id}-${index}`}>
                          <Link
                            className="cart-item__image-wrap"
                            to={`/product/${item.id}`}
                          >
                            <ProductImage
                              className="cart-item__image"
                              image={item.image}
                              alt={item.name}
                            />
                          </Link>
                          <div className="cart-item__body">
                            <div className="cart-item__head">
                              <h3 className="cart-item__title">
                                <Link to={`/product/${item.id}`}>
                                  {item.name}
                                </Link>
                              </h3>
                              <button
                                type="button"
                                className="cart-item__remove cart-remove"
                                aria-label="Xóa"
                                onClick={() => removeAt(index)}
                              >
                                Xóa
                              </button>
                            </div>
                            <p className="cart-item__price">
                              {formatPrice(item.price)}
                              <span className="cart-item__unit"> / sp</span>
                            </p>
                            <div className="cart-item__footer">
                              <div className="cart-item__qty product-detail-v2__qty-ctrl">
                                <button
                                  type="button"
                                  className="product-detail-v2__qty-btn"
                                  aria-label="Giảm số lượng"
                                  onClick={() => updateQty(index, -1)}
                                  disabled={(item.quantity || 1) <= 1}
                                >
                                  −
                                </button>
                                <input
                                  type="text"
                                  value={item.quantity || 1}
                                  className="product-detail-v2__qty-input"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  onChange={(e) => setQty(index, e.target.value)}
                                  onBlur={(e) => setQty(index, e.target.value)}
                                  aria-label="Số lượng"
                                />
                                <button
                                  type="button"
                                  className="product-detail-v2__qty-btn"
                                  aria-label="Tăng số lượng"
                                  onClick={() => updateQty(index, 1)}
                                  disabled={(item.quantity || 1) >= maxQtyFor(item)}
                                >
                                  +
                                </button>
                              </div>
                              <span className="cart-item__subtotal cart-item-subtotal">
                                {formatPrice(subtotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="cart-wrap__actions">
                    <Link to="/shop" className="cart-continue">
                      Tiếp tục mua sắm
                    </Link>
                  </div>
                </div>
                <aside className="cart-summary">
                  <h3 className="cart-summary__title">Tóm tắt đơn hàng</h3>
                  <div className="cart-summary__row">
                    <span>Tạm tính</span>
                    <span id="cartSubtotal">{formatPrice(total)}</span>
                  </div>
                  <div className="cart-summary__total">
                    <span>Tổng cộng</span>
                    <span id="cartTotal">{formatPrice(total)}</span>
                  </div>
                  <Link
                    to="/checkout"
                    className="btn-modern btn-modern--primary btn-modern--lg cart-summary__checkout"
                  >
                    Thanh toán
                  </Link>
                  <p className="cart-summary__note">
                    Phí vận chuyển sẽ được tính tại bước thanh toán.
                  </p>
                </aside>
              </div>
              <div
                className="cart-mobile-sticky"
                id="cartMobileSticky"
                aria-hidden={false}
              >
                <div className="cart-mobile-sticky__inner">
                  <div className="cart-mobile-sticky__total">
                    <span>Tổng cộng</span>
                    <span id="cartMobileTotal">{formatPrice(total)}</span>
                  </div>
                  <Link
                    to="/checkout"
                    className="cart-mobile-sticky__btn"
                  >
                    Thanh toán
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

/**
 * Thanh toán: thông tin giao hàng, phương thức, tier/khuyến mãi, POST tạo đơn + redirect VNPay nếu có.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { apiUrl } from '../config.js'
import { fetchProducts } from '../api/products.js'
import { formatPrice } from '../utils/format.js'
import ProductImage from '../components/ProductImage.jsx'
import { getCart, setCart } from '../utils/cartStorage.js'
import { stockForCartLine } from '../utils/productSizes.js'
import { getCurrentUser as getUser } from '../utils/auth.js'
import { getUserProfile } from '../utils/userProfile.js'

const ORDERS_KEY = 'petspa_orders'
const PRODUCTS_KEY = 'petspa_products'
const ADDRESSES_KEY = 'petspa_addresses'
const PAYMENT_LABELS = {
  vnpay: 'VNPay',
  momo: 'Ví MoMo',
  zalopay: 'ZaloPay',
  card: 'Thẻ tín dụng',
}

function paymentLabel(payment) {
  if (payment === 'transfer') return 'Chuyển khoản'
  if (payment === 'cod') return 'Thanh toán khi nhận hàng'
  return PAYMENT_LABELS[payment] || String(payment || 'COD')
}

function buildGuestEmail(phoneRaw) {
  const digits = String(phoneRaw || '').replace(/\D/g, '')
  const seed = digits || `${Date.now()}`
  return `guest_${seed}@petspa.local`
}

const TIER_DISCOUNT = { bronze: 0, silver: 5, gold: 10, vip: 15 }
const TIER_LABELS = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', vip: 'VIP' }

function getCustomerTier(email) {
  if (!email) return 'bronze'
  try {
    const u = getUser()
    if (u?.email && (u.email || '').toLowerCase() === email.toLowerCase())
      return u.tier || 'bronze'
  } catch {
    /* ignore */
  }
  return 'bronze'
}

function getProductsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || []
  } catch {
    return []
  }
}

function setProducts(list) {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []
  } catch {
    return []
  }
}

function saveOrder(order) {
  const list = getOrders()
  if (!order.id) order.id = `ord${Date.now()}`
  order.status = 'pending'
  order.createdAt = new Date().toISOString()
  list.push(order)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list))
}

function readSavedAddresses() {
  try {
    const raw = JSON.parse(localStorage.getItem(ADDRESSES_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function normalizeSavedAddressRow(raw, index) {
  if (typeof raw === 'string') {
    const line = raw.trim()
    return {
      id: `legacy_${index}`,
      label: 'Địa chỉ',
      address: line,
      phone: '',
    }
  }
  return {
    id: raw?.id != null ? String(raw.id) : `idx_${index}`,
    label: String(raw?.label || 'Địa chỉ').trim() || 'Địa chỉ',
    address: String(raw?.address || raw?.line || '').trim(),
    phone: String(raw?.phone || '').trim(),
  }
}

function validateStock(cart, products) {
  for (let i = 0; i < cart.length; i++) {
    const item = cart[i]
    const product = products.find((p) => String(p.id) === String(item.id))
    if (!product) continue
    const stockNum = stockForCartLine(item, product)
    if (stockNum !== null) {
      if (stockNum <= 0) {
        return {
          valid: false,
          message: `Sản phẩm "${item.name || product.name}" đã hết hàng.`,
        }
      }
      const qty = item.quantity || 1
      if (qty > stockNum) {
        return {
          valid: false,
          message: `Sản phẩm "${item.name || product.name}" chỉ còn ${stockNum} sản phẩm.`,
        }
      }
    }
  }
  return { valid: true }
}

function deductStock(items, products) {
  const list = products.map((p) => ({
    ...p,
    sizes: Array.isArray(p.sizes)
      ? p.sizes.map((s) => ({ ...s }))
      : p.sizes,
  }))
  items.forEach((orderItem) => {
    const idx = list.findIndex((p) => String(p.id) === String(orderItem.id))
    if (idx < 0) return
    const prod = list[idx]
    const vk = orderItem.variantKey
    if (vk != null && String(vk).trim() !== '' && Array.isArray(prod.sizes)) {
      const si = prod.sizes.findIndex(
        (s) => String(s.label).trim() === String(vk).trim()
      )
      if (si >= 0 && prod.sizes[si].stock != null) {
        const stockNum = parseInt(String(prod.sizes[si].stock), 10)
        if (!isNaN(stockNum)) {
          const qty = orderItem.quantity || 1
          prod.sizes[si].stock = Math.max(0, stockNum - qty)
        }
      }
      return
    }
    if (prod.stock !== undefined) {
      const stockNum = parseInt(prod.stock, 10)
      if (!isNaN(stockNum)) {
        const qty = orderItem.quantity || 1
        prod.stock = Math.max(0, stockNum - qty)
      }
    }
  })
  setProducts(list)
}

async function postOrderWithRetry(payload, maxRetries = 1) {
  let lastErr = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const ctrl = new AbortController()
    const t = window.setTimeout(() => ctrl.abort(), 12000)
    try {
      const res = await fetch(apiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      })
      const text = await res.text()
      let data = null
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(
          `Phản hồi máy chủ không hợp lệ (HTTP ${res.status}). Vui lòng thử lại.`
        )
      }
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error || `Máy chủ trả lỗi (HTTP ${res.status}). Vui lòng thử lại.`
        )
      }
      return data
    } catch (e) {
      lastErr = e
      const isLast = attempt >= maxRetries
      if (isLast) break
      await new Promise((r) => window.setTimeout(r, 500))
    } finally {
      window.clearTimeout(t)
    }
  }
  if (lastErr?.name === 'AbortError') {
    throw new Error('Kết nối tới máy chủ quá lâu. Vui lòng kiểm tra mạng và thử lại.')
  }
  throw new Error(lastErr?.message || 'Không thể kết nối máy chủ đặt hàng.')
}

export default function Checkout() {
  const location = useLocation()
  const buyNowOrderRef = useRef(false)
  const [cartState, setCartState] = useState(() => {
    const bn = location.state?.buyNow
    if (Array.isArray(bn) && bn.length) {
      buyNowOrderRef.current = true
      return bn
    }
    return getCart()
  })
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [savedAddresses, setSavedAddresses] = useState([])
  const [savedAddressId, setSavedAddressId] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [addressMode, setAddressMode] = useState('new')
  const [address, setAddress] = useState('')
  const [payment, setPayment] = useState('cod')

  const [notice, setNotice] = useState(null)
  const [payModal, setPayModal] = useState(null)
  const [successId, setSuccessId] = useState(null)
  const [successSummary, setSuccessSummary] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [err, setErr] = useState({})

  useEffect(() => {
    fetchProducts()
      .then((rows) => {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(rows))
      })
      .catch(() => {
        /* keep existing storage */
      })
  }, [])

  useEffect(() => {
    const u = getUser()
    const profile = getUserProfile()
    const list = readSavedAddresses()
      .map(normalizeSavedAddressRow)
      .filter((x) => x.address)

    if (u) {
      setName((n) => n || profile.name || u.name || '')
      setEmail((e) => e || profile.email || u.email || '')
      setPhone((p) => p || profile.phone || u.phone || '')
    }

    const profileAddress = (profile.address || '').trim()
    const hasProfileInList = list.some((x) => x.address === profileAddress)
    if (profileAddress && !hasProfileInList) {
      list.unshift({
        id: 'profile_address',
        label: 'Địa chỉ từ hồ sơ',
        address: profileAddress,
        phone: String(profile.phone || u?.phone || '').trim(),
      })
    }

    setSavedAddresses(list)
    if (list.length > 0) {
      const first = list[0]
      setSavedAddressId(first.id)
      setAddress(first.address)
      setAddressMode('saved')
    }
  }, [])

  const subtotal = cartState.reduce(
    (s, item) => s + item.price * (item.quantity || 1),
    0
  )
  const user = getUser()
  const isLoggedIn = !!user
  const emailForTier = (user && user.email) || email.trim() || ''
  const tier = isLoggedIn ? getCustomerTier(emailForTier) : 'bronze'
  const tierPct = TIER_DISCOUNT[tier] || 0
  const tierAmount = Math.round((subtotal * tierPct) / 100)
  const finalTotal = Math.max(0, subtotal - tierAmount)

  const selectedSavedAddress = savedAddresses.find((x) => x.id === savedAddressId) || null
  const hasSavedAddress = savedAddresses.length > 0

  function openNotice(msg) {
    setSuccessId(null)
    setSuccessSummary(null)
    setNotice(msg)
  }

  function validateForm() {
    const e = {}
    if (!name.trim()) e.name = 'Vui lòng nhập họ tên.'
    const phoneVal = phone.replace(/\s/g, '')
    if (!phoneVal || phoneVal.length < 10)
      e.phone = 'Số điện thoại hợp lệ (ít nhất 10 số).'
    if (!address.trim()) e.address = 'Vui lòng nhập địa chỉ giao hàng.'
    setErr(e)
    return Object.keys(e).length === 0
  }

  function buildOrderPayload(order) {
    return {
      name: order.name,
      phone: order.phone,
      email: order.email,
      address: order.address,
      total: order.total,
      payment: order.payment,
      items: order.items,
      user_id: user?.id || null,
      tier: order.discount?.tier || 'bronze',
      tierAmount: order.discount?.tierAmount || 0,
      promoCode: order.discount?.promoCode || '',
      promoAmount: order.discount?.promoAmount || 0,
      note: order.note || '',
    }
  }

  async function completeOrder(order) {
    const products = getProductsFromStorage()
    const stockCheck = validateStock(order.items, products)
    if (!stockCheck.valid) {
      openNotice(stockCheck.message)
      setSubmitting(false)
      return
    }
    const payload = buildOrderPayload(order)
    try {
      const result = await postOrderWithRetry(payload, 1)
      setNotice(null)
      if (result.id) order.id = `ord${result.id}`
      saveOrder(order)
      deductStock(order.items, products)
      if (buyNowOrderRef.current) {
        buyNowOrderRef.current = false
      } else {
        setCart([])
      }
      setCartState([])
      setSuccessId(order.id || '')
      setSuccessSummary({
        name: order.name,
        phone: order.phone,
        email: order.email,
        address: order.address,
        payment: paymentLabel(order.payment),
        total: order.total,
        itemCount: order.items.reduce((s, it) => s + (it.quantity || 1), 0),
        items: order.items,
      })
    } catch (e) {
      openNotice(e?.message || 'Không thể lưu đơn hàng. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  async function startVnpayOrder(order) {
    const products = getProductsFromStorage()
    const stockCheck = validateStock(order.items, products)
    if (!stockCheck.valid) {
      openNotice(stockCheck.message)
      setSubmitting(false)
      return
    }
    const payload = buildOrderPayload(order)
    try {
      const result = await postOrderWithRetry(payload, 1)
      setNotice(null)
      let url = result.vnpayUrl
      const oid = result.id
      if (!url && oid != null) {
        const res = await fetch(
          apiUrl(`/api/payment/vnpay/create?orderId=${encodeURIComponent(oid)}`)
        )
        const text = await res.text()
        let data = {}
        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          throw new Error('Phản hồi máy chủ không hợp lệ khi tạo link VNPay.')
        }
        if (data.vnpayUrl) url = data.vnpayUrl
      }
      if (!url) {
        throw new Error(
          'Không tạo được liên kết VNPay. Kiểm tra file .env backend (VNP_TMN_CODE, VNP_HASH_SECRET, VNP_URL).'
        )
      }
      try {
        sessionStorage.setItem(
          'petspa_vnpay_redirect',
          JSON.stringify({ ts: Date.now(), buyNow: buyNowOrderRef.current })
        )
      } catch (_e) {
        /* ignore */
      }
      try {
        sessionStorage.setItem(
          'petspa_vnpay_order_snapshot',
          JSON.stringify({
            orderId: Number(oid),
            name: order.name,
            phone: order.phone,
            email: order.email,
            address: order.address,
            payment: 'vnpay',
            total: order.total,
            items: order.items,
          })
        )
      } catch (_e) {
        /* ignore */
      }
      window.location.href = url
    } catch (e) {
      openNotice(e?.message || 'Không thể khởi tạo thanh toán VNPay.')
      setSubmitting(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setNotice(null)
    setSuccessId(null)
    setSuccessSummary(null)
    if (!cartState.length) {
      openNotice('Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.')
      return
    }
    if (!validateForm()) return
    setSubmitting(true)

    let orderEmail = email.trim()
    if (user?.email) orderEmail = user.email.trim().toLowerCase()
    if (!orderEmail) {
      orderEmail = buildGuestEmail(phone)
    }

    const order = {
      items: cartState.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity || 1,
        image: i.image,
        variantKey: i.variantKey,
      })),
      total: finalTotal,
      subtotal,
      discount: {
        tierAmount,
        tier,
        promoCode: '',
        promoAmount: 0,
      },
      name: name.trim(),
      phone: phone.trim(),
      email: orderEmail,
      address: address.trim(),
      payment,
      carrier: 'PetCare Express',
      carrierPhone: '1900 1234',
    }

    if (payment === 'vnpay') {
      await startVnpayOrder(order)
      return
    }

    if (['momo', 'zalopay', 'card'].includes(payment)) {
      const gatewayName = PAYMENT_LABELS[payment] || payment
      setPayModal({ phase: 'loading', gatewayName })
      window.setTimeout(() => {
        setPayModal({ phase: 'ok' })
        window.setTimeout(() => {
          setPayModal(null)
          completeOrder(order)
        }, 1200)
      }, 2200)
    } else {
      completeOrder(order)
    }
  }

  const empty = !cartState.length

  return (
    <main className="page-main checkout-page">
      <div className="checkout-layout">
        <header className="checkout-header">
          <Link to="/cart" className="checkout-header__back">
            Giỏ hàng
          </Link>
          <h1 className="checkout-header__title">Thanh toán</h1>
          <div className="checkout-progress">
            <span className="checkout-progress__dot checkout-progress__dot--done" />
            <span className="checkout-progress__line checkout-progress__line--active" />
            <span className="checkout-progress__dot checkout-progress__dot--active" />
            <span className="checkout-progress__line" />
            <span className="checkout-progress__dot" />
          </div>
        </header>

        <div className="checkout-body">
          <div className="container checkout-container">
            {empty ? (
              <div className="checkout-empty" id="checkoutEmpty">
                <h2 className="checkout-empty__title">Giỏ hàng trống</h2>
                <p className="checkout-empty__text">
                  Chưa có sản phẩm nào. Khám phá cửa hàng để chọn đồ cho thú cưng
                  nhé!
                </p>
                <Link to="/shop" className="checkout-empty__btn">
                  Mua sắm ngay
                </Link>
              </div>
            ) : (
              <div className="checkout-grid" id="checkoutWrap">
                <form className="checkout-form" id="checkoutForm" onSubmit={onSubmit}>
                  <section className="checkout-block checkout-block--shipping">
                    <h2 className="checkout-block__title">Thông tin giao hàng</h2>
                    <div className="checkout-block__body">
                      <div className="checkout-field checkout-field--half">
                        <label htmlFor="checkoutName">
                          Họ tên <span className="required">*</span>
                        </label>
                        <input
                          id="checkoutName"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value)
                            setErr((x) => ({ ...x, name: '' }))
                          }}
                          className={err.name ? 'error' : ''}
                          placeholder="Nguyễn Văn A"
                        />
                        <span className="form-error">{err.name}</span>
                      </div>
                      <div className="checkout-field checkout-field--half">
                        <label htmlFor="checkoutPhone">
                          Số điện thoại <span className="required">*</span>
                        </label>
                        <input
                          id="checkoutPhone"
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value)
                            setErr((x) => ({ ...x, phone: '' }))
                          }}
                          className={err.phone ? 'error' : ''}
                          placeholder="0900 123 456"
                        />
                        <span className="form-error">{err.phone}</span>
                      </div>
                      <div className="checkout-field">
                        <label htmlFor="checkoutAddress">
                          Địa chỉ <span className="required">*</span>
                        </label>
                        <div className="checkout-address-mode">
                          <button
                            type="button"
                            className={`checkout-address-mode__btn${addressMode === 'saved' ? ' is-active' : ''}`}
                            onClick={() => {
                              if (!hasSavedAddress) return
                              const first = selectedSavedAddress || savedAddresses[0]
                              setAddressMode('saved')
                              setSavedAddressId(first?.id || '')
                              setAddress(first?.address || '')
                              setErr((x) => ({ ...x, address: '' }))
                            }}
                            disabled={!hasSavedAddress}
                          >
                            Lấy địa chỉ có sẵn
                          </button>
                          <button
                            type="button"
                            className={`checkout-address-mode__btn${addressMode === 'new' ? ' is-active' : ''}`}
                            onClick={() => {
                              setAddressMode('new')
                              setAddress(newAddress)
                              setErr((x) => ({ ...x, address: '' }))
                            }}
                          >
                            Địa chỉ mới
                          </button>
                        </div>
                        {addressMode === 'saved' && hasSavedAddress ? (
                          <div className="checkout-address-picker">
                            <select
                              className="checkout-address-picker__select"
                              value={savedAddressId}
                              onChange={(e) => {
                                const nextId = e.target.value
                                setSavedAddressId(nextId)
                                const picked = savedAddresses.find((x) => x.id === nextId)
                                setAddress(picked?.address || '')
                                setErr((x) => ({ ...x, address: '' }))
                              }}
                              aria-label="Chọn địa chỉ đã lưu"
                            >
                              {savedAddresses.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.label}
                                  {a.phone ? ` • ${a.phone}` : ''}
                                </option>
                              ))}
                            </select>
                            <div className="checkout-address-saved">
                              {selectedSavedAddress?.address || ''}
                            </div>
                          </div>
                        ) : (
                          <textarea
                            id="checkoutAddress"
                            rows={2}
                            value={newAddress}
                            onChange={(e) => {
                              const val = e.target.value
                              setNewAddress(val)
                              setAddress(val)
                              setErr((x) => ({ ...x, address: '' }))
                            }}
                            className={err.address ? 'error' : ''}
                            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                          />
                        )}
                        <span className="form-error">{err.address}</span>
                      </div>
                    </div>
                  </section>

                  <section className="checkout-block">
                    <h2 className="checkout-block__title">Phương thức thanh toán</h2>
                    <div className="checkout-block__body">
                      <div className="checkout-payment__group">
                        <label className="checkout-payment-opt">
                          <input
                            type="radio"
                            name="payment"
                            value="cod"
                            checked={payment === 'cod'}
                            onChange={() => setPayment('cod')}
                          />
                          <span className="checkout-payment-opt__box">
                            <span className="checkout-payment-opt__name">COD</span>
                            <span className="checkout-payment-opt__hint">
                              Thanh toán khi nhận
                            </span>
                          </span>
                        </label>
                        <label className="checkout-payment-opt">
                          <input
                            type="radio"
                            name="payment"
                            value="vnpay"
                            checked={payment === 'vnpay'}
                            onChange={() => setPayment('vnpay')}
                          />
                          <span className="checkout-payment-opt__box">
                            <span className="checkout-payment-opt__name">VNPay</span>
                            <span className="checkout-payment-opt__hint">
                              Thanh toán online qua cổng VNPay
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </section>

                  <div className="checkout-form__actions">
                    <Link to="/cart" className="checkout-btn checkout-btn--ghost">
                      Quay lại
                    </Link>
                  </div>
                </form>

                <aside className="checkout-order" id="checkoutOrderSummary">
                  <div className="checkout-order__header">
                    <h3>Đơn hàng</h3>
                    <span className="checkout-order__count" id="checkoutItemCount">
                      {cartState.length} sp
                    </span>
                  </div>
                  <div className="checkout-order__list" id="checkoutOrderList">
                    {cartState.map((item, idx) => {
                      const st = item.price * (item.quantity || 1)
                      return (
                        <div
                          key={`${item.id}-${item.variantKey ?? ''}-${idx}`}
                          className="checkout-summary__item"
                        >
                          <ProductImage
                            image={item.image}
                            alt={item.name}
                            className="checkout-summary__item-img"
                          />
                          <div className="checkout-summary__item-info">
                            <div className="checkout-summary__item-name">
                              {item.name}
                            </div>
                            <div className="checkout-summary__item-qty">
                              x{item.quantity || 1}
                            </div>
                          </div>
                          <span className="checkout-summary__item-price">
                            {formatPrice(st)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="checkout-order__tier-box">
                    <p className="checkout-order__promo-hint" id="checkoutTierHint">
                      {user && tier !== 'bronze' ? (
                        <>
                          Bạn đang được giảm {tierPct}% (hạng{' '}
                          {TIER_LABELS[tier] || tier})
                        </>
                      ) : user ? (
                        <>
                          Nâng hạng để nhận ưu đãi: Silver 5%, Gold 10%, VIP 15%
                        </>
                      ) : (
                        <>Đăng nhập để nhận giảm giá khách quen</>
                      )}
                    </p>
                  </div>
                  <div className="checkout-order__totals">
                    <div className="checkout-order__row checkout-order__row--sub">
                      <span>Tạm tính</span>
                      <span id="checkoutSubtotal">{formatPrice(subtotal)}</span>
                    </div>
                    <div
                      className="checkout-order__row checkout-order__row--discount"
                      id="checkoutTierRow"
                      style={{ display: tierAmount > 0 ? 'flex' : 'none' }}
                    >
                      <span>Khách quen</span>
                      <span id="checkoutTierDiscount">
                        {tierAmount > 0
                          ? `- ${formatPrice(tierAmount)} (${TIER_LABELS[tier] || tier})`
                          : '-0đ'}
                      </span>
                    </div>
                  </div>
                  <div className="checkout-order__total">
                    <span>Tổng thanh toán</span>
                    <span id="checkoutTotal">{formatPrice(finalTotal)}</span>
                  </div>
                  <button
                    type="submit"
                    form="checkoutForm"
                    className="checkout-btn checkout-btn--primary checkout-order__pay-btn"
                    disabled={submitting}
                  >
                    {submitting ? 'Đang xử lý…' : 'Thanh toán đơn hàng'}
                  </button>
                  <p className="checkout-order__secure">Thanh toán an toàn</p>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>

      {payModal ? (
        <div
          className="payment-modal-overlay payment-modal-overlay--visible"
          aria-hidden="false"
        >
          <div className="payment-modal" role="dialog">
            <div className="payment-modal__body">
              <div
                className={`payment-modal__spinner${payModal.phase === 'ok' ? ' payment-modal__spinner--hidden' : ''}`}
              >
                <span className="payment-modal__spinner-text">Đang xử lý…</span>
              </div>
              <div
                className={`payment-modal__success${payModal.phase === 'ok' ? ' payment-modal__success--visible' : ''}`}
                aria-hidden={payModal.phase !== 'ok'}
              >
                <span className="payment-modal__ok-text">Xong</span>
              </div>
              <h3 className="payment-modal__title">
                {payModal.phase === 'ok'
                  ? 'Thanh toán thành công!'
                  : 'Đang chuyển đến cổng thanh toán...'}
              </h3>
              <p className="payment-modal__msg">
                {payModal.phase === 'ok'
                  ? 'Giao dịch đã được xử lý. Đơn hàng của bạn đang được xác nhận.'
                  : `Bạn sẽ được chuyển đến ${payModal.gatewayName} để hoàn tất thanh toán.`}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div
          className="checkout-notice-overlay checkout-notice-overlay--visible"
          aria-hidden="false"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNotice(null)
          }}
        >
          <div className="checkout-notice-modal" role="dialog">
            <h2 className="checkout-notice-modal__title">Thông báo</h2>
            <p className="checkout-notice-modal__msg">{notice}</p>
            <button
              type="button"
              className="btn btn--primary checkout-notice-modal__btn"
              onClick={() => setNotice(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      ) : null}

      {successId ? (
        <div
          className="order-success-overlay order-success-overlay--visible"
          aria-hidden="false"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSuccessId(null)
              setSuccessSummary(null)
            }
          }}
        >
          <div className="order-success-modal" role="dialog">
            <h2 className="order-success-modal__title">Đặt hàng thành công!</h2>
            <p className="order-success-modal__order-id">
              Mã đơn hàng: <strong>{successId}</strong>
            </p>
            <p className="order-success-modal__msg">
              Chúng tôi sẽ liên hệ xác nhận và giao hàng cho bạn trong thời gian
              sớm nhất.
            </p>
            {successSummary ? (
              <div className="order-success-modal__summary">
                <h3 className="order-success-modal__summary-title">
                  Thông tin đơn hàng
                </h3>
                <div className="order-success-modal__summary-layout">
                  <dl className="order-success-modal__summary-grid">
                    <div>
                      <dt>Người nhận</dt>
                      <dd>{successSummary.name}</dd>
                    </div>
                    <div>
                      <dt>Số điện thoại</dt>
                      <dd>{successSummary.phone}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{successSummary.email}</dd>
                    </div>
                    <div className="order-success-modal__summary-wide">
                      <dt>Địa chỉ</dt>
                      <dd>{successSummary.address}</dd>
                    </div>
                    <div>
                      <dt>Thanh toán</dt>
                      <dd>{successSummary.payment}</dd>
                    </div>
                    <div>
                      <dt>Tổng món</dt>
                      <dd>{successSummary.itemCount}</dd>
                    </div>
                    <div>
                      <dt>Tổng tiền</dt>
                      <dd>{formatPrice(successSummary.total || 0)}</dd>
                    </div>
                  </dl>
                  <div className="order-success-modal__items">
                    <p className="order-success-modal__items-title">Sản phẩm</p>
                    <ul>
                      {successSummary.items.slice(0, 4).map((it, idx) => (
                        <li key={`${it.id}-${idx}`}>
                          <div className="order-success-modal__item-main">
                            <ProductImage
                              image={it.image}
                              alt={it.name}
                              className="order-success-modal__item-img"
                            />
                            <div className="order-success-modal__item-meta">
                              <span className="order-success-modal__item-name">{it.name}</span>
                              <span className="order-success-modal__item-price">
                                {formatPrice((it.price || 0) * (it.quantity || 1))}
                              </span>
                            </div>
                          </div>
                          <span className="order-success-modal__item-qty">
                            x{it.quantity || 1}
                          </span>
                        </li>
                      ))}
                      {successSummary.items.length > 4 ? (
                        <li className="order-success-modal__items-more">
                          + {successSummary.items.length - 4} sản phẩm khác
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="order-success-modal__actions">
              <Link to="/" className="btn btn--primary order-success-modal__btn">
                Về trang chủ
              </Link>
              <Link
                to="/user"
                className="btn btn--secondary order-success-modal__btn"
              >
                Xem đơn hàng
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

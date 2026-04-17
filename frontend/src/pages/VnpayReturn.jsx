/**
 * Callback sau VNPay: đọc query status/orderId từ redirect, hiển thị kết quả + gợi ý bước tiếp.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchProducts } from '../api/products.js'
import { formatPrice } from '../utils/format.js'
import ProductImage from '../components/ProductImage.jsx'
import { setCart } from '../utils/cartStorage.js'

const PRODUCTS_KEY = 'petspa_products'
const REDIRECT_KEY = 'petspa_vnpay_redirect'
const SNAPSHOT_KEY = 'petspa_vnpay_order_snapshot'

const PAYMENT_LABELS = {
  vnpay: 'VNPay',
  momo: 'Ví MoMo',
  zalopay: 'ZaloPay',
  card: 'Thẻ tín dụng',
}

function paymentLabel(payment) {
  if (payment === 'transfer') return 'Chuyển khoản'
  if (payment === 'cod') return 'Thanh toán khi nhận hàng'
  return PAYMENT_LABELS[payment] || String(payment || '')
}

function readOrderSnapshot(orderIdParam) {
  if (orderIdParam == null || String(orderIdParam).trim() === '') return null
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (String(s.orderId) !== String(orderIdParam)) return null
    return s
  } catch {
    return null
  }
}

function formatOrderIdDisplay(orderId) {
  const id = String(orderId || '').trim()
  if (!id) return ''
  if (/^ord/i.test(id)) return id
  return `ord${id}`
}

export default function VnpayReturn() {
  const [params] = useSearchParams()
  const status = params.get('status')
  const orderId = params.get('orderId')
  const msg = params.get('msg')
  const [synced, setSynced] = useState(false)

  const ok = status === 'success' && orderId

  const [snapshot] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search)
      const oid = p.get('orderId')
      return oid ? readOrderSnapshot(oid) : null
    } catch {
      return null
    }
  })

  const orderSummary = useMemo(() => {
    if (!snapshot || !Array.isArray(snapshot.items)) return null
    const items = snapshot.items
    return {
      name: snapshot.name,
      phone: snapshot.phone,
      email: snapshot.email,
      address: snapshot.address,
      payment: paymentLabel(snapshot.payment || 'vnpay'),
      total: snapshot.total,
      itemCount: items.reduce((s, it) => s + (Number(it.quantity) || 1), 0),
      items,
    }
  }, [snapshot])

  useEffect(() => {
    if (!ok) return
    let cancelled = false
    ;(async () => {
      try {
        const rows = await fetchProducts()
        if (!cancelled) {
          try {
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(rows))
          } catch (_e) {
            /* ignore */
          }
        }
      } catch (_e) {
        /* ignore */
      }
      try {
        setCart([])
        sessionStorage.removeItem(REDIRECT_KEY)
        try {
          sessionStorage.removeItem(SNAPSHOT_KEY)
        } catch (_e2) {
          /* ignore */
        }
      } catch (_e) {
        /* ignore */
      }
      if (!cancelled) setSynced(true)
    })()
    return () => {
      cancelled = true
    }
  }, [ok])

  const orderIdLabel = formatOrderIdDisplay(orderId)
  const cartFailHref = useMemo(() => {
    const q = new URLSearchParams()
    q.set('payment', 'failed')
    if (orderId) q.set('orderId', String(orderId))
    if (msg) q.set('msg', String(msg))
    return `/cart?${q.toString()}`
  }, [orderId, msg])

  return (
    <main className="page-main vnpay-return-page">
      <div
        className="order-success-overlay order-success-overlay--visible"
        aria-hidden="false"
      >
        <div className="order-success-modal" role="dialog" aria-labelledby="vnpay-return-heading">
          {ok ? (
            <>
              <h2 id="vnpay-return-heading" className="order-success-modal__title">
                Đặt hàng thành công!
              </h2>
              <p className="order-success-modal__order-id">
                Mã đơn hàng: <strong>{orderIdLabel}</strong>
              </p>
              <p className="order-success-modal__msg">
                Chúng tôi sẽ liên hệ xác nhận và giao hàng cho bạn trong thời gian sớm nhất.
              </p>
              {orderSummary ? (
                <div className="order-success-modal__summary">
                  <h3 className="order-success-modal__summary-title">
                    Thông tin đơn hàng
                  </h3>
                  <div className="order-success-modal__summary-layout">
                    <dl className="order-success-modal__summary-grid">
                      <div>
                        <dt>Người nhận</dt>
                        <dd>{orderSummary.name}</dd>
                      </div>
                      <div>
                        <dt>Số điện thoại</dt>
                        <dd>{orderSummary.phone}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{orderSummary.email}</dd>
                      </div>
                      <div className="order-success-modal__summary-wide">
                        <dt>Địa chỉ</dt>
                        <dd>{orderSummary.address}</dd>
                      </div>
                      <div>
                        <dt>Thanh toán</dt>
                        <dd>{orderSummary.payment}</dd>
                      </div>
                      <div>
                        <dt>Tổng món</dt>
                        <dd>{orderSummary.itemCount}</dd>
                      </div>
                      <div>
                        <dt>Tổng tiền</dt>
                        <dd>{formatPrice(orderSummary.total || 0)}</dd>
                      </div>
                    </dl>
                    <div className="order-success-modal__items">
                      <p className="order-success-modal__items-title">Sản phẩm</p>
                      <ul>
                        {orderSummary.items.slice(0, 4).map((it, idx) => (
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
                        {orderSummary.items.length > 4 ? (
                          <li className="order-success-modal__items-more">
                            + {orderSummary.items.length - 4} sản phẩm khác
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="order-success-modal__sync-hint" aria-live="polite">
                  {synced ? 'Đã đồng bộ giỏ hàng.' : 'Đang cập nhật dữ liệu…'}
                </p>
              )}
            </>
          ) : (
            <>
              <h2
                id="vnpay-return-heading"
                className="order-success-modal__title order-success-modal__title--fail"
              >
                Thanh toán chưa hoàn tất
              </h2>
              {orderId ? (
                <p className="order-success-modal__order-id">
                  Mã đơn tham chiếu: <strong>#{orderId}</strong>
                </p>
              ) : null}
              <div className="order-success-modal__summary">
                <h3 className="order-success-modal__summary-title">
                  Thông tin đơn hàng
                </h3>
                <div className="order-success-modal__summary-layout">
                  <dl className="order-success-modal__summary-grid">
                    <div>
                      <dt>Người nhận</dt>
                      <dd>{orderSummary?.name || '—'}</dd>
                    </div>
                    <div>
                      <dt>Số điện thoại</dt>
                      <dd>{orderSummary?.phone || '—'}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{orderSummary?.email || '—'}</dd>
                    </div>
                    <div className="order-success-modal__summary-wide">
                      <dt>Địa chỉ</dt>
                      <dd>{orderSummary?.address || '—'}</dd>
                    </div>
                    <div>
                      <dt>Thanh toán</dt>
                      <dd>{orderSummary?.payment || 'VNPay'}</dd>
                    </div>
                    <div>
                      <dt>Tổng món</dt>
                      <dd>{orderSummary?.itemCount ?? 0}</dd>
                    </div>
                    <div>
                      <dt>Tổng tiền</dt>
                      <dd>{formatPrice(orderSummary?.total || 0)}</dd>
                    </div>
                    <div className="order-success-modal__summary-wide">
                      <dt>Chi tiết</dt>
                      <dd>
                        {msg ||
                          'Giao dịch bị hủy hoặc chưa thành công. Bạn có thể thử lại từ giỏ hàng.'}
                      </dd>
                    </div>
                  </dl>
                  <div className="order-success-modal__items">
                    <p className="order-success-modal__items-title">Sản phẩm</p>
                    <ul>
                      {orderSummary?.items?.length ? (
                        orderSummary.items.slice(0, 4).map((it, idx) => (
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
                        ))
                      ) : (
                        <li className="order-success-modal__items-more">
                          Chưa ghi nhận sản phẩm do giao dịch chưa hoàn tất.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              <p className="order-success-modal__msg">
                Đơn hàng chưa được ghi nhận mua thành công. Bạn có thể quay lại giỏ hàng để thanh
                toán lại.
              </p>
            </>
          )}
          <div className="order-success-modal__actions">
            {ok ? (
              <>
                <Link to="/" className="btn btn--primary order-success-modal__btn">
                  Về trang chủ
                </Link>
                <Link to="/user" className="btn btn--secondary order-success-modal__btn">
                  Xem đơn hàng
                </Link>
              </>
            ) : (
              <>
                <Link to={cartFailHref} className="btn btn--primary order-success-modal__btn">
                  Về giỏ hàng
                </Link>
                <Link to="/" className="btn btn--secondary order-success-modal__btn">
                  Về trang chủ
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

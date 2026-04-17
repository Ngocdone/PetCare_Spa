/**
 * Quản lý đơn hàng: danh sách, chi tiết dòng, đổi trạng thái (patchOrderStatus).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAdminData, patchOrderStatus } from '../../api/adminApi.js'
import { formatPrice } from '../../utils/format.js'
import { getProductImageSrc } from '../../utils/assets.js'

const STATUS_FILTER = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'awaiting_payment', label: 'Chờ thanh toán VNPay' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
]

function localDateStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatOrderDate(iso) {
  if (!iso) return { line1: '—', line2: '' }
  const s = String(iso).replace('T', ' ')
  const line1 = s.slice(0, 10)
  const line2 = s.length > 10 ? s.slice(11, 16) : ''
  return { line1, line2 }
}

function formatOrderDateTimeFull(iso) {
  if (!iso) return '—'
  return String(iso).replace('T', ' ').slice(0, 19)
}

function paymentLabel(payment) {
  if (payment === 'transfer') return 'Chuyển khoản'
  if (payment === 'card') return 'Thẻ'
  if (payment === 'vnpay') return 'VNPay'
  if (payment === 'momo') return 'MoMo'
  if (payment === 'zalopay') return 'ZaloPay'
  return 'COD (thanh toán khi nhận)'
}

const STATUS_LABEL = {
  pending: 'Chờ xử lý',
  awaiting_payment: 'Chờ thanh toán VNPay',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

function lineTotal(item) {
  const q = Number(item.quantity) || 0
  const p = Number(item.price) || 0
  return q * p
}

function paymentChannelLabel(payment) {
  if (payment === 'transfer') return 'Banking'
  if (payment === 'card') return 'Card'
  if (payment === 'vnpay' || payment === 'momo' || payment === 'zalopay') return 'E-Wallet'
  return 'Online'
}

function nextStatusByTick(status) {
  const s = String(status || 'pending')
  if (s === 'awaiting_payment') return 'pending'
  if (s === 'pending') return 'confirmed'
  if (s === 'confirmed') return 'shipping'
  if (s === 'shipping') return 'completed'
  return s
}

/** Trạng thái thanh toán — suy ra từ hình thức + trạng thái đơn (không cột DB riêng). */
function paymentSettlementStatus(o) {
  const pay = String(o.payment || 'cod')
  const st = String(o.status || 'pending')
  if (st === 'cancelled') {
    return { key: 'void', label: 'Đã hủy đơn', variant: 'void' }
  }
  const online = ['vnpay', 'momo', 'zalopay', 'card', 'transfer'].includes(pay)
  if (online) {
    if (st === 'awaiting_payment') {
      return { key: 'unpaid', label: 'Chưa thanh toán', variant: 'unpaid' }
    }
    return { key: 'paid', label: 'Đã thanh toán', variant: 'paid' }
  }
  if (st === 'completed') {
    return { key: 'cod_done', label: 'Đã thu (COD)', variant: 'paid' }
  }
  return { key: 'cod_later', label: 'Khi nhận hàng', variant: 'cod' }
}

export default function AdminOrders() {
  const PAGE_SIZE = 10
  const [orders, setOrders] = useState([])
  const [err, setErr] = useState(null)
  const [msg, setMsg] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [detailOrder, setDetailOrder] = useState(null)
  const [collapsedSummary, setCollapsedSummary] = useState({
    today: true,
    pending: true,
    completed: true,
    cancelled: true,
  })

  const load = useCallback(async () => {
    setErr(null)
    try {
      const d = await fetchAdminData()
      setOrders(d.orders || [])
    } catch (e) {
      setErr(e.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!detailOrder) return
    const onKey = (e) => {
      if (e.key === 'Escape') setDetailOrder(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailOrder])

  const today = localDateStr()
  const summary = useMemo(() => {
    const todayOrders = orders.filter(
      (o) => String(o.createdAt || '').slice(0, 10) === today
    )
    const revenueToday = todayOrders.reduce((s, o) => s + Number(o.total || 0), 0)
    const pending = orders.filter((o) => o.status === 'pending').length
    const completed = orders.filter((o) => o.status === 'completed').length
    const cancelled = orders.filter((o) => o.status === 'cancelled').length
    const shipping = orders.filter((o) => o.status === 'shipping').length
    return {
      todayN: todayOrders.length,
      revenueToday,
      pending,
      completed,
      cancelled,
      shipping,
      totalN: orders.length,
    }
  }, [orders, today])

  function toggleSummaryCard(key) {
    setCollapsedSummary((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function exportCsv() {
    const rows = [
      [
        'id',
        'khach_hang',
        'thoi_gian',
        'kenh',
        'gia_tri',
        'thanh_toan',
        'trang_thai_don',
      ],
      ...sortedFiltered.map((o) => [
        o.id,
        o.name || '',
        formatOrderDateTimeFull(o.createdAt),
        paymentChannelLabel(o.payment),
        Number(o.total || 0),
        paymentSettlementStatus(o).label,
        STATUS_LABEL[o.status] || o.status || '',
      ]),
    ]
    const csv = rows
      .map((r) =>
        r
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `don-hang-${today}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const sortedFiltered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = [...orders]
    list.sort((a, b) => Number(b.id) - Number(a.id))
    if (statusFilter !== 'all') {
      list = list.filter((o) => (o.status || 'pending') === statusFilter)
    }
    if (q) {
      list = list.filter((o) => {
        const idStr = String(o.id ?? '')
        const name = String(o.name || '').toLowerCase()
        const phone = String(o.phone || '').replace(/\s/g, '')
        const qDigits = q.replace(/\D/g, '')
        return (
          idStr.includes(q) ||
          name.includes(q) ||
          (qDigits && phone.includes(qDigits)) ||
          phone.includes(q.replace(/\s/g, ''))
        )
      })
    }
    return list
  }, [orders, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedFiltered.slice(start, start + PAGE_SIZE)
  }, [sortedFiltered, currentPage, PAGE_SIZE])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const detailPaymentStatus = useMemo(
    () => (detailOrder ? paymentSettlementStatus(detailOrder) : null),
    [detailOrder]
  )

  async function onStatusChange(id, status) {
    setMsg(null)
    setBusyId(id)
    const prevOrders = orders
    setOrders((prev) =>
      prev.map((o) =>
        String(o.id) === String(id)
          ? {
              ...o,
              status,
            }
          : o
      )
    )
    try {
      await patchOrderStatus(id, status)
      setMsg('Đã cập nhật trạng thái đơn hàng.')
    } catch (e) {
      setOrders(prevOrders)
      setErr(e.message)
    } finally {
      setBusyId(null)
      await load()
    }
  }

  return (
    <div className="admin-orders">
      {err ? <div className="admin-alert admin-alert--err">{err}</div> : null}
      {msg ? <div className="admin-alert admin-alert--ok">{msg}</div> : null}

      <section className="section">
        <div className="section__header">
          <h2 className="section__title">Tổng quan đơn hàng hôm nay</h2>
          <span className="section__hint">Số lượng theo từng trạng thái</span>
        </div>
        <div className="grid grid--stats">
          <div className={`card card--stat${collapsedSummary.today ? ' is-collapsed' : ''}`}>
            <div className="card__header">
              <span className="card__label">Đơn hôm nay</span>
              <div className="card__header-actions">
                <span className="badge badge--info">Theo ngày tạo</span>
                <button
                  type="button"
                  className="card__collapse-btn"
                  aria-expanded={!collapsedSummary.today}
                  onClick={() => toggleSummaryCard('today')}
                  title={collapsedSummary.today ? 'Mở thông tin' : 'Thu gọn'}
                >
                  {collapsedSummary.today ? '▾' : '▴'}
                </button>
              </div>
            </div>
            <div className="card__value">{summary.todayN} đơn</div>
            {!collapsedSummary.today ? (
              <div className="card__meta">
                Doanh thu tạm tính: {formatPrice(summary.revenueToday)}
              </div>
            ) : null}
          </div>
          <div className={`card card--stat${collapsedSummary.pending ? ' is-collapsed' : ''}`}>
            <div className="card__header">
              <span className="card__label">Chờ xử lý</span>
              <div className="card__header-actions">
                <span className="badge badge--warning">Cần xác nhận</span>
                <button
                  type="button"
                  className="card__collapse-btn"
                  aria-expanded={!collapsedSummary.pending}
                  onClick={() => toggleSummaryCard('pending')}
                  title={collapsedSummary.pending ? 'Mở thông tin' : 'Thu gọn'}
                >
                  {collapsedSummary.pending ? '▾' : '▴'}
                </button>
              </div>
            </div>
            <div className="card__value">{summary.pending}</div>
            {!collapsedSummary.pending ? (
              <div className="card__meta">Trên tổng {summary.totalN} đơn</div>
            ) : null}
          </div>
          <div className={`card card--stat${collapsedSummary.completed ? ' is-collapsed' : ''}`}>
            <div className="card__header">
              <div className="card__header-actions">
                <span className="card__label">Đã hoàn thành</span>
                <span className="badge badge--success">Đã thanh toán</span>
                <button
                  type="button"
                  className="card__collapse-btn"
                  aria-expanded={!collapsedSummary.completed}
                  onClick={() => toggleSummaryCard('completed')}
                  title={collapsedSummary.completed ? 'Mở thông tin' : 'Thu gọn'}
                >
                  {collapsedSummary.completed ? '▾' : '▴'}
                </button>
              </div>
            </div>
              <div className="card__value">{summary.completed} đơn</div>
              {!collapsedSummary.completed ? (
              <div className="card__meta">Đã giao thành công</div>
              ) : null}
          </div>
          <div className={`card card--stat${collapsedSummary.cancelled ? ' is-collapsed' : ''}`}>
            <div className="card__header">
              <div className="card__header-actions">
                <span className="card__label">Đã hủy</span>
                <span className="badge badge--purple">Theo yêu cầu</span>
                <button
                  type="button"
                  className="card__collapse-btn"
                  aria-expanded={!collapsedSummary.cancelled}
                  onClick={() => toggleSummaryCard('cancelled')}
                  title={collapsedSummary.cancelled ? 'Mở thông tin' : 'Thu gọn'}
                >
                  {collapsedSummary.cancelled ? '▾' : '▴'}
                </button>
              </div>
            </div>
              <div className="card__value">{summary.cancelled} đơn</div>
              {!collapsedSummary.cancelled ? (
              <div className="card__meta">Đơn đã hủy</div>
              ) : null}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card card--table admin-orders__card">
          <div className="card__header card__header--between admin-orders__card-head">
            <div>
              <h2 className="card__title">Danh sách đơn hàng</h2>
            </div>
            <div className="card__header-actions">
              <button type="button" className="btn btn--ghost btn--sm" onClick={exportCsv}>
                Xuất CSV
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => load()}
                title="Tải lại danh sách"
              >
                Làm mới
              </button>
            </div>
          </div>

          <div className="admin-orders__toolbar">
            <label className="admin-orders__search">
              <input
                type="search"
                className="admin-orders__search-input"
                placeholder="Tìm theo mã đơn, tên khách, SĐT…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
            </label>
            <div className="admin-orders__chips" role="group" aria-label="Lọc trạng thái">
              {STATUS_FILTER.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={
                    statusFilter === f.value
                      ? 'admin-orders__chip admin-orders__chip--active'
                      : 'admin-orders__chip'
                  }
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrapper admin-orders__table-wrap">
            <table className="table table--orders">
              <thead>
                <tr>
                  <th className="admin-orders__th-id">Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Thời gian</th>
                  <th>Kênh</th>
                  <th className="admin-orders__th-num">Tổng tiền</th>
                  <th className="admin-orders__th-pay">Thanh toán</th>
                  <th>Trạng thái đơn</th>
                  <th className="admin-orders__th-actions"> </th>
                </tr>
              </thead>
              <tbody>
                {pagedOrders.map((o) => {
                  const st = o.status || 'pending'
                  const paySt = paymentSettlementStatus(o)
                  const { line1, line2 } = formatOrderDate(o.createdAt)
                  return (
                    <tr key={o.id}>
                      <td>
                        <span className="admin-orders__id">#{o.id}</span>
                      </td>
                      <td>
                        <span className="admin-orders__name">
                          {o.name || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-orders__datetime">
                          <span className="admin-orders__time">{line2 || '—:—'}</span>
                          <span className="admin-orders__date">{line1}</span>
                        </div>
                      </td>
                      <td>
                        <span className="admin-orders__channel">{paymentChannelLabel(o.payment)}</span>
                      </td>
                      <td className="admin-orders__td-num">
                        {formatPrice(o.total ?? 0)}
                      </td>
                      <td>
                        <span
                          className={`admin-orders__pay-pill admin-orders__pay-pill--${paySt.variant}`}
                          title="Trạng thái thanh toán (suy ra từ kênh + trạng thái đơn)"
                        >
                          {paySt.label}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-orders__status-pill admin-orders__status-pill--${st}`}>
                          {STATUS_LABEL[st] || st}
                        </span>
                      </td>
                      <td className="admin-orders__td-actions">
                        <div className="admin-orders__row-actions">
                          <button
                            type="button"
                            className="btn-icon"
                            title="Xem chi tiết"
                            onClick={() => setDetailOrder(o)}
                          >
                            👁
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Cập nhật trạng thái tiếp theo"
                            onClick={() => onStatusChange(o.id, nextStatusByTick(st))}
                            disabled={busyId === o.id || st === 'completed' || st === 'cancelled'}
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-icon--danger"
                            title={
                              st === 'completed'
                                ? 'Không thể hủy đơn đã hoàn thành'
                                : 'Hủy đơn'
                            }
                            onClick={() => onStatusChange(o.id, 'cancelled')}
                            disabled={
                              busyId === o.id || st === 'completed' || st === 'cancelled'
                            }
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!orders.length && !err ? (
              <p className="admin-orders__empty">Chưa có đơn hàng nào.</p>
            ) : null}
            {orders.length > 0 && sortedFiltered.length === 0 ? (
              <p className="admin-orders__empty">
                Không có đơn phù hợp bộ lọc. Thử đổi từ khóa hoặc trạng thái.
              </p>
            ) : null}
          </div>
          {sortedFiltered.length > 0 ? (
            <div className="admin-orders__pagination">
              <p className="admin-orders__pagination-meta">
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
                {Math.min(currentPage * PAGE_SIZE, sortedFiltered.length)} / {sortedFiltered.length} đơn
              </p>
              <div className="admin-orders__pagination-actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  Trước
                </button>
                <span className="admin-orders__pagination-page">
                  Trang {currentPage}/{totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Sau
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {detailOrder ? (
        <div
          className="admin-orders-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-order-detail-title"
          onClick={() => setDetailOrder(null)}
        >
          <div
            className="admin-orders-modal__panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-orders-modal__head">
              <div>
                <h3 id="admin-order-detail-title" className="admin-orders-modal__title">
                  Chi tiết đơn hàng{' '}
                  <span className="admin-orders-modal__id">#{detailOrder.id}</span>
                </h3>
                <p className="admin-orders-modal__meta">
                  Đặt lúc {formatOrderDateTimeFull(detailOrder.createdAt)}
                  {detailOrder.updatedAt &&
                  String(detailOrder.updatedAt) !==
                    String(detailOrder.createdAt) ? (
                    <>
                      {' '}
                      · Cập nhật {formatOrderDateTimeFull(detailOrder.updatedAt)}
                    </>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                className="admin-orders-modal__close"
                onClick={() => setDetailOrder(null)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="admin-orders-modal__body">
              <div className="admin-orders-modal__grid">
                <section className="admin-orders-modal__section">
                  <h4 className="admin-orders-modal__section-title">
                    Khách & giao hàng
                  </h4>
                  <dl className="admin-orders-modal__dl">
                    <div>
                      <dt>Người nhận</dt>
                      <dd>{detailOrder.name || '—'}</dd>
                    </div>
                    <div>
                      <dt>Số điện thoại</dt>
                      <dd>{detailOrder.phone || '—'}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{detailOrder.email || '—'}</dd>
                    </div>
                    <div className="admin-orders-modal__dl--full">
                      <dt>Địa chỉ</dt>
                      <dd>{detailOrder.address || '—'}</dd>
                    </div>
                  </dl>
                </section>
                <section className="admin-orders-modal__section">
                  <h4 className="admin-orders-modal__section-title">
                    Thanh toán & trạng thái
                  </h4>
                  <dl className="admin-orders-modal__dl">
                    <div>
                      <dt>Hình thức</dt>
                      <dd>{paymentLabel(detailOrder.payment)}</dd>
                    </div>
                    <div>
                      <dt>Trạng thái thanh toán</dt>
                      <dd>
                        {detailPaymentStatus ? (
                          <span
                            className={`admin-orders-modal__pay-pill admin-orders-modal__pay-pill--${detailPaymentStatus.variant}`}
                          >
                            {detailPaymentStatus.label}
                          </span>
                        ) : (
                          '—'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Trạng thái đơn</dt>
                      <dd>
                        <span
                          className={`admin-orders-modal__status-pill admin-orders-modal__status-pill--${detailOrder.status || 'pending'}`}
                        >
                          {STATUS_LABEL[detailOrder.status] ||
                            detailOrder.status ||
                            '—'}
                        </span>
                      </dd>
                    </div>
                    {detailOrder.user_id != null ? (
                      <div>
                        <dt>Mã user</dt>
                        <dd>{detailOrder.user_id}</dd>
                      </div>
                    ) : null}
                  </dl>
                </section>
              </div>

              <section className="admin-orders-modal__section admin-orders-modal__section--lines">
                <h4 className="admin-orders-modal__section-title">
                  Sản phẩm ({(detailOrder.items || []).length})
                </h4>
                {(detailOrder.items || []).length === 0 ? (
                  <p className="admin-orders-modal__empty-lines">
                    Không có dòng chi tiết (đơn cũ hoặc dữ liệu trống).
                  </p>
                ) : (
                  <div className="admin-orders-modal__lines-wrap">
                    <table className="admin-orders-modal__lines">
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th className="admin-orders-modal__col-num">Đơn giá</th>
                          <th className="admin-orders-modal__col-qty">SL</th>
                          <th className="admin-orders-modal__col-num">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detailOrder.items || []).map((it, idx) => {
                          const src = getProductImageSrc(it.image || '')
                          const lt = lineTotal(it)
                          return (
                            <tr key={`${it.id}-${idx}`}>
                              <td>
                                <div className="admin-orders-modal__line-product">
                                  {src ? (
                                    <img
                                      src={src}
                                      alt=""
                                      className="admin-orders-modal__line-img"
                                    />
                                  ) : (
                                    <span
                                      className="admin-orders-modal__line-img admin-orders-modal__line-img--ph"
                                      aria-hidden
                                    />
                                  )}
                                  <div>
                                    <div className="admin-orders-modal__line-name">
                                      {it.name || '—'}
                                    </div>
                                    <div className="admin-orders-modal__line-sku">
                                      Mã SP: {it.id ?? '—'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="admin-orders-modal__col-num">
                                {formatPrice(it.price ?? 0)}
                              </td>
                              <td className="admin-orders-modal__col-qty">
                                {it.quantity ?? 0}
                              </td>
                              <td className="admin-orders-modal__col-num admin-orders-modal__col-strong">
                                {formatPrice(lt)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <div className="admin-orders-modal__foot">
              <span className="admin-orders-modal__total-label">Tổng đơn</span>
              <span className="admin-orders-modal__total-value">
                {formatPrice(detailOrder.total ?? 0)}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

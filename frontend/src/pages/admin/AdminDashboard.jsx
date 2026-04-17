/**
 * Bảng điều khiển admin: thống kê tổng quan từ fetchAdminData + products.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminData } from '../../api/adminApi.js'
import { fetchProductsAll } from '../../api/products.js'
import { formatPrice } from '../../utils/format.js'
import { getProductImageSrc } from '../../utils/assets.js'

const CHART_VB = { w: 320, h: 82 }
const CHART_PAD = { l: 28, r: 8, t: 14, b: 16 }

function formatAxisVnd(n) {
  const x = Math.max(0, Number(n) || 0)
  if (x >= 1e9) return `${(x / 1e9).toFixed(1)}B`
  if (x >= 1e6) return `${(x / 1e6).toFixed(1)}M`
  if (x >= 1e3) return `${Math.round(x / 1e3)}k`
  return String(Math.round(x))
}

/** N ngày gần nhất (local), nhãn trục ngang */
function recentDaysMeta(days = 7) {
  const rows = []
  const safeDays = Math.max(1, Number(days) || 1)
  for (let i = safeDays - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const key = `${y}-${m}-${day}`
    const label = safeDays <= 7 ? (d.getDay() === 0 ? 'CN' : String(d.getDate())) : `${d.getDate()}/${d.getMonth() + 1}`
    rows.push({ key, label, d })
  }
  return rows
}

function buildHybridLineModel(series, scaleMax) {
  const maxScale = Math.max(1, Number(scaleMax) || 1)
  const norm = series.map((d) => ({
    ...d,
    shopPct: (Math.max(0, Number(d.shopRev) || 0) / maxScale) * 100,
    spaPct: (Math.max(0, Number(d.spaRev) || 0) / maxScale) * 100,
  }))
  const { w: VB_W, h: VB_H } = CHART_VB
  const innerW = VB_W - CHART_PAD.l - CHART_PAD.r
  const innerH = VB_H - CHART_PAD.t - CHART_PAD.b
  const n = norm.length
  const xAt = (i) =>
    CHART_PAD.l + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const yAt = (pct) =>
    CHART_PAD.t + innerH * (1 - Math.min(100, Math.max(0, Number(pct))) / 100)

  const mkPts = (key) =>
    norm.map((d, i) => ({ x: xAt(i), y: yAt(d[key]), ...d }))
  const shopPts = mkPts('shopPct')
  const spaPts = mkPts('spaPct')
  const toPoly = (arr) =>
    arr.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const bottom = CHART_PAD.t + innerH
  return {
    shopPts,
    spaPts,
    polyShop: toPoly(shopPts),
    polySpa: toPoly(spaPts),
    yTop: CHART_PAD.t,
    yMid: CHART_PAD.t + innerH / 2,
    yBottom: bottom,
    VB_W,
    VB_H,
    yLabelTop: formatAxisVnd(maxScale),
    yLabelMid: formatAxisVnd(maxScale / 2),
  }
}

function localDateStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function appointmentDateYmd(v) {
  if (v == null || v === '') return ''
  const s = typeof v === 'string' ? v : String(v)
  const m = s.match(/(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : s.slice(0, 10)
}

function apptPillClass(st) {
  if (st === 'pending') return 'pill pill--info'
  if (st === 'confirmed') return 'pill pill--success'
  if (st === 'completed') return 'pill pill--default'
  if (st === 'cancelled') return 'pill pill--danger'
  return 'pill pill--default'
}

function orderPillClass(st) {
  if (st === 'completed') return 'pill pill--success'
  if (st === 'shipping') return 'pill pill--info'
  if (st === 'confirmed') return 'pill pill--info'
  if (st === 'cancelled') return 'pill pill--danger'
  if (st === 'awaiting_payment') return 'pill pill--info'
  if (st === 'pending') return 'pill pill--warning'
  return 'pill pill--default'
}

function orderItemsQty(order) {
  const items = Array.isArray(order?.items) ? order.items : []
  return items.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0)
}

const ORDER_STATUS_VI = {
  pending: 'Chờ xử lý',
  awaiting_payment: 'Chờ thanh toán VNPay',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
}

const APPT_STATUS_VI = {
  pending: 'Đang chờ',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

function thumbPlaceholderClass(pet) {
  if (pet === 'cho' || pet === 'dog') return 'table-product__thumb table-product__thumb--dog'
  if (pet === 'meo' || pet === 'cat') return 'table-product__thumb table-product__thumb--cat'
  return 'table-product__thumb table-product__thumb--spa'
}

function DashboardProductThumb({ product }) {
  const [broken, setBroken] = useState(false)
  const src = getProductImageSrc(product.image || '')
  if (src && !broken) {
    return (
      <img
        src={src}
        alt=""
        className="table-product__thumb-img--sm"
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
      />
    )
  }
  return <div className={thumbPlaceholderClass(product.petType)} aria-hidden />
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [products, setProducts] = useState([])
  const [err, setErr] = useState(null)
  const [collapsedStats, setCollapsedStats] = useState({
    revenueDay: true,
    revenue: true,
    spaDay: true,
    spaRevenue: true,
  })
  const [quickRange, setQuickRange] = useState('week')
  const [revenueView, setRevenueView] = useState('week')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [d, plist] = await Promise.all([fetchAdminData(), fetchProductsAll()])
        if (!cancelled) {
          setData(d)
          setProducts(plist)
        }
      } catch (e) {
        if (!cancelled) setErr(e.message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const orders = data?.orders || []
  const appointments = data?.appointments || []
  const today = localDateStr()
  const quickDays = quickRange === 'month' ? 30 : 7

  const stats = useMemo(() => {
    const rangeDays = recentDaysMeta(quickDays).map((x) => x.key)
    const rangeSet = new Set(rangeDays)
    const ordersInRange = orders.filter((o) => rangeSet.has(String(o.createdAt || '').slice(0, 10)))
    const ordersRangeCompleted = ordersInRange.filter((o) => o.status === 'completed')
    const revenueRangeShop = ordersRangeCompleted.reduce((s, o) => s + Number(o.total || 0), 0)
    const productsRangeQty = ordersRangeCompleted.reduce((s, o) => s + orderItemsQty(o), 0)
    const apptInRange = appointments.filter((a) => rangeSet.has(appointmentDateYmd(a.date)))
    const apptRangeCompleted = apptInRange.filter((a) => a.status === 'completed')
    const revenueRangeSpa = apptRangeCompleted.reduce(
      (s, a) => s + Number(a.spaRevenue ?? a.spa_revenue_vnd ?? 0),
      0
    )
    const revenueRange = revenueRangeShop + revenueRangeSpa
    return {
      revenueToday: revenueRange,
      revenueTodayShop: revenueRangeShop,
      revenueTodaySpa: revenueRangeSpa,
      ordersTodayN: ordersInRange.length,
      ordersTodayCompletedN: ordersRangeCompleted.length,
      productsTodayQty: productsRangeQty,
      apptTodayCompletedN: apptRangeCompleted.length,
    }
  }, [orders, appointments, products, quickDays])

  const todayRevenue = useMemo(() => {
    let shop = 0
    let spa = 0
    let completedOrderN = 0
    let completedApptN = 0
    let productsQty = 0
    for (const o of orders) {
      if (o.status !== 'completed') continue
      if (String(o.createdAt || '').slice(0, 10) !== today) continue
      shop += Number(o.total || 0)
      completedOrderN += 1
      productsQty += orderItemsQty(o)
    }
    for (const a of appointments) {
      if (a.status !== 'completed') continue
      if (appointmentDateYmd(a.date) !== today) continue
      spa += Number(a.spaRevenue ?? a.spa_revenue_vnd ?? 0)
      completedApptN += 1
    }
    return { shop, spa, total: shop + spa, completedOrderN, completedApptN, productsQty }
  }, [orders, appointments, today])

  const timelineAppts = useMemo(() => {
    const todayAppts = appointments
      .filter((a) => appointmentDateYmd(a.date) === today)
      .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
    const list = todayAppts.length ? todayAppts : appointments.slice(0, 4)
    return list.slice(0, 4)
  }, [appointments, today])

  const recentOrders = useMemo(() => orders.slice(0, 4), [orders])
  const topProducts = useMemo(() => products.slice(0, 3), [products])

  const { hybridSeries, chartScaleMax } = useMemo(() => {
    const dayCount = revenueView === 'month' ? 30 : 7
    const days = recentDaysMeta(dayCount)
    const byKey = Object.fromEntries(
      days.map(({ key }) => [key, { shopRev: 0, spaRev: 0, orderN: 0, apptN: 0 }])
    )
    for (const o of orders) {
      if (o.status !== 'completed') continue
      const k = String(o.createdAt || '').slice(0, 10)
      if (!byKey[k]) continue
      byKey[k].shopRev += Number(o.total || 0)
      byKey[k].orderN += 1
    }
    for (const a of appointments) {
      if (a.status !== 'completed') continue
      const k = appointmentDateYmd(a.date)
      if (!byKey[k]) continue
      byKey[k].spaRev += Number(a.spaRevenue ?? a.spa_revenue_vnd ?? 0)
      byKey[k].apptN += 1
    }
    const series = days.map(({ key, label }) => {
      const x = byKey[key]
      return {
        key,
        label,
        shopRev: x.shopRev,
        spaRev: x.spaRev,
        orderN: x.orderN,
        apptN: x.apptN,
        tipCount: x.orderN + x.apptN,
      }
    })
    let scaleMax = 1
    for (const row of series) {
      scaleMax = Math.max(scaleMax, row.shopRev, row.spaRev)
    }
    return { hybridSeries: series, chartScaleMax: scaleMax }
  }, [orders, appointments, revenueView])

  const lineChart = useMemo(
    () => buildHybridLineModel(hybridSeries, chartScaleMax),
    [hybridSeries, chartScaleMax]
  )

  const weeklyRevenue = useMemo(() => {
    const days = recentDaysMeta(7).map((x) => x.key)
    const setDays = new Set(days)
    let shop = 0
    let spa = 0
    for (const o of orders) {
      if (o.status !== 'completed') continue
      if (!setDays.has(String(o.createdAt || '').slice(0, 10))) continue
      shop += Number(o.total || 0)
    }
    for (const a of appointments) {
      if (a.status !== 'completed') continue
      if (!setDays.has(appointmentDateYmd(a.date))) continue
      spa += Number(a.spaRevenue ?? a.spa_revenue_vnd ?? 0)
    }
    return { shop, spa, total: shop + spa }
  }, [orders, appointments])

  const monthlyRevenue = useMemo(() => {
    const days = recentDaysMeta(30).map((x) => x.key)
    const setDays = new Set(days)
    let shop = 0
    let spa = 0
    for (const o of orders) {
      if (o.status !== 'completed') continue
      if (!setDays.has(String(o.createdAt || '').slice(0, 10))) continue
      shop += Number(o.total || 0)
    }
    for (const a of appointments) {
      if (a.status !== 'completed') continue
      if (!setDays.has(appointmentDateYmd(a.date))) continue
      spa += Number(a.spaRevenue ?? a.spa_revenue_vnd ?? 0)
    }
    return { shop, spa, total: shop + spa }
  }, [orders, appointments])

  const pctRev = Math.min(
    100,
    stats.ordersTodayCompletedN * 18 + stats.apptTodayCompletedN * 12 + 20
  )

  const shopRevenueBadge =
    stats.ordersTodayCompletedN > 0 ? `${stats.ordersTodayCompletedN} đơn HT` : 'Shop'
  const shopRevenueBadgeDay =
    todayRevenue.completedOrderN > 0 ? `${todayRevenue.completedOrderN} đơn HT` : 'Shop'
  const spaRevenueBadge =
    stats.apptTodayCompletedN > 0 ? `${stats.apptTodayCompletedN} lịch HT` : 'Spa'
  const spaRevenueBadgeDay =
    todayRevenue.completedApptN > 0 ? `${todayRevenue.completedApptN} lịch HT` : 'Spa'

  function toggleStatCard(key) {
    setCollapsedStats((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="admin-dashboard">
      {err ? <div className="admin-alert admin-alert--err">{err}</div> : null}

      <section className="section">
        <div className="section__header">
          <h2 className="section__title">Chỉ số nhanh</h2>
          <span className="section__hint">
            Cửa hàng & spa — {quickRange === 'month' ? '30 ngày gần nhất' : '7 ngày gần nhất'}
          </span>
          <div className="revenue-view-toggle" role="group" aria-label="Chọn kỳ chỉ số nhanh">
            <button
              type="button"
              className={`revenue-view-toggle__btn${quickRange === 'week' ? ' is-active' : ''}`}
              onClick={() => setQuickRange('week')}
            >
              Tuần
            </button>
            <button
              type="button"
              className={`revenue-view-toggle__btn${quickRange === 'month' ? ' is-active' : ''}`}
              onClick={() => setQuickRange('month')}
            >
              Tháng
            </button>
          </div>
        </div>
        <div className="grid grid--stats">
          <div
            className={`card card--stat card--stat-shop${
              collapsedStats.revenueDay ? ' is-collapsed' : ''
            }`}
          >
            <div className="card__header">
              <span className="card__label">Doanh thu 1 ngày (Shop)</span>
              <div className="card__header-actions">
                <span className="badge badge--success">{shopRevenueBadgeDay}</span>
                <button
                  type="button"
                  className="card__collapse-btn"
                  aria-expanded={!collapsedStats.revenueDay}
                  onClick={() => toggleStatCard('revenueDay')}
                  title={collapsedStats.revenueDay ? 'Mở thông tin' : 'Thu gọn'}
                >
                  {collapsedStats.revenueDay ? '▾' : '▴'}
                </button>
              </div>
            </div>
            <div className="card__value">{todayRevenue.completedOrderN} đơn</div>
            {!collapsedStats.revenueDay ? (
              <>
                <div className="card__meta">
                  Tổng doanh thu: {formatPrice(todayRevenue.shop)} · Số lượng sản phẩm:{' '}
                  {todayRevenue.productsQty}
                </div>
                <div className="progress">
                  <div className="progress__bar" style={{ width: `${pctRev}%` }} />
                </div>
              </>
            ) : null}
          </div>

          <div
            className={`card card--stat card--stat-shop${
              collapsedStats.revenue ? ' is-collapsed' : ''
            }`}
          >
            <div className="card__header">
              <span className="card__label">
                Doanh thu {quickRange === 'month' ? '30 ngày' : '7 ngày'} (Shop)
              </span>
              <div className="card__header-actions">
                <span className="badge badge--success">{shopRevenueBadge}</span>
                <button
                  type="button"
                  className="card__collapse-btn"
                  aria-expanded={!collapsedStats.revenue}
                  onClick={() => toggleStatCard('revenue')}
                  title={collapsedStats.revenue ? 'Mở thông tin' : 'Thu gọn'}
                >
                  {collapsedStats.revenue ? '▾' : '▴'}
                </button>
              </div>
            </div>
            <div className="card__value">{stats.ordersTodayCompletedN} đơn</div>
            {!collapsedStats.revenue ? (
              <>
                <div className="card__meta">
                  Tổng doanh thu: {formatPrice(stats.revenueTodayShop)} · Số lượng sản phẩm:{' '}
                  {stats.productsTodayQty}
                </div>
                <div className="progress">
                  <div className="progress__bar" style={{ width: `${pctRev}%` }} />
                </div>
              </>
            ) : null}
          </div>

          <div
            className={`card card--stat card--stat-spa${
              collapsedStats.spaDay ? ' is-collapsed' : ''
            }`}
          >
            <div className="card__header">
              <span className="card__label">Doanh thu 1 ngày (Spa)</span>
              <div className="card__header-actions">
                <span className="badge badge--info">{spaRevenueBadgeDay}</span>
                <button
                  type="button"
                  className="card__collapse-btn"
                  aria-expanded={!collapsedStats.spaDay}
                  onClick={() => toggleStatCard('spaDay')}
                  title={collapsedStats.spaDay ? 'Mở thông tin' : 'Thu gọn'}
                >
                  {collapsedStats.spaDay ? '▾' : '▴'}
                </button>
              </div>
            </div>
            <div className="card__value">{todayRevenue.completedApptN} lịch</div>
            {!collapsedStats.spaDay ? (
              <>
                <div className="card__meta">
                  Tổng doanh thu: {formatPrice(todayRevenue.spa)} · Số lịch: {todayRevenue.completedApptN}
                </div>
                <div className="progress progress--secondary">
                  <div className="progress__bar" style={{ width: `${pctRev}%` }} />
                </div>
              </>
            ) : null}
          </div>

          <div
            className={`card card--stat card--stat-spa${
              collapsedStats.spaRevenue ? ' is-collapsed' : ''
            }`}
          >
            <div className="card__header">
              <span className="card__label">
                Doanh thu {quickRange === 'month' ? '30 ngày' : '7 ngày'} (Spa)
              </span>
              <div className="card__header-actions">
                <span className="badge badge--info">{spaRevenueBadge}</span>
                <button
                  type="button"
                  className="card__collapse-btn"
                  aria-expanded={!collapsedStats.spaRevenue}
                  onClick={() => toggleStatCard('spaRevenue')}
                  title={collapsedStats.spaRevenue ? 'Mở thông tin' : 'Thu gọn'}
                >
                  {collapsedStats.spaRevenue ? '▾' : '▴'}
                </button>
              </div>
            </div>
            <div className="card__value">{stats.apptTodayCompletedN} lịch</div>
            {!collapsedStats.spaRevenue ? (
              <>
                <div className="card__meta">
                  Tổng doanh thu: {formatPrice(stats.revenueTodaySpa)} · Số lịch:{' '}
                  {stats.apptTodayCompletedN}
                </div>
                <div className="progress progress--secondary">
                  <div className="progress__bar" style={{ width: `${pctRev}%` }} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card card--chart">
          <div className="card__header card__header--between card__header--chart">
            <div>
              <h2 className="card__title">
                {revenueView === 'month'
                  ? 'Doanh thu 30 ngày — Cửa hàng & Spa'
                  : 'Doanh thu 7 ngày — Cửa hàng & Spa'}
              </h2>
              <p className="card__subtitle card__subtitle--compact">
                Đơn hoàn thành (tổng tiền) và lịch spa hoàn thành (giá từ chi tiết lịch hoặc bảng giá
                dịch vụ). Nguồn: MySQL qua GET /api/admin/data.
              </p>
              <div className="revenue-summaries">
                <span className="revenue-summaries__item">
                  Tuần: <strong>{formatPrice(weeklyRevenue.total)}</strong>
                </span>
                <span className="revenue-summaries__item">
                  Tháng: <strong>{formatPrice(monthlyRevenue.total)}</strong>
                </span>
              </div>
            </div>
            <div className="card__header-actions">
              <div className="revenue-view-toggle" role="group" aria-label="Chọn kỳ doanh thu">
                <button
                  type="button"
                  className={`revenue-view-toggle__btn${revenueView === 'week' ? ' is-active' : ''}`}
                  onClick={() => setRevenueView('week')}
                >
                  Tuần
                </button>
                <button
                  type="button"
                  className={`revenue-view-toggle__btn${revenueView === 'month' ? ' is-active' : ''}`}
                  onClick={() => setRevenueView('month')}
                >
                  Tháng
                </button>
              </div>
              <div className="chart-legend">
                <span className="chart-legend__item">
                  <span className="chart-legend__dot chart-legend__dot--revenue" /> Doanh thu cửa
                  hàng
                </span>
                <span className="chart-legend__item">
                  <span className="chart-legend__dot chart-legend__dot--spa" /> Doanh thu spa
                </span>
              </div>
            </div>
          </div>

          <div className="chart chart--line">
            <svg
              className="chart-line__svg"
              viewBox={`0 0 ${lineChart.VB_W} ${lineChart.VB_H}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Biểu đồ doanh thu cửa hàng và spa 7 ngày gần nhất"
            >
              <title>Doanh thu cửa hàng và spa theo ngày</title>
              <line
                className="chart-line__grid"
                x1={CHART_PAD.l}
                y1={lineChart.yTop}
                x2={lineChart.VB_W - CHART_PAD.r}
                y2={lineChart.yTop}
              />
              <line
                className="chart-line__grid chart-line__grid--dash"
                x1={CHART_PAD.l}
                y1={lineChart.yMid}
                x2={lineChart.VB_W - CHART_PAD.r}
                y2={lineChart.yMid}
              />
              <line
                className="chart-line__grid"
                x1={CHART_PAD.l}
                y1={lineChart.yBottom}
                x2={lineChart.VB_W - CHART_PAD.r}
                y2={lineChart.yBottom}
              />
              <text className="chart-line__ylabel" x="2" y={lineChart.yTop + 3}>
                {lineChart.yLabelTop}
              </text>
              <text className="chart-line__ylabel" x="2" y={lineChart.yMid + 3}>
                {lineChart.yLabelMid}
              </text>
              <text className="chart-line__ylabel" x="2" y={lineChart.yBottom + 3}>
                0
              </text>
              <polyline
                className="chart-line__stroke chart-line__stroke--rev"
                points={lineChart.polyShop}
                fill="none"
              />
              <polyline
                className="chart-line__stroke chart-line__stroke--spa"
                points={lineChart.polySpa}
                fill="none"
              />
              {lineChart.shopPts.map((p) => (
                <circle
                  key={`s-${p.label}`}
                  className="chart-line__dot chart-line__dot--rev"
                  cx={p.x}
                  cy={p.y}
                  r="2.4"
                >
                  <title>{`Cửa hàng ${p.label}: ${formatPrice(p.shopRev)} (${p.orderN} đơn HT)`}</title>
                </circle>
              ))}
              {lineChart.spaPts.map((p) => (
                <circle
                  key={`p-${p.label}`}
                  className="chart-line__dot chart-line__dot--spa"
                  cx={p.x}
                  cy={p.y}
                  r="2.4"
                >
                  <title>{`Spa ${p.label}: ${formatPrice(p.spaRev)} (${p.apptN} lịch HT)`}</title>
                </circle>
              ))}
              {lineChart.shopPts.map((p) => (
                <text
                  key={`x-${p.label}`}
                  className="chart-line__xlabel"
                  x={p.x}
                  y={lineChart.VB_H - 3}
                  textAnchor="middle"
                >
                  {p.label}
                </text>
              ))}
              {lineChart.shopPts.map((p, idx) => {
                const sp = lineChart.spaPts[idx]
                const yHi = Math.min(p.y, sp ? sp.y : p.y)
                return (
                  <g key={`lbl-${p.label}`} className="chart-line__tip">
                    <title>{`${p.orderN} đơn HT + ${p.apptN} lịch HT`}</title>
                    <rect
                      className="chart-line__tip-bg"
                      x={p.x - 14}
                      y={yHi - 24}
                      width={28}
                      height={13}
                      rx={6}
                    />
                    <text
                      className="chart-line__tip-txt"
                      x={p.x}
                      y={yHi - 14}
                      textAnchor="middle"
                    >
                      {p.tipCount || '0'}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      </section>

      <section className="section grid grid--2">
        <div className="card card--table">
          <div className="card__header card__header--between">
            <div>
              <h2 className="card__title">Sản phẩm bán chạy</h2>
              <p className="card__subtitle">Sản phẩm nổi bật theo tồn và mức bán</p>
            </div>
            <Link to="/admin/products" className="btn btn--ghost btn--sm">
              Xem tất cả
            </Link>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Đã bán</th>
                  <th>Kho</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '1rem', color: '#6b7280' }}>
                      Chưa có sản phẩm hoặc chưa tải được từ API.
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="table-product">
                          <DashboardProductThumb product={p} />
                          <div>
                            <div className="table-product__name">{p.name}</div>
                            <div className="table-product__meta">
                              {p.slug || p.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{p.category || '—'}</td>
                      <td>{formatPrice(p.price)}</td>
                      <td>
                        {p.bestSeller ? (
                          <span className="pill pill--info">Bán chạy</span>
                        ) : (
                          <span className="pill pill--default">—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={
                            p.stock == null || p.stock === '' || Number(p.stock) < 0
                              ? 'pill pill--default'
                              : Number(p.stock) < 10
                                ? 'pill pill--warning'
                                : 'pill pill--success'
                          }
                        >
                          {p.stock == null || p.stock === '' || Number(p.stock) < 0
                            ? 'Không giới hạn'
                            : Number(p.stock) < 10
                              ? `Sắp hết (${p.stock})`
                              : 'Còn hàng'}
                        </span>
                      </td>
                      <td className="table__actions">
                        <Link
                          to="/admin/products"
                          className="btn-icon btn-icon--edit"
                          title="Sửa"
                        >
                          Sửa
                        </Link>
                        <button
                          type="button"
                          className="btn-icon btn-icon--delete"
                          title="Xóa (demo)"
                          aria-label="Xóa"
                          disabled
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card__header card__header--between">
              <div>
                <h2 className="card__title">Lịch hẹn hôm nay</h2>
                <p className="card__subtitle">
                  {timelineAppts.length
                    ? `${timelineAppts.length} lịch hẹn sắp diễn ra`
                    : 'Chưa có lịch trong ngày'}
                </p>
              </div>
              <Link to="/admin/appointments" className="btn btn--ghost btn--sm">
                Tạo lịch
              </Link>
            </div>
            <ul className="timeline">
              {timelineAppts.length === 0 ? (
                <li className="timeline__item">
                  <div className="timeline__time">—</div>
                  <div className="timeline__content">
                    <div className="timeline__title">Chưa có lịch</div>
                    <div className="timeline__meta">Thêm lịch tại trang Lịch hẹn hoặc Booking.</div>
                  </div>
                  <span className="pill pill--default">—</span>
                </li>
              ) : (
                timelineAppts.map((a, i) => (
                  <li
                    key={a.id}
                    className={`timeline__item${i === 0 ? ' timeline__item--active' : ''}`}
                  >
                    <div className="timeline__time">{a.time || '—'}</div>
                    <div className="timeline__content">
                      <div className="timeline__title">
                        {a.serviceName || a.service_id || 'Dịch vụ'}
                      </div>
                      <div className="timeline__meta">
                        Khách: <strong>{a.ownerName || a.owner_name || '—'}</strong> ·{' '}
                        {a.pet_name || 'Thú cưng'}
                      </div>
                    </div>
                    <span className={apptPillClass(a.status)}>
                      {APPT_STATUS_VI[a.status] || a.status || '—'}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="card">
            <div className="card__header card__header--between">
              <div>
                <h2 className="card__title">Đơn hàng gần đây</h2>
                <p className="card__subtitle">
                  {recentOrders.length} đơn hàng mới nhất
                </p>
              </div>
              <div className="card__header-actions">
                <button type="button" className="btn btn--ghost btn--sm" disabled>
                  Xuất báo cáo
                </button>
                <Link to="/admin/orders" className="btn btn--ghost btn--sm">
                  Xem tất cả
                </Link>
              </div>
            </div>
            <div className="list">
              {recentOrders.length === 0 ? (
                <div className="list-item">
                  <div>
                    <div className="list-item__title">Chưa có đơn</div>
                    <div className="list-item__meta">Dữ liệu từ MySQL qua GET /api/admin/data</div>
                  </div>
                </div>
              ) : (
                recentOrders.map((o) => (
                  <div key={o.id} className="list-item">
                    <div>
                      <div className="list-item__title">
                        ĐH-{new Date().getFullYear()}-{String(o.id).padStart(4, '0')}
                      </div>
                      <div className="list-item__meta">
                        Khách: <strong>{o.name || '—'}</strong>
                        {(o.items?.length || 0) > 0
                          ? ` · ${o.items.length} mặt hàng`
                          : null}
                      </div>
                    </div>
                    <div className="list-item__right">
                      <div className="list-item__amount">{formatPrice(o.total ?? 0)}</div>
                      <span className={orderPillClass(o.status)}>
                        {ORDER_STATUS_VI[o.status] || o.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

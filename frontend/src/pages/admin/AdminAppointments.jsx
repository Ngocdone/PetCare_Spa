/**
 * Lịch hẹn spa: xem & cập nhật trạng thái (postAppointmentStatus).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminData, postAppointmentStatus } from '../../api/adminApi.js'

const STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

const APPOINTMENT_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ xác nhận' },
  { id: 'confirmed', label: 'Đã xác nhận' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' },
]

function localDateStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Chuẩn hóa ngày từ API (YYYY-MM-DD hoặc chuỗi ISO) để so khớp “hôm nay”. */
function appointmentDateYmd(v) {
  if (v == null || v === '') return ''
  const s = typeof v === 'string' ? v : String(v)
  const m = s.match(/(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : s.slice(0, 10)
}

/** Badge trạng thái lịch — đồng bộ màu với cột "Tất cả lịch hẹn". */
function timelineStatusPillClass(st) {
  const s = st || 'pending'
  const key =
    s === 'pending' || s === 'confirmed' || s === 'completed' || s === 'cancelled'
      ? s
      : 'pending'
  return `admin-orders__status-pill admin-orders__status-pill--${key}`
}

function nextApptStatus(status) {
  const s = String(status || 'pending')
  if (s === 'pending') return 'confirmed'
  if (s === 'confirmed') return 'completed'
  return s
}

function apptCanCompleteQuick(status) {
  const s = status || 'pending'
  return s === 'pending' || s === 'confirmed'
}

function apptCanCancelQuick(status) {
  const s = status || 'pending'
  return s !== 'completed' && s !== 'cancelled'
}

function formatApptDate(v) {
  const s = String(v || '')
  return s ? s.slice(0, 10) : '—'
}

export default function AdminAppointments() {
  const PAGE_SIZE = 10
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)
  const [msg, setMsg] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setErr(null)
    try {
      const d = await fetchAdminData()
      setRows(d.appointments || [])
    } catch (e) {
      setErr(e.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const today = localDateStr()

  const timelineAppts = useMemo(() => {
    const todayList = rows
      .filter((a) => appointmentDateYmd(a.date) === today)
      .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
    const list = todayList.length ? todayList : rows.slice(0, 5)
    return list.slice(0, 5)
  }, [rows, today])

  const weekSummary = useMemo(() => {
    const byDate = {}
    for (const a of rows) {
      const k = String(a.date || '').slice(0, 10)
      if (!k) continue
      if (!byDate[k]) byDate[k] = { count: 0, sample: a.serviceName || a.service_id }
      byDate[k].count += 1
    }
    return Object.entries(byDate)
      .sort((x, y) => y[1].count - x[1].count)
      .slice(0, 4)
  }, [rows])

  const filteredRows = useMemo(() => {
    const q = String(search || '')
      .trim()
      .toLowerCase()
    return rows.filter((a) => {
      if (filterStatus !== 'all' && String(a.status || 'pending') !== filterStatus) return false
      if (!q) return true
      const id = String(a.id || '').toLowerCase()
      const service = String(a.serviceName || a.service_id || '').toLowerCase()
      const owner = String(a.ownerName || a.owner_name || '').toLowerCase()
      const phone = String(a.owner_phone || '')
      const pet = String(a.pet_name || '').toLowerCase()
      return (
        id.includes(q) ||
        service.includes(q) ||
        owner.includes(q) ||
        pet.includes(q) ||
        phone.includes(q.replace(/\s/g, ''))
      )
    })
  }, [rows, filterStatus, search])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, currentPage, PAGE_SIZE])

  useEffect(() => {
    setPage(1)
  }, [filterStatus, search])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  async function onStatusChange(id, status) {
    setMsg(null)
    setBusyId(id)
    try {
      await postAppointmentStatus(id, status)
      setMsg('Đã cập nhật trạng thái.')
      await load()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function onTimelineCancel(id) {
    if (!window.confirm('Hủy lịch hẹn này? Khách sẽ thấy trạng thái đã hủy.')) return
    await onStatusChange(id, 'cancelled')
  }

  return (
    <>
      {err ? <div className="admin-alert admin-alert--err">{err}</div> : null}
      {msg ? <div className="admin-alert admin-alert--ok">{msg}</div> : null}

      <section className="section grid grid--2">
        <div className="card">
          <div className="card__header card__header--between">
            <div>
              <h2 className="card__title">Lịch hẹn hôm nay</h2>
              <p className="card__subtitle">
                {timelineAppts.length
                  ? 'Những lịch trong ngày (hoặc gần nhất) theo thời gian.'
                  : 'Chưa có lịch.'}
              </p>
            </div>
            <span className="badge badge--info">Timeline</span>
          </div>
          <ul className="timeline">
            {timelineAppts.length === 0 ? (
              <li className="timeline__item">
                <div className="timeline__time">—</div>
                <div className="timeline__content">
                  <div className="timeline__title">Chưa có lịch</div>
                  <div className="timeline__meta">
                    Khách đặt lịch qua trang <Link to="/services">Dịch vụ</Link>.
                  </div>
                </div>
                <span className="pill pill--default">—</span>
              </li>
            ) : (
              timelineAppts.map((a, i) => {
                const st = a.status || 'pending'
                const busy = busyId === a.id
                return (
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
                    <div className="timeline__aside">
                      {st === 'pending' ? (
                        <div className="timeline__pending-row">
                          <span
                            className={`${timelineStatusPillClass('pending')} timeline__status-badge`}
                          >
                            {STATUS_LABEL.pending}
                          </span>
                          <div className="timeline__icon-actions" role="group" aria-label="Thao tác nhanh">
                            <button
                              type="button"
                              className="timeline__icon-btn"
                              title="Xác nhận"
                              aria-label="Xác nhận lịch"
                              disabled={busy}
                              onClick={() => onStatusChange(a.id, 'confirmed')}
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              className="timeline__icon-btn timeline__icon-btn--danger"
                              title="Hủy lịch"
                              aria-label="Hủy lịch"
                              disabled={busy}
                              onClick={() => onTimelineCancel(a.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={
                            st !== 'completed' && st !== 'cancelled'
                              ? 'timeline__aside-row'
                              : undefined
                          }
                        >
                          <span className={timelineStatusPillClass(st)}>{STATUS_LABEL[st] || st}</span>
                          {st !== 'completed' && st !== 'cancelled' ? (
                            <div className="timeline__quick-actions timeline__quick-actions--row">
                              {apptCanCompleteQuick(st) ? (
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm timeline__btn timeline__btn--inline"
                                  disabled={busy}
                                  onClick={() => onStatusChange(a.id, 'completed')}
                                >
                                  Hoàn thành
                                </button>
                              ) : null}
                              {apptCanCancelQuick(st) ? (
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm timeline__btn timeline__btn--inline timeline__btn--danger"
                                  disabled={busy}
                                  onClick={() => onTimelineCancel(a.id)}
                                >
                                  Hủy lịch
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        </div>

        <div className="card card--table">
          <div className="card__header card__header--between">
            <div>
              <h2 className="card__title">Lịch theo ngày (tổng hợp)</h2>
              <p className="card__subtitle">Số lịch theo từng ngày có trong dữ liệu</p>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" disabled>
              Xem dạng lịch tháng
            </button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Số lịch</th>
                  <th>Dịch vụ nổi bật</th>
                </tr>
              </thead>
              <tbody>
                {weekSummary.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '1rem', color: '#6b7280' }}>
                      Chưa có dữ liệu theo ngày.
                    </td>
                  </tr>
                ) : (
                  weekSummary.map(([date, info]) => (
                    <tr key={date}>
                      <td>{date}</td>
                      <td>{info.count} lịch</td>
                      <td>{info.sample || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card card--table admin-orders__card admin-appointments__card">
          <div className="card__header admin-products__card-header">
            <div className="admin-products__card-header-row">
              <div>
                <h2 className="card__title">Tất cả lịch hẹn</h2>
                <p className="card__subtitle">
                  {filteredRows.length} / {rows.length} lịch — bảng `lich_hen`
                </p>
              </div>
              <div className="card__header-actions">
                <label className="admin-orders__search" aria-label="Tìm lịch hẹn">
                  <input
                    type="search"
                    className="admin-orders__search-input"
                    placeholder="Tìm theo mã lịch, khách, SĐT..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <Link to="/services" className="btn btn--primary btn--sm">
                  + Tạo lịch hẹn
                </Link>
              </div>
            </div>
            <div className="admin-orders__chips" role="group" aria-label="Lọc trạng thái lịch hẹn">
              {APPOINTMENT_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={
                    filterStatus === f.id
                      ? 'admin-orders__chip admin-orders__chip--active'
                      : 'admin-orders__chip'
                  }
                  onClick={() => setFilterStatus(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="table-wrapper admin-orders__table-wrap admin-appointments__table-wrap">
            <table className="table table--orders">
              <thead>
                <tr>
                  <th className="admin-orders__th-id">Mã lịch</th>
                  <th>Dịch vụ</th>
                  <th>Ngày</th>
                  <th>Giờ</th>
                  <th>Chủ / SĐT</th>
                  <th>Thú cưng</th>
                  <th>Trạng thái</th>
                  <th className="admin-orders__th-actions"> </th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="admin-orders__id">#{a.id}</span>
                    </td>
                    <td className="admin-appointments__service">{a.serviceName || a.service_id}</td>
                    <td className="admin-appointments__date">{formatApptDate(a.date)}</td>
                    <td className="admin-appointments__time">{a.time || '—'}</td>
                    <td>
                      <span className="admin-orders__name">{a.ownerName || a.owner_name || '—'}</span>
                      <br />
                      <span className="admin-orders__phone">{a.owner_phone || ''}</span>
                    </td>
                    <td className="admin-appointments__pet">
                      {a.pet_name || '—'} ({a.pet_type || '—'})
                    </td>
                    <td>
                      <span className={`admin-orders__status-pill admin-orders__status-pill--${a.status || 'pending'}`}>
                        {STATUS_LABEL[a.status] || a.status}
                      </span>
                    </td>
                    <td className="admin-orders__td-actions">
                      <div className="admin-orders__row-actions">
                        <button
                          type="button"
                          className="btn-icon"
                          title="Cập nhật trạng thái tiếp theo"
                          disabled={
                            busyId === a.id ||
                            (a.status || 'pending') === 'completed' ||
                            (a.status || 'pending') === 'cancelled'
                          }
                          onClick={() => onStatusChange(a.id, nextApptStatus(a.status))}
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-icon--danger"
                          title={
                            (a.status || 'pending') === 'completed'
                              ? 'Không thể hủy lịch đã hoàn thành'
                              : 'Hủy lịch'
                          }
                          disabled={
                            busyId === a.id ||
                            (a.status || 'pending') === 'cancelled' ||
                            (a.status || 'pending') === 'completed'
                          }
                          onClick={() => onStatusChange(a.id, 'cancelled')}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && !err ? (
              <p className="admin-products__empty">Chưa có lịch hẹn.</p>
            ) : null}
            {rows.length > 0 && filteredRows.length === 0 ? (
              <p className="admin-products__empty">Không có lịch hẹn phù hợp bộ lọc / từ khóa.</p>
            ) : null}
          </div>
          {filteredRows.length > 0 ? (
            <div className="admin-orders__pagination">
              <p className="admin-orders__pagination-meta">
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
                {Math.min(currentPage * PAGE_SIZE, filteredRows.length)} / {filteredRows.length} lịch
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
    </>
  )
}

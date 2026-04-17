/**
 * CRUD dịch vụ admin: list từ fetchAdminServices, thêm/sửa/xóa qua adminApi.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  deleteAdminService,
  fetchAdminServices,
  postAdminServiceSave,
  postProductImageUpload,
} from '../../api/adminApi.js'
import { formatPrice } from '../../utils/format.js'
import { getProductImageSrc } from '../../utils/assets.js'
import { isServiceFeatured } from '../../utils/serviceFeatured.js'

function petLabel(pt) {
  if (pt === 'cho') return 'Chó'
  if (pt === 'meo') return 'Mèo'
  if (pt === 'both') return 'Chó & mèo'
  return pt || '—'
}

function priceFrom(s) {
  const a = s.priceDog != null ? Number(s.priceDog) : null
  const b = s.priceCat != null ? Number(s.priceCat) : null
  const pa = Number.isFinite(a) && a > 0 ? a : null
  const pb = Number.isFinite(b) && b > 0 ? b : null
  if (s.petType === 'cho') return pa ?? 0
  if (s.petType === 'meo') return pb ?? 0
  if (pa != null && pb != null) return Math.min(pa, pb)
  return pa ?? pb ?? 0
}

function slugifyVi(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function ServiceThumb({ image, name }) {
  const [broken, setBroken] = useState(false)
  const src = !broken ? getProductImageSrc(image || '') : ''
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Dịch vụ'}
        className="table-product__thumb-img--sm"
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
      />
    )
  }
  return <div className="table-product__thumb table-product__thumb--spa" aria-hidden />
}

const STATUS_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'active', label: 'Đang áp dụng' },
  { id: 'inactive', label: 'Tạm ngưng' },
]

const emptyForm = {
  id: '',
  name: '',
  slug: '',
  petType: 'both',
  duration: 60,
  unit: 'phut',
  priceDog: 0,
  priceCat: 0,
  image: '',
  status: 'active',
  featured: false,
  orderNo: 0,
  description: '',
}

export default function AdminServices() {
  const [list, setList] = useState([])
  const [err, setErr] = useState(null)
  const [msg, setMsg] = useState(null)
  const [adminRouteMissing, setAdminRouteMissing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const imagePickerRef = useRef(null)
  const imageTempUrlRef = useRef(null)
  const [imageTempUrl, setImageTempUrl] = useState(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [collapsedStats, setCollapsedStats] = useState({
    dog: true,
    cat: true,
    total: true,
    active: true,
  })
  const revokeServiceImageTemp = useCallback(() => {
    if (imageTempUrlRef.current) {
      URL.revokeObjectURL(imageTempUrlRef.current)
      imageTempUrlRef.current = null
    }
    setImageTempUrl(null)
  }, [])

  const imagePreviewSrc = useMemo(() => {
    if (imageTempUrl) return imageTempUrl
    return getProductImageSrc(form.image || '')
  }, [form.image, imageTempUrl])

  function closeModal() {
    revokeServiceImageTemp()
    setModalOpen(false)
  }

  const load = useCallback(async () => {
    setErr(null)
    setLoading(true)
    try {
      const rows = await fetchAdminServices()
      const missing = Array.isArray(rows) && rows.some((x) => x?.__adminRouteMissing)
      setAdminRouteMissing(missing)
      setList((rows || []).map((x) => {
        const { __adminRouteMissing, ...rest } = x || {}
        return rest
      }))
      if (missing) {
        setErr(null)
        setMsg('Backend chưa cập nhật route quản trị dịch vụ. Đang ở chế độ chỉ xem.')
      } else {
        setErr((prev) =>
          String(prev || '').includes('Backend chưa cập nhật route /api/admin/services') ? null : prev
        )
        setMsg((prev) =>
          prev === 'Backend chưa cập nhật route quản trị dịch vụ. Đang ở chế độ chỉ xem.'
            ? null
            : prev
        )
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const nDog = list.filter((s) => s.petType === 'cho' || s.petType === 'both').length
  const nCat = list.filter((s) => s.petType === 'meo' || s.petType === 'both').length
  const nActive = list.filter((s) => (s.status || 'active') === 'active').length

  const filteredList = useMemo(() => {
    const q = String(search || '').trim().toLowerCase()
    return list.filter((s) => {
      const st = s.status || 'active'
      if (statusFilter !== 'all' && st !== statusFilter) return false
      if (!q) return true
      return (
        String(s.id || '').toLowerCase().includes(q) ||
        String(s.name || '').toLowerCase().includes(q) ||
        String(s.slug || '').toLowerCase().includes(q)
      )
    })
  }, [list, search, statusFilter])

  function openNew() {
    revokeServiceImageTemp()
    setForm({ ...emptyForm })
    setModalOpen(true)
    setMsg(null)
    setErr(null)
  }

  function openEdit(s) {
    revokeServiceImageTemp()
    setForm({
      id: s.id || '',
      name: s.name || '',
      slug: s.slug || '',
      petType: s.petType || 'both',
      duration: s.duration ?? 60,
      unit: s.unit === 'ngay' ? 'ngay' : 'phut',
      priceDog: s.priceDog ?? 0,
      priceCat: s.priceCat ?? 0,
      image: s.image || '',
      status: s.status || 'active',
      featured: isServiceFeatured(s),
      orderNo: s.orderNo ?? 0,
      description: s.description || '',
    })
    setModalOpen(true)
    setMsg(null)
    setErr(null)
  }

  async function onSave(e) {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    setMsg(null)
    try {
      const isDog = form.petType === 'cho' || form.petType === 'both'
      const isCat = form.petType === 'meo' || form.petType === 'both'
      const autoSlug = slugifyVi(form.name)
      const payload = {
        id: String(form.id || '').trim() || autoSlug || undefined,
        name: String(form.name || '').trim(),
        slug: autoSlug || String(form.slug || '').trim(),
        petType: form.petType,
        duration: Number(form.duration || 0),
        unit: form.unit,
        priceDog: isDog ? Number(form.priceDog || 0) : null,
        priceCat: isCat ? Number(form.priceCat || 0) : null,
        image: String(form.image || '').trim(),
        status: form.status,
        featured: Boolean(form.featured),
        orderNo: Number(form.orderNo || 0),
        description: String(form.description || '').trim(),
      }
      await postAdminServiceSave(payload)
      revokeServiceImageTemp()
      setModalOpen(false)
      setMsg(payload.id ? 'Đã cập nhật dịch vụ.' : 'Đã thêm dịch vụ mới.')
      await load()
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(s) {
    if (!window.confirm(`Xóa dịch vụ "${s.name}" (${s.id})?`)) return
    setErr(null)
    setMsg(null)
    try {
      await deleteAdminService(s.id)
      setMsg('Đã xóa dịch vụ.')
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  async function onToggleStatus(s) {
    setErr(null)
    try {
      const nextStatus = (s.status || 'active') === 'active' ? 'inactive' : 'active'
      await postAdminServiceSave({
        ...s,
        status: nextStatus,
      })
      if (nextStatus === 'inactive' && statusFilter === 'active') {
        setStatusFilter('all')
      }
      setMsg('Đã cập nhật trạng thái dịch vụ.')
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  async function onToggleFeatured(s) {
    setErr(null)
    try {
      const nextFeatured = !isServiceFeatured(s)
      await postAdminServiceSave({
        ...s,
        featured: nextFeatured,
      })
      setMsg(nextFeatured ? 'Đã bật dịch vụ nổi bật.' : 'Đã tắt dịch vụ nổi bật.')
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  function onPickImageClick() {
    imagePickerRef.current?.click()
  }

  async function onServiceImageFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) {
      setErr('Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc GIF.')
      return
    }
    revokeServiceImageTemp()
    const blobUrl = URL.createObjectURL(file)
    imageTempUrlRef.current = blobUrl
    setImageTempUrl(blobUrl)
    setImageUploading(true)
    setErr(null)
    try {
      const relPath = await postProductImageUpload(file)
      setForm((f) => ({ ...f, image: relPath }))
      revokeServiceImageTemp()
      setMsg('Đã tải ảnh lên thư mục img/.')
    } catch (err) {
      revokeServiceImageTemp()
      setErr(err.message || 'Tải ảnh thất bại')
    } finally {
      setImageUploading(false)
    }
  }

  function toggleStatCard(key) {
    setCollapsedStats((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      {err ? <div className="admin-alert admin-alert--err">{err}</div> : null}
      {msg ? <div className="admin-alert admin-alert--ok">{msg}</div> : null}

      <section className="section">
        <div className="section__header">
          <h2 className="section__title">Nhóm dịch vụ</h2>
          <span className="section__hint">Phân loại theo thú cưng và nhu cầu</span>
        </div>
        <div className="grid grid--stats">
          <div className={`card card--stat${collapsedStats.dog ? ' is-collapsed' : ''}`}>
            <div className="card__header">
              <span className="card__label">Cho chó / chung</span>
              <div className="card__header-actions">
                <span className="badge badge--info">{nDog} gói</span>
                <button
                  type="button"
                  className="card__collapse-btn"
                  aria-expanded={!collapsedStats.dog}
                  onClick={() => toggleStatCard('dog')}
                  title={collapsedStats.dog ? 'Mở thông tin' : 'Thu gọn'}
                >
                  {collapsedStats.dog ? '▾' : '▴'}
                </button>
              </div>
            </div>
            <div className="card__value">Tắm & Grooming</div>
            {!collapsedStats.dog ? (
              <div className="card__meta">Dịch vụ áp dụng cho chó hoặc cả hai</div>
            ) : null}
          </div>
          <div className={`card card--stat${collapsedStats.cat ? ' is-collapsed' : ''}`}>
            <div className="card__header">
              <span className="card__label">Cho mèo / chung</span>
              <div className="card__header-actions">
                <span className="badge badge--purple">{nCat} gói</span>
                <button
                  type="button"
                  className="card__collapse-btn"
                  aria-expanded={!collapsedStats.cat}
                  onClick={() => toggleStatCard('cat')}
                  title={collapsedStats.cat ? 'Mở thông tin' : 'Thu gọn'}
                >
                  {collapsedStats.cat ? '▾' : '▴'}
                </button>
              </div>
            </div>
            <div className="card__value">Nhạy cảm & sạch khuẩn</div>
            {!collapsedStats.cat ? (
              <div className="card__meta">Tập trung vệ sinh nhẹ nhàng</div>
            ) : null}
          </div>
          <div className={`card card--stat${collapsedStats.total ? ' is-collapsed' : ''}`}>
            <div className="card__header">
              <span className="card__label">Tổng dịch vụ</span>
              <div className="card__header-actions">
                <span className="badge badge--warning">Đang bán</span>
                <button
                  type="button"
                  className="card__collapse-btn"
                  aria-expanded={!collapsedStats.total}
                  onClick={() => toggleStatCard('total')}
                  title={collapsedStats.total ? 'Mở thông tin' : 'Thu gọn'}
                >
                  {collapsedStats.total ? '▾' : '▴'}
                </button>
              </div>
            </div>
            <div className="card__value">{list.length} dịch vụ</div>
            {!collapsedStats.total ? (
              <div className="card__meta">Nguồn: API /services (MySQL)</div>
            ) : null}
          </div>
          <div className={`card card--stat${collapsedStats.active ? ' is-collapsed' : ''}`}>
            <div className="card__header">
              <span className="card__label">Chăm sóc</span>
              <div className="card__header-actions">
                <span className="badge badge--success">Spa</span>
                <button
                  type="button"
                  className="card__collapse-btn"
                  aria-expanded={!collapsedStats.active}
                  onClick={() => toggleStatCard('active')}
                  title={collapsedStats.active ? 'Mở thông tin' : 'Thu gọn'}
                >
                  {collapsedStats.active ? '▾' : '▴'}
                </button>
              </div>
            </div>
            <div className="card__value">{nActive} đang áp dụng</div>
            {!collapsedStats.active ? (
              <div className="card__meta">Có thể bật / tắt nhanh theo trạng thái</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card card--table admin-orders__card">
          <div className="card__header admin-products__card-header">
            <div className="admin-products__card-header-row">
              <div>
                <h2 className="card__title">Danh sách dịch vụ spa</h2>
                <p className="card__subtitle">
                  {loading ? 'Đang tải…' : `${filteredList.length} / ${list.length} dịch vụ`}
                </p>
              </div>
              <div className="card__header-actions">
                <label className="admin-orders__search" aria-label="Tìm dịch vụ spa">
                  <input
                    type="search"
                    className="admin-orders__search-input"
                    placeholder="Tìm mã, tên dịch vụ..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={openNew}
                  disabled={adminRouteMissing}
                  title={adminRouteMissing ? 'Cần restart backend để thêm/sửa/xóa dịch vụ.' : 'Thêm dịch vụ'}
                >
                  + Thêm dịch vụ
                </button>
              </div>
            </div>
            <div className="admin-orders__chips" role="group" aria-label="Lọc trạng thái dịch vụ">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={
                    statusFilter === f.id
                      ? 'admin-orders__chip admin-orders__chip--active'
                      : 'admin-orders__chip'
                  }
                  onClick={() => setStatusFilter(f.id)}
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
                  <th className="admin-orders__th-id">Mã</th>
                  <th>Ảnh</th>
                  <th>Tên dịch vụ</th>
                  <th>Loại thú cưng</th>
                  <th>Thời lượng</th>
                  <th>Giá từ (₫)</th>
                  <th>Nổi bật</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="admin-products__empty">
                      Đang tải danh sách dịch vụ...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="admin-products__empty">
                      Chưa có dịch vụ hoặc cần bật API Node (/services).
                    </td>
                  </tr>
                ) : (
                  filteredList.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className="admin-orders__id">{s.id}</span>
                      </td>
                      <td>
                        <ServiceThumb image={s.image} name={s.name} />
                      </td>
                      <td className="admin-orders__name">{s.name}</td>
                      <td>{petLabel(s.petType)}</td>
                      <td>
                        {s.duration != null
                          ? `${s.duration} ${s.unit === 'ngay' ? 'ngày' : 'phút'}`
                          : '—'}
                      </td>
                      <td className="admin-orders__td-num">{formatPrice(priceFrom(s))}</td>
                      <td>
                        {isServiceFeatured(s) ? (
                          <span className="admin-orders__status-pill admin-orders__status-pill--completed">
                            Nổi bật
                          </span>
                        ) : (
                          <span className="admin-orders__status-pill">Thường</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`admin-orders__status-pill admin-orders__status-pill--${
                            (s.status || 'active') === 'active' ? 'completed' : 'cancelled'
                          }`}
                        >
                          {(s.status || 'active') === 'active' ? 'Đang áp dụng' : 'Tạm ngưng'}
                        </span>
                      </td>
                      <td className="admin-orders__td-actions">
                        <div className="admin-orders__row-actions">
                          <button
                            type="button"
                            className="btn-icon"
                            title={adminRouteMissing ? 'Cần restart backend' : 'Sửa'}
                            onClick={() => openEdit(s)}
                            disabled={adminRouteMissing}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title={
                              adminRouteMissing
                                ? 'Cần restart backend'
                                : isServiceFeatured(s)
                                  ? 'Bỏ nổi bật'
                                  : 'Đặt nổi bật'
                            }
                            onClick={() => onToggleFeatured(s)}
                            disabled={adminRouteMissing}
                          >
                            {isServiceFeatured(s) ? '★' : '☆'}
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title={
                              adminRouteMissing
                                ? 'Cần restart backend'
                                : (s.status || 'active') === 'active'
                                  ? 'Tạm ngưng'
                                  : 'Bật bán lại'
                            }
                            onClick={() => onToggleStatus(s)}
                            disabled={adminRouteMissing}
                          >
                            {(s.status || 'active') === 'active' ? '⏸' : '▶'}
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-icon--danger"
                            title={adminRouteMissing ? 'Cần restart backend' : 'Xóa'}
                            onClick={() => onDelete(s)}
                            disabled={adminRouteMissing}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div
        className={`modal-backdrop${modalOpen ? ' is-open' : ''}`}
        role="presentation"
        onClick={closeModal}
      >
        <div
          className="modal modal--product"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-service-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal__header modal__header--product">
            <div>
              <h2 className="modal__title" id="admin-service-modal-title">
                {form.id ? 'Sửa dịch vụ spa' : 'Thêm dịch vụ spa'}
              </h2>
              <p className="product-modal__sku product-modal__sku--muted">
                Điền đầy đủ thông tin để lưu vào bảng `dich_vu_spa`
              </p>
            </div>
            <button
              type="button"
              className="btn-icon modal__close modal__close--on-dark"
              aria-label="Đóng"
              onClick={closeModal}
            >
              Đóng
            </button>
          </div>
          <form onSubmit={onSave}>
            <div className="modal__body modal__body--product">
              <section className="product-modal__section">
                <h3 className="product-modal__section-title">Thông tin cơ bản</h3>
                <div className="form-grid form-grid--product">
                  <div className="form-field">
                    <label>Tên dịch vụ *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  {form.id ? (
                    <div className="form-field">
                      <label>Mã dịch vụ</label>
                      <input value={form.id} readOnly />
                    </div>
                  ) : null}
                  <div className="form-field">
                    <label>Đối tượng</label>
                    <select
                      value={form.petType}
                      onChange={(e) => setForm((f) => ({ ...f, petType: e.target.value }))}
                    >
                      <option value="both">Chó & mèo</option>
                      <option value="cho">Chó</option>
                      <option value="meo">Mèo</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Trạng thái</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    >
                      <option value="active">Đang áp dụng</option>
                      <option value="inactive">Tạm ngưng</option>
                    </select>
                  </div>
                  <div className="form-field form-field--span2">
                    <label className="product-modal__best">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                      />
                      <span className="product-modal__best-text">
                        <span className="product-modal__best-title">Dịch vụ nổi bật</span>
                        <span className="product-modal__best-desc">
                          Hiển thị ưu tiên ở trang chủ và danh sách dịch vụ
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              <section className="product-modal__section">
                <h3 className="product-modal__section-title">Giá & thời lượng</h3>
                <div className="form-grid form-grid--product">
                  {(form.petType === 'cho' || form.petType === 'both') && (
                    <div className="form-field">
                      <label>Giá chó (₫)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.priceDog}
                        onChange={(e) => setForm((f) => ({ ...f, priceDog: e.target.value }))}
                      />
                    </div>
                  )}
                  {(form.petType === 'meo' || form.petType === 'both') && (
                    <div className="form-field">
                      <label>Giá mèo (₫)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.priceCat}
                        onChange={(e) => setForm((f) => ({ ...f, priceCat: e.target.value }))}
                      />
                    </div>
                  )}
                  <div className="form-field">
                    <label>Thời lượng</label>
                    <input
                      type="number"
                      min="1"
                      value={form.duration}
                      onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    />
                  </div>
                  <div className="form-field">
                    <label>Đơn vị</label>
                    <select
                      value={form.unit}
                      onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    >
                      <option value="phut">Phút</option>
                      <option value="ngay">Ngày</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Thứ tự hiển thị</label>
                    <input
                      type="number"
                      min="0"
                      value={form.orderNo}
                      onChange={(e) => setForm((f) => ({ ...f, orderNo: e.target.value }))}
                    />
                  </div>
                  <div className="form-field">
                    <label>Ảnh (URL hoặc đường dẫn img/… — hoặc tải file)</label>
                    <input
                      value={form.image}
                      onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                      placeholder="vd. img/ten-anh.jpg hoặc https://..."
                    />
                    <input
                      ref={imagePickerRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: 'none' }}
                      onChange={onServiceImageFile}
                    />
                    <div style={{ marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={onPickImageClick}
                        disabled={imageUploading}
                      >
                        {imageUploading ? 'Đang tải ảnh...' : 'Chọn file ảnh'}
                      </button>
                    </div>
                    {form.image || imageTempUrl ? (
                      <div style={{ marginTop: '0.5rem' }}>
                        {imagePreviewSrc ? (
                          <img
                            src={imagePreviewSrc}
                            alt="Xem trước ảnh dịch vụ"
                            className="table-product__thumb-img--sm"
                            style={{ width: '56px', height: '56px', borderRadius: '10px' }}
                          />
                        ) : (
                          <div className="table-product__thumb table-product__thumb--spa" />
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="form-field form-field--span2">
                    <label>Mô tả</label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                </div>
              </section>
            </div>
            <div className="modal__footer modal__footer--product">
              <button type="button" className="btn btn--ghost" onClick={closeModal}>
                Hủy
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu dịch vụ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

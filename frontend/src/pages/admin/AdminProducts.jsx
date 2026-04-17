/**
 * Admin CRUD sản phẩm: form, upload ảnh, kích cỡ JSON, gọi adminApi + products API.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { fetchProductsAll } from '../../api/products.js'
import { postProductSave, postProductDelete, postProductImageUpload } from '../../api/adminApi.js'
import { fetchAdminCategories } from '../../api/adminApi.js'
import { formatPrice } from '../../utils/format.js'
import { getProductImageSrc } from '../../utils/assets.js'

/** Khớp `ma_danh_muc` trong MySQL — không dùng «tat-ca» làm FK sản phẩm */
const FALLBACK_CATEGORY_OPTIONS = [
  { value: 'cham-soc', label: 'Chăm sóc - spa' },
  { value: 'thuc-an', label: 'Thức ăn' },
  { value: 'phu-kien', label: 'Phụ kiện' },
  { value: 'do-choi', label: 'Đồ chơi' },
]

function categoryLabel(slug) {
  const m = {
    'thuc-an': 'Thức ăn',
    'cham-soc': 'Chăm sóc - spa',
    'phu-kien': 'Phụ kiện',
    'do-choi': 'Đồ chơi',
    'tat-ca': 'Tất cả',
  }
  return m[slug] || slug || '—'
}

function normalizeCategoryForForm(cat, options) {
  const allowed = (options || []).map((c) => c.value)
  const c = String(cat ?? '').trim()
  if (allowed.includes(c)) return c
  if (allowed.length) return allowed[0]
  return 'cham-soc'
}

function defaultProductCategory(options) {
  const list = (options || []).filter((c) => !isAllCategoryFilter(c.value))
  return list[0]?.value ?? 'cham-soc'
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

function isAllCategoryFilter(id) {
  const key = String(id || '').trim().toLowerCase()
  return key === 'all' || key === 'tat-ca'
}

function thumbPlaceholderClass(pet) {
  if (pet === 'cho' || pet === 'dog')
    return 'table-product__thumb table-product__thumb--dog table-product__thumb--round'
  if (pet === 'meo' || pet === 'cat')
    return 'table-product__thumb table-product__thumb--cat table-product__thumb--round'
  return 'table-product__thumb table-product__thumb--spa table-product__thumb--round'
}

function ProductTableThumb({ image, petType, name }) {
  const [broken, setBroken] = useState(false)
  const src = getProductImageSrc(image || '')
  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name ? `Ảnh ${name}` : ''}
        className="table-product__thumb-img table-product__thumb--round"
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
      />
    )
  }
  return <div className={thumbPlaceholderClass(petType)} aria-hidden />
}

function ProductModalImagePreview({ image, tempUrl }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => {
    setBroken(false)
  }, [image, tempUrl])
  const src = tempUrl || getProductImageSrc(image || '')
  const show = Boolean(src && !broken)
  return (
    <div className="product-modal__preview">
      {show ? (
        <img src={src} alt="" onError={() => setBroken(true)} />
      ) : (
        <span className="product-modal__preview-empty">Chưa có ảnh</span>
      )}
    </div>
  )
}

function stockSaleStatus(p) {
  if (p.status === 'inactive') {
    return { label: 'Tạm ẩn', pill: 'pill pill--default' }
  }
  const s = p.stock
  const n = s === '' || s == null ? NaN : Number(s)
  if (Number.isFinite(n)) {
    if (n <= 0) return { label: 'Hết hàng', pill: 'pill pill--danger' }
    if (n < 10) return { label: 'Sắp hết', pill: 'pill pill--warning' }
  }
  return { label: 'Đang bán', pill: 'pill pill--success' }
}

function exportProductsCsv(rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const headers = ['Mã', 'Tên', 'Danh mục', 'Giá', 'Tồn kho', 'Trạng thái']
  const lines = [
    headers.join(','),
    ...rows.map((p) => {
      const { label } = stockSaleStatus(p)
      return [
        p.id,
        p.name,
        categoryLabel(p.category),
        p.price,
        p.stock ?? '',
        label,
      ]
        .map(esc)
        .join(',')
    }),
  ]
  const blob = new Blob(['\ufeff' + lines.join('\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `san-pham-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

const noop = () => {}

function normalizeSizeRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((r) => ({
    label: String(r?.label || '').trim(),
    price: r?.price == null ? '' : String(r.price),
    oldPrice: r?.oldPrice == null || r.oldPrice === '' ? '' : String(r.oldPrice),
    stock: r?.stock == null || r.stock === '' ? '' : String(r.stock),
  }))
}

const emptyForm = {
  id: '',
  name: '',
  slug: '',
  price: 0,
  oldPrice: '',
  category: 'cham-soc',
  petType: 'both',
  image: '',
  stock: 0,
  bestSeller: false,
  status: 'active',
  description: '',
  storageGuide: '',
  safetyGuide: '',
  sizesRows: [],
}

const ADMIN_PRODUCTS_PAGE_SIZE = 10

export default function AdminProducts() {
  const { productSearch = '', registerProductAdd } = useOutletContext() ?? {}
  const [list, setList] = useState([])
  const [categories, setCategories] = useState([])
  const [err, setErr] = useState(null)
  const [msg, setMsg] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageTempUrl, setImageTempUrl] = useState(null)
  const imageTempUrlRef = useRef(null)
  const productImageFileRef = useRef(null)
  /** Khi xóa bị chặn (còn trong đơn hàng), lưu dòng sản phẩm để gợi ý «Ngừng bán». */
  const [deleteBlockProduct, setDeleteBlockProduct] = useState(null)
  const [markingInactive, setMarkingInactive] = useState(false)
  const categoryOptions = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((c) => ({
        value: c.id,
        label: c.name || categoryLabel(c.id),
      }))
    }
    return FALLBACK_CATEGORY_OPTIONS
  }, [categories])
  const categoryFilters = useMemo(
    () => [
      { id: 'all', label: 'Tất cả' },
      ...categoryOptions
        .filter((c) => !isAllCategoryFilter(c.value))
        .map((c) => ({ id: c.value, label: c.label })),
    ],
    [categoryOptions]
  )

  /** Chỉ danh mục gán được cho sản phẩm (bỏ «Tất cả» / tat-ca) */
  const productCategoryOptions = useMemo(
    () => categoryOptions.filter((c) => !isAllCategoryFilter(c.value)),
    [categoryOptions]
  )

  const revokeProductImageTemp = useCallback(() => {
    if (imageTempUrlRef.current) {
      URL.revokeObjectURL(imageTempUrlRef.current)
      imageTempUrlRef.current = null
    }
    setImageTempUrl(null)
  }, [])

  async function onProductImageFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) {
      setErr('Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc GIF.')
      return
    }
    revokeProductImageTemp()
    const blobUrl = URL.createObjectURL(file)
    imageTempUrlRef.current = blobUrl
    setImageTempUrl(blobUrl)
    setImageUploading(true)
    setErr(null)
    try {
      const relPath = await postProductImageUpload(file)
      setForm((f) => ({ ...f, image: relPath }))
      revokeProductImageTemp()
      setMsg('Đã tải ảnh lên thư mục img/.')
    } catch (err) {
      revokeProductImageTemp()
      setErr(err.message || 'Tải ảnh thất bại')
    } finally {
      setImageUploading(false)
    }
  }

  const load = useCallback(async () => {
    setErr(null)
    setDeleteBlockProduct(null)
    setLoading(true)
    try {
      const [rows, cats] = await Promise.all([fetchProductsAll(), fetchAdminCategories()])
      setList(rows)
      setCategories(Array.isArray(cats) ? cats : [])
    } catch (e) {
      setErr(e.message)
      setList([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openNew = useCallback(() => {
    revokeProductImageTemp()
    setForm({
      ...emptyForm,
      category: defaultProductCategory(productCategoryOptions),
    })
    setModal('edit')
    setMsg(null)
  }, [revokeProductImageTemp, productCategoryOptions])

  const openEdit = useCallback(
    (p) => {
      revokeProductImageTemp()
      setForm({
        id: p.id,
        name: p.name || '',
        slug: p.slug || '',
        price: Number(p.price) || 0,
        oldPrice: p.oldPrice != null ? p.oldPrice : '',
        category: normalizeCategoryForForm(p.category || 'cham-soc', productCategoryOptions),
        petType: p.petType || 'both',
        image: p.image || '',
        stock: p.stock != null ? p.stock : 0,
        bestSeller: Boolean(p.bestSeller),
        status: p.status === 'inactive' ? 'inactive' : 'active',
        description: p.description || '',
        storageGuide: p.storageGuide || '',
        safetyGuide: p.safetyGuide || '',
        sizesRows: normalizeSizeRows(Array.isArray(p.sizes) ? p.sizes : []),
      })
      setModal('edit')
      setMsg(null)
    },
    [revokeProductImageTemp, productCategoryOptions]
  )

  useEffect(() => {
    if (typeof registerProductAdd !== 'function') return
    registerProductAdd(openNew)
    return () => registerProductAdd(noop)
  }, [registerProductAdd, openNew])

  function closeModal() {
    revokeProductImageTemp()
    setImageUploading(false)
    setModal(null)
  }

  async function onSave(e) {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    setMsg(null)
    try {
      const sizeRows = normalizeSizeRows(form.sizesRows)
      const hasInvalidSize = sizeRows.some(
        (r) =>
          r.label &&
          (r.price === '' || Number.isNaN(Number(r.price)) || Number(r.price) < 0)
      )
      if (hasInvalidSize) {
        setErr('Vui lòng nhập giá hợp lệ cho mỗi quy cách đã có nhãn.')
        setSaving(false)
        return
      }
      const sizesPayload = sizeRows
        .filter((r) => r.label)
        .map((r) => ({
          label: r.label,
          price: Number(r.price),
          oldPrice: r.oldPrice === '' ? null : Number(r.oldPrice),
          stock: r.stock === '' ? null : Number(r.stock),
        }))
      const petTypePhp = form.petType === 'both' ? 'ca_hai' : form.petType
      const payload = {
        id: form.id || undefined,
        name: form.name.trim(),
        slug: slugifyVi(form.name) || form.slug.trim(),
        price: Number(form.price),
        oldPrice: form.oldPrice === '' ? null : Number(form.oldPrice),
        category: normalizeCategoryForForm(form.category, productCategoryOptions),
        petType: petTypePhp,
        image: form.image.trim() || null,
        stock: form.stock === '' ? null : Number(form.stock),
        bestSeller: form.bestSeller ? 1 : 0,
        status: form.status,
        description: form.description.trim() || null,
        storageGuide: form.storageGuide.trim() || null,
        safetyGuide: form.safetyGuide.trim() || null,
        sizes: sizesPayload,
      }
      await postProductSave(payload)
      setMsg(form.id ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm.')
      closeModal()
      await load()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  function buildSavePayloadFromProduct(p, status) {
    const sizeRows = normalizeSizeRows(Array.isArray(p.sizes) ? p.sizes : [])
    const sizesPayload = sizeRows
      .filter((r) => r.label)
      .map((r) => ({
        label: r.label,
        price: Number(r.price),
        oldPrice: r.oldPrice === '' ? null : Number(r.oldPrice),
        stock: r.stock === '' ? null : Number(r.stock),
      }))
    let petTypePhp = 'ca_hai'
    if (p.petType === 'dog' || p.petType === 'cho') petTypePhp = 'cho'
    else if (p.petType === 'cat' || p.petType === 'meo') petTypePhp = 'meo'
    else if (p.petType === 'both') petTypePhp = 'ca_hai'
    const slug =
      (p.slug && String(p.slug).trim()) || slugifyVi(p.name) || String(p.id || '')
    return {
      id: p.id,
      name: String(p.name || '').trim(),
      slug,
      price: Number(p.price) || 0,
      oldPrice: p.oldPrice === '' || p.oldPrice == null ? null : Number(p.oldPrice),
      category: normalizeCategoryForForm(p.category || 'cham-soc', productCategoryOptions),
      petType: petTypePhp,
      image: p.image && String(p.image).trim() ? String(p.image).trim() : null,
      stock: p.stock === '' || p.stock == null ? null : Number(p.stock),
      bestSeller: p.bestSeller ? 1 : 0,
      status,
      description: p.description && String(p.description).trim() ? String(p.description).trim() : null,
      storageGuide: p.storageGuide && String(p.storageGuide).trim() ? String(p.storageGuide).trim() : null,
      safetyGuide: p.safetyGuide && String(p.safetyGuide).trim() ? String(p.safetyGuide).trim() : null,
      sizes: sizesPayload,
    }
  }

  async function onMarkInactiveFromDeleteBlock() {
    const p = deleteBlockProduct
    if (!p) return
    setMarkingInactive(true)
    setErr(null)
    setMsg(null)
    try {
      await postProductSave(buildSavePayloadFromProduct(p, 'inactive'))
      setDeleteBlockProduct(null)
      setMsg('Đã chuyển sản phẩm sang «Ngừng bán» — không hiển thị ở cửa hàng, dữ liệu đơn cũ vẫn giữ nguyên.')
      await load()
    } catch (e) {
      setErr(e.message)
    } finally {
      setMarkingInactive(false)
    }
  }

  async function onDelete(p) {
    if (!window.confirm(`Xóa sản phẩm «${p.name}» (${p.id})?`)) return
    setErr(null)
    setDeleteBlockProduct(null)
    try {
      await postProductDelete(p.id)
      setMsg('Đã xóa sản phẩm.')
      await load()
    } catch (e) {
      const m = e.message || ''
      if (/đã xuất hiện trong \d+ dòng đơn hàng|Không thể xóa:.*đơn hàng/i.test(m)) {
        setDeleteBlockProduct(p)
      }
      setErr(m)
    }
  }

  const filteredList = useMemo(() => {
    let rows = list
    if (!isAllCategoryFilter(filterCat)) {
      rows = rows.filter((p) => (p.category || '') === filterCat)
    }
    const q = productSearch.trim().toLowerCase()
    if (q) {
      rows = rows.filter((p) => {
        const id = String(p.id ?? '')
        const name = (p.name || '').toLowerCase()
        const slug = (p.slug || '').toLowerCase()
        return id.includes(q) || name.includes(q) || slug.includes(q)
      })
    }
    return rows
  }, [list, filterCat, productSearch])

  const totalPages = Math.max(1, Math.ceil(filteredList.length / ADMIN_PRODUCTS_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const pagedList = useMemo(() => {
    const start = (currentPage - 1) * ADMIN_PRODUCTS_PAGE_SIZE
    return filteredList.slice(start, start + ADMIN_PRODUCTS_PAGE_SIZE)
  }, [filteredList, currentPage])

  useEffect(() => {
    setPage(1)
  }, [filterCat, productSearch])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const listRange = useMemo(() => {
    if (filteredList.length === 0) return null
    const start = (currentPage - 1) * ADMIN_PRODUCTS_PAGE_SIZE + 1
    const end = Math.min(currentPage * ADMIN_PRODUCTS_PAGE_SIZE, filteredList.length)
    return { start, end }
  }, [filteredList, currentPage])

  function productMetaLine(p) {
    const d = (p.description || '').trim()
    if (d.length > 0) return d.length > 48 ? `${d.slice(0, 48)}…` : d
    return p.slug || `SKU · ${p.petType || '—'}`
  }

  return (
    <div className="admin-products">
      {err ? (
        <div className="admin-alert admin-alert--err" role="alert">
          <div>{err}</div>
          {deleteBlockProduct ? (
            <div className="admin-alert__actions">
              <button
                type="button"
                className="btn btn--primary btn--sm"
                disabled={markingInactive}
                onClick={() => void onMarkInactiveFromDeleteBlock()}
              >
                {markingInactive ? 'Đang cập nhật…' : 'Chuyển sang ngừng bán'}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                disabled={markingInactive}
                onClick={() => {
                  setErr(null)
                  setDeleteBlockProduct(null)
                }}
              >
                Đóng cảnh báo
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
      {msg ? <div className="admin-alert admin-alert--ok">{msg}</div> : null}

      <section className="section admin-products__table-section">
        <div className="card card--table admin-products__card">
          <div className="card__header admin-products__card-header">
            <div className="admin-products__card-header-row">
              <div>
                <h2 className="card__title">Danh sách sản phẩm</h2>
                <p className="card__subtitle">
                  {loading
                    ? 'Đang tải…'
                    : listRange
                      ? `Hiển thị ${listRange.start}–${listRange.end} / ${filteredList.length} mặt hàng đang lọc · ${list.length} trong kho`
                      : `${filteredList.length} / ${list.length} mặt hàng`}
                </p>
              </div>
              <div
                className="admin-products__card-actions"
                role="toolbar"
                aria-label="Xuất và nhập dữ liệu"
              >
                <button type="button" className="btn btn--ghost btn--sm" disabled>
                  Nhập file Excel
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => exportProductsCsv(filteredList)}
                  disabled={loading || filteredList.length === 0}
                >
                  Xuất CSV
                </button>
              </div>
            </div>
            <div className="admin-products__filter-pills" role="group" aria-label="Lọc danh mục">
              {categoryFilters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`filter-pill${filterCat === f.id ? ' filter-pill--active' : ''}`}
                  onClick={() => setFilterCat(isAllCategoryFilter(f.id) ? 'all' : f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="table-wrapper admin-products__table-wrap">
            <table className="table table--products">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá bán</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th className="table__actions" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="admin-products__empty">
                      Đang tải dữ liệu từ GET /api/products…
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-products__empty">
                      {list.length === 0
                        ? 'Chưa có sản phẩm hoặc lỗi kết nối — chạy backend (npm start trong backend/), import database/petcare_spa_vi.sql và kiểm tra backend/.env (DB_*).'
                        : 'Không có sản phẩm khớp bộ lọc / từ khóa.'}
                    </td>
                  </tr>
                ) : (
                  pagedList.map((p) => {
                    const st = stockSaleStatus(p)
                    return (
                      <tr key={p.id}>
                        <td>
                          <code className="admin-products__code">{p.id}</code>
                        </td>
                        <td>
                          <div className="table-product">
                            <ProductTableThumb
                              image={p.image}
                              petType={p.petType}
                              name={p.name}
                            />
                            <div>
                              <div className="table-product__name">{p.name}</div>
                              <div className="table-product__meta">{productMetaLine(p)}</div>
                            </div>
                          </div>
                        </td>
                        <td>{categoryLabel(p.category)}</td>
                        <td>{formatPrice(p.price)}</td>
                        <td>
                          {p.stock === '' || p.stock == null ? '—' : p.stock}
                        </td>
                        <td>
                          <span className={st.pill}>{st.label}</span>
                        </td>
                        <td className="table__actions">
                          <button
                            type="button"
                            className="btn-icon btn-icon--edit"
                            title="Sửa"
                            onClick={() => openEdit(p)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-icon--delete-purple"
                            title="Xóa"
                            onClick={() => onDelete(p)}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredList.length > 0 ? (
            <div className="admin-products__pagination">
              <p className="admin-products__pagination-meta">
                Trang {currentPage}/{totalPages} · {ADMIN_PRODUCTS_PAGE_SIZE} sản phẩm / trang
              </p>
              <div className="admin-products__pagination-actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  Trước
                </button>
                <span className="admin-products__pagination-page">
                  {currentPage} / {totalPages}
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

      <div
        className={`modal-backdrop${modal === 'edit' ? ' is-open' : ''}`}
        role="presentation"
        onClick={closeModal}
      >
        <div
          className="modal modal--product"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-product-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal__header modal__header--product">
            <div>
              <h2 className="modal__title" id="admin-product-modal-title">
                {form.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
              </h2>
              {form.id ? (
                <p className="product-modal__sku">
                  Mã <code>{form.id}</code>
                </p>
              ) : (
                <p className="product-modal__sku product-modal__sku--muted">
                  Điền thông tin · lưu vào cửa hàng Spapet
                </p>
              )}
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
              <section className="product-modal__section" aria-label="Thông tin cơ bản">
                <h3 className="product-modal__section-title">Thông tin cơ bản</h3>
                <div className="form-grid form-grid--product">
                  <div className="form-field form-field--span2">
                    <label htmlFor="pf-name">Tên sản phẩm *</label>
                    <input
                      id="pf-name"
                      required
                      autoComplete="off"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                </div>
              </section>

              <section className="product-modal__section" aria-label="Giá và tồn kho">
                <h3 className="product-modal__section-title">Giá &amp; tồn kho</h3>
                <div className="form-grid form-grid--product">
                  <div className="form-field">
                    <label htmlFor="pf-price">Giá bán * (₫)</label>
                    <input
                      id="pf-price"
                      type="number"
                      min="0"
                      required
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="pf-old">Giá gốc / giá cũ</label>
                    <input
                      id="pf-old"
                      type="number"
                      min="0"
                      placeholder="Để trống nếu không giảm giá"
                      value={form.oldPrice}
                      onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value }))}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="pf-stock">Tồn kho</label>
                    <input
                      id="pf-stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    />
                  </div>
                </div>
              </section>

              <section className="product-modal__section" aria-label="Phân loại và hiển thị">
                <h3 className="product-modal__section-title">Phân loại &amp; hiển thị</h3>
                <div className="form-grid form-grid--product">
                  <div className="form-field">
                    <label htmlFor="pf-cat">Danh mục</label>
                    <select
                      id="pf-cat"
                      value={normalizeCategoryForForm(form.category, productCategoryOptions)}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                    >
                      {productCategoryOptions.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="pf-pet">Đối tượng</label>
                    <select
                      id="pf-pet"
                      value={form.petType}
                      onChange={(e) => setForm((f) => ({ ...f, petType: e.target.value }))}
                    >
                      <option value="both">Cả hai</option>
                      <option value="cho">Chó</option>
                      <option value="meo">Mèo</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="pf-status">Trạng thái</label>
                    <select
                      id="pf-status"
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    >
                      <option value="active">Đang bán</option>
                      <option value="inactive">Tạm ẩn</option>
                    </select>
                  </div>
                </div>
              </section>

              <section
                className="product-modal__section product-modal__section--media"
                aria-label="Hình ảnh sản phẩm"
              >
                <h3 className="product-modal__section-title">Hình ảnh</h3>
                <div className="product-modal__media">
                  <ProductModalImagePreview image={form.image} tempUrl={imageTempUrl} />
                  <div className="product-modal__media-fields">
                    <div className="product-modal__image-sources">
                      <div className="product-modal__image-row">
                        <span className="product-modal__image-step" aria-hidden>
                          1
                        </span>
                        <div className="product-modal__image-row-body">
                          <span className="product-modal__image-row-title">
                            Chọn ảnh từ máy
                          </span>
                          <p className="product-modal__image-row-desc">
                            Tải lên server, lưu trong <code>img/</code> và gán đường dẫn tự động.
                          </p>
                          <input
                            ref={productImageFileRef}
                            type="file"
                            className="visually-hidden"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            aria-label="Chọn file ảnh từ máy"
                            disabled={imageUploading}
                            onChange={onProductImageFile}
                          />
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm product-modal__pick-file"
                            disabled={imageUploading}
                            onClick={() => productImageFileRef.current?.click()}
                          >
                            {imageUploading ? 'Đang tải lên…' : 'Chọn file ảnh…'}
                          </button>
                        </div>
                      </div>
                      <div className="product-modal__image-divider" role="separator">
                        <span>hoặc</span>
                      </div>
                      <div className="product-modal__image-row">
                        <span className="product-modal__image-step" aria-hidden>
                          2
                        </span>
                        <div className="product-modal__image-row-body">
                          <label className="product-modal__image-row-title" htmlFor="pf-img">
                            Nhập đường dẫn hoặc URL
                          </label>
                          <p className="product-modal__image-row-desc">
                            Đường dẫn tương đối (vd. <code>img/ten.jpg</code>) hoặc link{' '}
                            <code>https://…</code>
                          </p>
                          <input
                            id="pf-img"
                            autoComplete="off"
                            placeholder="img/ten-file.jpg hoặc https://…"
                            value={form.image}
                            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="product-modal__section product-modal__section--flat">
                <label className="product-modal__best">
                  <input
                    id="pf-bs"
                    type="checkbox"
                    checked={form.bestSeller}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bestSeller: e.target.checked }))
                    }
                  />
                  <span className="product-modal__best-text">
                    <span className="product-modal__best-title">Bán chạy</span>
                    <span className="product-modal__best-desc">Đánh dấu nổi bật trên cửa hàng</span>
                  </span>
                </label>
              </div>

              <section className="product-modal__section" aria-label="Mô tả">
                <h3 className="product-modal__section-title">Mô tả</h3>
                <div className="form-field">
                  <label htmlFor="pf-desc" className="visually-hidden">
                    Mô tả sản phẩm
                  </label>
                  <textarea
                    id="pf-desc"
                    rows={4}
                    placeholder="Mô tả ngắn cho khách hàng…"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="form-field" style={{ marginTop: '0.6rem' }}>
                  <label htmlFor="pf-storage">Bảo quản &amp; hạn sử dụng</label>
                  <textarea
                    id="pf-storage"
                    rows={3}
                    placeholder="Ví dụ: Bảo quản nơi khô ráo, tránh ánh nắng trực tiếp..."
                    value={form.storageGuide}
                    onChange={(e) => setForm((f) => ({ ...f, storageGuide: e.target.value }))}
                  />
                </div>
                <div className="form-field" style={{ marginTop: '0.6rem' }}>
                  <label htmlFor="pf-safety">Hướng dẫn an toàn</label>
                  <textarea
                    id="pf-safety"
                    rows={3}
                    placeholder="Ví dụ: Tránh tiếp xúc mắt, ngừng dùng khi có kích ứng..."
                    value={form.safetyGuide}
                    onChange={(e) => setForm((f) => ({ ...f, safetyGuide: e.target.value }))}
                  />
                </div>
              </section>
            </div>
            <div className="modal__footer modal__footer--product">
              <button type="button" className="btn btn--ghost" onClick={closeModal}>
                Hủy
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Đang lưu…' : 'Lưu sản phẩm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

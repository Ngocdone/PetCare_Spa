/**
 * Danh mục sản phẩm admin: CRUD qua adminApi (REST categories).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteAdminCategory,
  fetchAdminCategories,
  patchAdminCategory,
  postAdminCategory,
} from '../../api/adminApi.js'

function petLabel(pt) {
  if (pt === 'cho') return 'Chó'
  if (pt === 'meo') return 'Mèo'
  if (pt === 'both') return 'Chó & mèo'
  return pt || '—'
}

const emptyForm = {
  slug: '',
  name: '',
  description: '',
  petTarget: 'both',
  parentId: '',
}

export default function AdminCategories() {
  const [list, setList] = useState([])
  const [err, setErr] = useState(null)
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  /** `null` = thêm mới; string = mã danh mục đang sửa */
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    setErr(null)
    setLoading(true)
    try {
      const rows = await fetchAdminCategories()
      setList(rows)
    } catch (e) {
      setErr(e.message)
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const nameById = useMemo(() => {
    const m = {}
    for (const c of list) m[c.id] = c.name
    return m
  }, [list])

  const parentOptions = useMemo(() => {
    return list
      .filter((c) => c.id !== editingId)
      .slice()
      .sort((a, b) => (a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.id.localeCompare(b.id)))
  }, [list, editingId])

  function openNew() {
    setForm({ ...emptyForm })
    setEditingId(null)
    setModalOpen(true)
    setMsg(null)
    setErr(null)
  }

  function openEdit(c) {
    setEditingId(c.id)
    setForm({
      slug: c.id,
      name: c.name || '',
      description: c.description || '',
      petTarget: c.petTarget || 'both',
      parentId: c.parentId || '',
    })
    setModalOpen(true)
    setMsg(null)
    setErr(null)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function onSave(e) {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        petTarget: form.petTarget,
        parentId: form.parentId || '',
        icon: '',
        sortOrder: 0,
      }
      if (editingId) {
        await patchAdminCategory(editingId, body)
        setMsg('Đã cập nhật danh mục.')
      } else {
        await postAdminCategory({ ...body, id: form.slug.trim() })
        setMsg('Đã thêm danh mục.')
      }
      closeModal()
      await load()
    } catch (e) {
      setErr(e.message || 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(c) {
    const ok = window.confirm(
      `Xóa danh mục "${c.name}" (${c.id})? Chỉ xóa được khi không còn sản phẩm và danh mục con.`
    )
    if (!ok) return
    setErr(null)
    try {
      await deleteAdminCategory(c.id)
      setMsg('Đã xóa danh mục.')
      await load()
    } catch (e) {
      setErr(e.message || 'Xóa thất bại')
    }
  }

  return (
    <>
      {err ? <div className="admin-alert admin-alert--err">{err}</div> : null}
      {msg ? (
        <div className="admin-alert admin-alert--ok" role="status">
          {msg}
        </div>
      ) : null}

      <section className="section">
        <div className="card card--table">
          <div className="card__header card__header--between">
            <div>
              <h2 className="card__title">Danh mục sản phẩm</h2>
            </div>
            <button type="button" className="btn btn--primary" onClick={openNew}>
              + Thêm danh mục
            </button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên</th>
                  <th>Đối tượng</th>
                  <th>Danh mục cha</th>
                  <th>Sản phẩm</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '1rem', color: '#6b7280' }}>
                      Đang tải…
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '1rem', color: '#6b7280' }}>
                      Chưa có danh mục hoặc API chưa chạy.
                    </td>
                  </tr>
                ) : (
                  list.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <code className="admin-products__code">{c.id}</code>
                      </td>
                      <td>{c.name}</td>
                      <td>{petLabel(c.petTarget)}</td>
                      <td>
                        {c.parentId
                          ? `${nameById[c.parentId] || c.parentId}`
                          : '—'}
                      </td>
                      <td>{c.productCount}</td>
                      <td className="table__actions">
                        <button
                          type="button"
                          className="btn-icon btn-icon--edit"
                          title="Sửa"
                          onClick={() => openEdit(c)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-icon--delete-purple"
                          title="Xóa"
                          onClick={() => onDelete(c)}
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
          aria-labelledby="admin-cat-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal__header modal__header--product">
            <div>
              <h2 className="modal__title" id="admin-cat-modal-title">
                {editingId ? 'Sửa danh mục' : 'Thêm danh mục'}
              </h2>
              {editingId ? (
                <p className="product-modal__sku">
                  Mã <code>{editingId}</code> (không đổi)
                </p>
              ) : (
                <p className="product-modal__sku product-modal__sku--muted">
                  Slug chỉ gồm chữ thường, số và dấu gạch — có thể để trống để tự tạo từ tên.
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
              <section className="product-modal__section" aria-label="Thông tin">
                <h3 className="product-modal__section-title">Thông tin</h3>
                <div className="form-grid form-grid--product">
                  {!editingId ? (
                    <div className="form-field form-field--span2">
                      <label htmlFor="cf-slug">Mã danh mục (slug)</label>
                      <input
                        id="cf-slug"
                        autoComplete="off"
                        placeholder="vd. thuc-an-kho"
                        value={form.slug}
                        onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      />
                    </div>
                  ) : null}
                  <div className="form-field form-field--span2">
                    <label htmlFor="cf-name">Tên hiển thị *</label>
                    <input
                      id="cf-name"
                      required
                      autoComplete="off"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="cf-parent">Danh mục cha</label>
                    <select
                      id="cf-parent"
                      value={form.parentId}
                      onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                    >
                      <option value="">Không có (gốc)</option>
                      {parentOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="cf-pet">Đối tượng</label>
                    <select
                      id="cf-pet"
                      value={form.petTarget}
                      onChange={(e) => setForm((f) => ({ ...f, petTarget: e.target.value }))}
                    >
                      <option value="both">Cả hai</option>
                      <option value="cho">Chó</option>
                      <option value="meo">Mèo</option>
                    </select>
                  </div>
                  <div className="form-field form-field--span2">
                    <label htmlFor="cf-desc">Mô tả</label>
                    <textarea
                      id="cf-desc"
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
                {saving ? 'Đang lưu…' : editingId ? 'Cập nhật' : 'Tạo danh mục'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

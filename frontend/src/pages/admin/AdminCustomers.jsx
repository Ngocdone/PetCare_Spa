/**
 * Khách hàng: danh sách user, chi tiêu, hạng, khóa/mở đồng bộ tier (tier thresholds).
 */
import { useCallback, useEffect, useState } from 'react'
import {
  fetchAdminData,
  fetchTierThresholds,
  patchUserTier,
} from '../../api/adminApi.js'

const TIER_LABEL = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  vip: 'VIP',
}

const TIER_KEYS = ['bronze', 'silver', 'gold', 'vip']

function formatVnd(n) {
  const x = Number(n) || 0
  return `${new Intl.NumberFormat('vi-VN').format(x)}\u00a0₫`
}

export default function AdminCustomers() {
  const [users, setUsers] = useState([])
  const [err, setErr] = useState(null)
  const [thresholds, setThresholds] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)

  const load = useCallback(async () => {
    setErr(null)
    try {
      const d = await fetchAdminData()
      setUsers(d.users || [])
    } catch (e) {
      setErr(e.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    fetchTierThresholds()
      .then(setThresholds)
      .catch(() => setThresholds(null))
  }, [])

  const handleSaveTier = async (u) => {
    const t = drafts[u.id] ?? u.tier
    setSavingId(u.id)
    setErr(null)
    try {
      await patchUserTier(u.id, { tier: t, lockAutoTier: true })
      setDrafts((p) => {
        const next = { ...p }
        delete next[u.id]
        return next
      })
      await load()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSavingId(null)
    }
  }

  const handleSyncTier = async (id) => {
    setSavingId(id)
    setErr(null)
    try {
      await patchUserTier(id, { lockAutoTier: false })
      setDrafts((p) => {
        const next = { ...p }
        delete next[id]
        return next
      })
      await load()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSavingId(null)
    }
  }

  const nSilver = users.filter((u) => u.tier === 'silver').length
  const nGold = users.filter((u) => u.tier === 'gold').length
  const nVip = users.filter((u) => u.tier === 'vip').length

  const tierRulesHint =
    thresholds != null
      ? `Tự nâng hạng theo tổng đơn hoàn thành: Silver ≥ ${formatVnd(
          thresholds.silverMin
        )}, Gold ≥ ${formatVnd(thresholds.goldMin)}, VIP ≥ ${formatVnd(
          thresholds.vipMin
        )}.`
      : null

  return (
    <>
      {err ? <div className="admin-alert admin-alert--err">{err}</div> : null}

      <section className="section">
        <div className="section__header">
          <h2 className="section__title">Thống kê khách hàng</h2>
          <span className="section__hint">
            {tierRulesHint ||
              'Hạng có thể khóa khi admin chỉnh tay — mở khóa để đồng bộ lại theo chi tiêu.'}
          </span>
        </div>
        <div className="grid grid--stats admin-customers__stats-grid">
          <div className="card card--stat admin-customers__stat">
            <div className="card__header">
              <span className="card__label">Tổng khách</span>
            </div>
            <div className="card__value">{users.length} khách</div>
          </div>
          <div className="card card--stat admin-customers__stat">
            <div className="card__header">
              <span className="card__label">Hạng Silver</span>
            </div>
            <div className="card__value">{nSilver} khách</div>
          </div>
          <div className="card card--stat admin-customers__stat">
            <div className="card__header">
              <span className="card__label">Hạng Gold</span>
            </div>
            <div className="card__value">{nGold} khách</div>
          </div>
          <div className="card card--stat admin-customers__stat">
            <div className="card__header">
              <span className="card__label">Hạng VIP</span>
            </div>
            <div className="card__value">{nVip} khách</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card card--table">
          <div className="card__header card__header--between">
            <div>
              <h2 className="card__title">Danh sách khách hàng</h2>
              <p className="card__subtitle">
                <strong>Chi tiêu</strong> = tổng <code>tong_tien</code> đơn{' '}
                <strong>hoàn thành</strong> + tổng tiền lịch spa{' '}
                <strong>đã hoàn thành</strong> (theo tài khoản hoặc cùng email).
                Đơn/lịch chưa hoàn thành không cộng. Lưu hạng khóa tự động; dùng
                Đồng bộ để cập nhật lại theo chi tiêu.
              </p>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" disabled>
              Xuất danh sách
            </button>
          </div>
          <div className="table-wrapper">
            <table className="table table--customers">
              <thead>
                <tr>
                  <th>Tên / Email</th>
                  <th>SĐT</th>
                  <th>Vai trò</th>
                  <th>Chi tiêu</th>
                  <th>Hạng</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && !err ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '1rem', color: '#6b7280' }}>
                      Chưa có khách hoặc chưa tải được dữ liệu.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const pick = drafts[u.id] ?? u.tier
                    const dirty = pick !== u.tier
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="table-product__name">{u.name || '—'}</div>
                          <div className="table-product__meta">{u.email || ''}</div>
                        </td>
                        <td>{u.phone || '—'}</td>
                        <td>
                          <span className="pill pill--default">{u.role || 'user'}</span>
                        </td>
                        <td>
                          <span className="table-product__name">
                            {formatVnd(u.totalSpent ?? 0)}
                          </span>
                        </td>
                        <td className="admin-customers__tier-cell">
                          <div className="admin-customers__tier-toolbar">
                            <span
                              className={`admin-customers__tier-mode pill ${
                                u.tierLocked
                                  ? 'admin-customers__tier-mode--lock'
                                  : 'admin-customers__tier-mode--auto'
                              }`}
                              title={
                                u.tierLocked
                                  ? 'Hạng đã chỉnh tay — hệ thống không tự đổi theo chi tiêu'
                                  : 'Hạng cập nhật theo tổng đơn hoàn thành'
                              }
                            >
                              {u.tierLocked ? 'Khóa' : 'Auto'}
                            </span>
                            <select
                              className="input-select admin-customers__tier-select"
                              value={pick}
                              onChange={(e) =>
                                setDrafts((p) => ({ ...p, [u.id]: e.target.value }))
                              }
                              disabled={savingId === u.id}
                              aria-label={`Hạng ${u.name || u.email || u.id}`}
                            >
                              {TIER_KEYS.map((k) => (
                                <option key={k} value={k}>
                                  {TIER_LABEL[k]}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn--primary btn--sm admin-customers__tier-save"
                              disabled={savingId === u.id || !dirty}
                              onClick={() => handleSaveTier(u)}
                            >
                              {savingId === u.id ? '…' : 'Lưu'}
                            </button>
                          </div>
                          {(u.tierLocked ||
                            (u.suggestedTier && u.suggestedTier !== u.tier)) ? (
                            <div className="admin-customers__tier-foot">
                              {u.suggestedTier && u.suggestedTier !== u.tier ? (
                                <span className="admin-customers__tier-hint">
                                  Gợi ý: {TIER_LABEL[u.suggestedTier] || u.suggestedTier}
                                </span>
                              ) : null}
                              {u.tierLocked ? (
                                <button
                                  type="button"
                                  className="admin-customers__tier-sync"
                                  disabled={savingId === u.id}
                                  onClick={() => handleSyncTier(u.id)}
                                >
                                  Đồng bộ chi tiêu
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          {u.createdAt
                            ? String(u.createdAt).replace('T', ' ').slice(0, 16)
                            : '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  )
}

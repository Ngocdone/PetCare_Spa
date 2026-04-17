/**
 * Khung admin: sidebar, đồng bộ user (useSyncUserFromServer), Outlet cho các trang con.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import UserAvatar from '../../components/UserAvatar.jsx'
import { useSyncUserFromServer } from '../../hooks/useSyncUserFromServer.js'
import { getCurrentUser } from '../../utils/auth.js'
import { getUserProfile } from '../../utils/userProfile.js'
import './admin.css'
import { getShopLogoSrc } from '../../utils/assets.js'

const noop = () => {}

const NAV = [
  { to: '/admin', end: true, label: 'Tổng quan' },
  { to: '/admin/products', label: 'Sản phẩm' },
  { to: '/admin/categories', label: 'Danh mục' },
  { to: '/admin/services', label: 'Dịch vụ spa' },
  { to: '/admin/orders', label: 'Đơn hàng' },
  { to: '/admin/customers', label: 'Khách hàng' },
  { to: '/admin/appointments', label: 'Lịch hẹn' },
]

function pageMeta(pathname) {
  if (pathname.includes('/admin/products'))
    return {
      title: 'Quản lý sản phẩm',
      subtitle: null,
    }
  if (pathname.includes('/admin/categories'))
    return {
      title: 'Danh mục sản phẩm',
      subtitle: 'Mã slug, class icon (legacy), danh mục cha và thứ tự hiển thị trên cửa hàng.',
    }
  if (pathname.includes('/admin/services'))
    return {
      title: 'Dịch vụ spa',
      subtitle: 'Quản lý các gói dịch vụ tắm, cắt tỉa, grooming cho thú cưng.',
    }
  if (pathname.includes('/admin/orders'))
    return {
      title: 'Đơn hàng',
      subtitle: 'Theo dõi trạng thái, thanh toán và kênh bán của từng đơn hàng.',
    }
  if (pathname.includes('/admin/customers'))
    return {
      title: 'Khách hàng',
      subtitle:
        'Quản lý thông tin khách, thú cưng, hạng thành viên và điểm thưởng.',
    }
  if (pathname.includes('/admin/appointments'))
    return {
      title: 'Lịch hẹn',
      subtitle: 'Sắp xếp và theo dõi lịch hẹn spa cho thú cưng theo ngày/tuần.',
    }
    return {
    title: 'Tổng quan',
    subtitle:
      'Theo dõi doanh thu, lịch hẹn, kho và khách hàng — chọn mục menu bên trái để xem chi tiết.',
  }
}

export default function AdminLayout() {
  useSyncUserFromServer()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const [userTick, setUserTick] = useState(0)
  const user = getCurrentUser()
  const profile = getUserProfile(user)
  const sidebarUser = user
    ? {
        ...user,
        name: profile.name || user.name || '',
        email: profile.email || user.email || '',
        avatar: (profile.avatar || user.avatar || '').trim(),
      }
    : null
  const productAddRef = useRef(noop)
  const [productSearch, setProductSearch] = useState('')
  const { title, subtitle } = pageMeta(pathname)
  const isProductsAdmin = pathname.includes('/admin/products')

  useEffect(() => {
    if (!isProductsAdmin) {
      setProductSearch('')
      productAddRef.current = noop
    }
  }, [isProductsAdmin])

  useEffect(() => {
    const onUser = () => setUserTick((t) => t + 1)
    window.addEventListener('petspa-user-updated', onUser)
    return () => window.removeEventListener('petspa-user-updated', onUser)
  }, [])

  const registerProductAdd = useCallback((fn) => {
    productAddRef.current = typeof fn === 'function' ? fn : noop
  }, [])

  const outletContext = useMemo(
    () => ({
      productSearch,
      setProductSearch,
      registerProductAdd,
    }),
    [productSearch, registerProductAdd]
  )

  return (
    <div className="react-admin">
      <button
        type="button"
        className={`sidebar-backdrop${menuOpen ? ' sidebar-backdrop--open' : ''}`}
        aria-label="Đóng menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />
      <div className="app">
        <aside className={`sidebar${menuOpen ? ' sidebar--open' : ''}`}>
          <div className="sidebar__brand">
            <div className="sidebar__logo" aria-hidden="true">
              <img
                src={getShopLogoSrc()}
                alt=""
                className="sidebar__logo-img"
                width={38}
                height={38}
                decoding="async"
              />
            </div>
            <div>
              <div className="sidebar__title">SPAPET ADMIN</div>
              <div className="sidebar__subtitle">Quản lý spa thú cưng</div>
            </div>
          </div>
          <nav className="sidebar__nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                className={({ isActive }) =>
                  `nav-item${isActive ? ' nav-item--active' : ''}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar__footer">
            <div className="user-mini">
              <UserAvatar
                key={userTick}
                user={sidebarUser}
                size={32}
                className="user-mini__avatar"
              />
              <div>
                <div className="user-mini__name">{sidebarUser?.name || 'Admin'}</div>
                <div className="user-mini__role">Quản trị viên</div>
              </div>
            </div>
            <Link to="/" className="sidebar__store">
              ← Về cửa hàng
            </Link>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div className="topbar__left">
              <button
                type="button"
                className="btn-icon mobile-toggle"
                aria-label="Mở menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                Menu
              </button>
              <div className="topbar__titles">
                <h1 className="topbar__title">{title}</h1>
                {subtitle ? (
                  <p className="topbar__subtitle">{subtitle}</p>
                ) : null}
              </div>
            </div>
            <div className="topbar__actions">
              {isProductsAdmin ? (
                <div className="search search--products">
                  <input
                    type="search"
                    className="search__input"
                    placeholder="Tìm kiếm sản phẩm…"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    aria-label="Tìm kiếm sản phẩm"
                  />
                </div>
              ) : (
                <div className="search" aria-hidden>
                  <input
                    type="search"
                    className="search__input"
                    placeholder="Tìm kiếm sản phẩm, đơn hàng, khách h..."
                    readOnly
                  />
                </div>
              )}
              <Link to="/services" className="btn btn--ghost">
                + Thêm lịch hẹn
              </Link>
              {isProductsAdmin ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => productAddRef.current()}
                >
                  + Thêm sản phẩm
                </button>
              ) : (
                <Link to="/admin/products" className="btn btn--primary">
                  + Thêm sản phẩm
                </Link>
              )}
            </div>
          </header>

          <Outlet context={outletContext} />

          <footer className="footer">
            <span>© 2026 Spapet Admin Dashboard.</span>
            <span className="footer__hint">
              Gợi ý: có thể kết nối backend (PHP, Node, Laravel...) để dữ liệu động.
            </span>
          </footer>
        </main>
      </div>
    </div>
  )
}

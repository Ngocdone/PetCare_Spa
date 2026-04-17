/**
 * Thanh điều hướng: logo, menu, giỏ (useCartCount), trạng thái đăng nhập + avatar.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCartCount } from '../hooks/useCartCount.js'
import { getCurrentUser, clearUserSession } from '../utils/auth.js'
import { getUserProfile } from '../utils/userProfile.js'
import UserAvatar from './UserAvatar.jsx'
import IconCart from './IconCart.jsx'
import { CART_KEY } from '../utils/cartStorage.js'
import { getShopLogoSrc } from '../utils/assets.js'

function IconUser({ className }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="7"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Header() {
  const cartCount = useCartCount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [user, setUser] = useState(() => getCurrentUser())
  const userWrapRef = useRef(null)

  useEffect(() => {
    const syncUser = () => setUser(getCurrentUser())
    window.addEventListener('petspa-user-updated', syncUser)
    window.addEventListener('storage', syncUser)
    return () => {
      window.removeEventListener('petspa-user-updated', syncUser)
      window.removeEventListener('storage', syncUser)
    }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const header = document.getElementById('header')
      if (!header) return
      if (window.scrollY > 50) header.classList.add('scrolled')
      else header.classList.remove('scrolled')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const close = (e) => {
      if (userWrapRef.current && !userWrapRef.current.contains(e.target))
        setUserOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  function logout() {
    clearUserSession()
    try {
      localStorage.setItem(CART_KEY, JSON.stringify([]))
    } catch {
      /* ignore */
    }
    setUser(null)
    setUserOpen(false)
    window.dispatchEvent(new CustomEvent('petspa-cart-updated'))
    window.location.href = '/'
  }

  const navCls = ({ isActive }) =>
    `nav__link${isActive ? ' nav__link--active' : ''}`

  return (
    <>
      <header className="header" id="header">
        <div className="header__inner">
          <Link to="/" className="header__logo" title="Pet Spa & Shop">
            <img
              src={getShopLogoSrc()}
              alt=""
              className="header__logo-img"
              width={40}
              height={40}
              decoding="async"
            />
            <span className="header__logo-text">Pet Spa &amp; Shop</span>
          </Link>
          <nav className="nav">
            <ul className="nav__list">
              <li className="nav__item">
                <NavLink to="/" className={navCls} end>
                  Trang chủ
                </NavLink>
              </li>
              <li className="nav__item">
                <NavLink to="/services" className={navCls}>
                  Dịch vụ
                </NavLink>
              </li>
              <li className="nav__item">
                <NavLink to="/shop" className={navCls}>
                  Cửa hàng
                </NavLink>
              </li>
              <li className="nav__item">
                <NavLink to="/about" className={navCls}>
                  Về chúng tôi
                </NavLink>
              </li>
              <li className="nav__item">
                <NavLink to="/contact" className={navCls}>
                  Liên hệ
                </NavLink>
              </li>
            </ul>
          </nav>
          <div className="header__actions">
            <div className="header__user-wrap" ref={userWrapRef}>
              <button
                type="button"
                className={`header__icon-btn header__user-btn${user ? ' header__user-btn--logged' : ''}`}
                aria-expanded={userOpen}
                aria-haspopup="true"
                title={user ? user.name || 'Tài khoản' : 'Tài khoản'}
                onClick={(e) => {
                  e.stopPropagation()
                  setUserOpen((v) => !v)
                }}
              >
                {user ? (
                  <UserAvatar
                    user={{
                      ...user,
                      avatar:
                        user.avatar ||
                        getUserProfile().avatar ||
                        '',
                    }}
                    size={34}
                    className="header__user-avatar"
                  />
                ) : (
                  <IconUser className="header__action-icon" />
                )}
              </button>
              <div
                className={`header__user-dropdown${userOpen ? ' is-open' : ''}`}
                aria-hidden={!userOpen}
              >
                {user ? (
                  <>
                    <Link to="/user" onClick={() => setUserOpen(false)}>
                      Tài khoản
                    </Link>
                    {user.role === 'admin' ? (
                      <Link to="/admin" onClick={() => setUserOpen(false)}>
                        Quản trị
                      </Link>
                    ) : null}
                    <div className="header__user-dropdown__divider" />
                    <button
                      type="button"
                      className="user-logout-btn"
                      onClick={logout}
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setUserOpen(false)}>
                    Đăng nhập
                  </Link>
                )}
              </div>
            </div>
            <Link
              to="/cart"
              className="header__icon-btn header__cart-wrap"
              title="Giỏ hàng"
              aria-label="Giỏ hàng"
            >
              <IconCart className="header__action-icon" />
              <span
                className="header__cart-badge cart-count"
                style={{ display: cartCount > 0 ? undefined : 'none' }}
              >
                {cartCount}
              </span>
            </Link>
            <button
              type="button"
              className="header__menu-toggle"
              aria-label="Mở menu"
              onClick={() => setMenuOpen(true)}
            >
              <span className="header__menu-toggle-text">Menu</span>
            </button>
          </div>
        </div>
      </header>

      <div
        className="mobile-menu-overlay"
        id="mobileMenuOverlay"
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} id="mobileMenu">
        <div className="mobile-menu__header">
          <span className="mobile-menu__title">Menu</span>
          <button
            type="button"
            className="mobile-menu__close"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
          >
            Đóng
          </button>
        </div>
        <nav className="mobile-menu__nav">
          <Link
            className="mobile-menu__link"
            to="/"
            onClick={() => setMenuOpen(false)}
          >
            <span>Trang chủ</span>
          </Link>
          <Link
            className="mobile-menu__link"
            to="/services"
            onClick={() => setMenuOpen(false)}
          >
            <span>Dịch vụ</span>
          </Link>
          <Link
            className="mobile-menu__link"
            to="/shop"
            onClick={() => setMenuOpen(false)}
          >
            <span>Cửa hàng</span>
          </Link>
          <Link
            className="mobile-menu__link"
            to="/about"
            onClick={() => setMenuOpen(false)}
          >
            <span>Về chúng tôi</span>
          </Link>
          <Link
            className="mobile-menu__link"
            to="/contact"
            onClick={() => setMenuOpen(false)}
          >
            <span>Liên hệ</span>
          </Link>
        </nav>
      </div>
    </>
  )
}

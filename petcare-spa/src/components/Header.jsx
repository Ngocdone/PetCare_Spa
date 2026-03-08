import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getCartCount, updateCartBadge, getCurrentUser } from '../utils/storage'

function Header() {
  const location = useLocation()
  const [cartCount, setCartCount] = useState(0)
  const [user, setUser] = useState(null)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Update cart count
    const count = getCartCount()
    setCartCount(count)
    updateCartBadge()

    // Check user
    const currentUser = getCurrentUser()
    setUser(currentUser)

    // Scroll event for sticky header
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('petspa_current_user')
    setUser(null)
    setUserDropdownOpen(false)
    window.location.href = '/'
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`} id="header">
      <div className="header__inner">
        <Link to="/" className="header__logo">
          <span className="header__logo-icon"><i className="fas fa-paw"></i></span>
          PETCARE SPA
        </Link>
        <nav className="nav">
          <ul className="nav__list">
            <li className="nav__item">
              <Link to="/" className={`nav__link ${isActive('/') ? 'nav__link--active' : ''}`}>Trang chủ</Link>
            </li>
            <li className="nav__item">
              <Link to="/services" className={`nav__link ${isActive('/services') ? 'nav__link--active' : ''}`}>Dịch vụ</Link>
            </li>
            <li className="nav__item">
              <Link to="/shop" className={`nav__link ${isActive('/shop') ? 'nav__link--active' : ''}`}>Cửa hàng</Link>
            </li>
            <li className="nav__item">
              <Link to="/booking" className={`nav__link ${isActive('/booking') ? 'nav__link--active' : ''}`}>Đặt lịch</Link>
            </li>
            <li className="nav__item">
              <Link to="/about" className={`nav__link ${isActive('/about') ? 'nav__link--active' : ''}`}>Về chúng tôi</Link>
            </li>
            <li className="nav__item">
              <Link to="/contact" className={`nav__link ${isActive('/contact') ? 'nav__link--active' : ''}`}>Liên hệ</Link>
            </li>
          </ul>
        </nav>
        <div className="header__actions">
          <div className="header__user-wrap">
            <button 
              type="button" 
              className="header__icon-btn header__user-btn" 
              aria-expanded={userDropdownOpen}
              aria-haspopup="true" 
              title="Tài khoản"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            >
              <i className="fas fa-user"></i>
            </button>
            <div className={`header__user-dropdown ${userDropdownOpen ? 'is-open' : ''}`} id="userDropdown" aria-hidden={!userDropdownOpen}>
              {user ? (
                <>
                  <Link to="/user"><i className="fas fa-user-circle"></i> Tài khoản</Link>
                  {user.role === 'admin' && <Link to="/admin"><i className="fas fa-cog"></i> Quản trị</Link>}
                  <div className="header__user-dropdown__divider"></div>
                  <button type="button" className="user-logout-btn" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> Đăng xuất
                  </button>
                </>
              ) : (
                <Link to="/login"><i className="fas fa-sign-in-alt"></i> Đăng nhập</Link>
              )}
            </div>
          </div>
          <Link to="/cart" className="header__icon-btn header__cart-wrap" title="Giỏ hàng">
            <i className="fas fa-shopping-cart"></i>
            {cartCount > 0 && <span className="header__cart-badge cart-count">{cartCount}</span>}
          </Link>
          <button type="button" className="header__menu-toggle" aria-label="Mở menu" id="mobileMenuToggle">
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const closeMenu = () => setIsOpen(false)

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <div 
        className={`mobile-menu-overlay ${isOpen ? 'is-open' : ''}`} 
        id="mobileMenuOverlay" 
        aria-hidden={!isOpen}
        onClick={closeMenu}
      ></div>
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`} id="mobileMenu">
        <div className="mobile-menu__header">
          <span className="mobile-menu__title">Menu</span>
          <button type="button" className="mobile-menu__close" aria-label="Đóng menu" onClick={closeMenu}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <nav className="mobile-menu__nav">
          <Link to="/" className={`mobile-menu__link ${isActive('/') ? 'active' : ''}`} onClick={closeMenu}>
            <i className="fas fa-home"></i><span>Trang chủ</span>
          </Link>
          <Link to="/services" className={`mobile-menu__link ${isActive('/services') ? 'active' : ''}`} onClick={closeMenu}>
            <i className="fas fa-spa"></i><span>Dịch vụ</span>
          </Link>
          <Link to="/shop" className={`mobile-menu__link ${isActive('/shop') ? 'active' : ''}`} onClick={closeMenu}>
            <i className="fas fa-shopping-bag"></i><span>Cửa hàng</span>
          </Link>
          <Link to="/booking" className={`mobile-menu__link ${isActive('/booking') ? 'active' : ''}`} onClick={closeMenu}>
            <i className="fas fa-calendar-check"></i><span>Đặt lịch</span>
          </Link>
          <Link to="/about" className={`mobile-menu__link ${isActive('/about') ? 'active' : ''}`} onClick={closeMenu}>
            <i className="fas fa-paw"></i><span>Về chúng tôi</span>
          </Link>
          <Link to="/contact" className={`mobile-menu__link ${isActive('/contact') ? 'active' : ''}`} onClick={closeMenu}>
            <i className="fas fa-envelope"></i><span>Liên hệ</span>
          </Link>
        </nav>
      </div>
    </>
  )
}

export default MobileMenu

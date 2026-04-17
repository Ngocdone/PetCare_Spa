/**
 * Chân trang: liên kết nhanh + logo.
 */
import { Link } from 'react-router-dom'
import { getShopLogoSrc } from '../utils/assets.js'

export default function Footer() {
  function onNewsletter(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const email = fd.get('email')
    if (email) {
      window.alert(
        `Cảm ơn bạn đã đăng ký nhận tin! Chúng tôi sẽ gửi tin khuyến mãi đến ${email}`
      )
      e.target.reset()
    }
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="footer__brand">
              <img
                src={getShopLogoSrc()}
                alt=""
                className="footer__brand-logo"
                width={40}
                height={40}
                decoding="async"
              />
              <span>Pet Spa &amp; Shop</span>
            </div>
            <p className="footer__text">
              Spa thú cưng chuyên nghiệp, cửa hàng phụ kiện và thức ăn chất
              lượng. Cam kết mang lại sự hài lòng cho bạn và thú cưng.
            </p>
            <div className="footer__social">
              <a href="#" className="footer__social-link" aria-label="Facebook">
                <span className="footer__social-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" role="img" focusable="false">
                    <path
                      fill="currentColor"
                      d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.6 1.6-1.6H16V4.8c-.2 0-.9-.1-1.9-.1-2.4 0-4 1.4-4 4.1V11H8v3h2.1v7h3.4z"
                    />
                  </svg>
                </span>
              </a>
              <a href="#" className="footer__social-link" aria-label="Instagram">
                <span className="footer__social-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" role="img" focusable="false">
                    <rect
                      x="4.5"
                      y="4.5"
                      width="15"
                      height="15"
                      rx="4.25"
                      ry="4.25"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3.6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle cx="16.9" cy="7.1" r="1.1" fill="currentColor" />
                  </svg>
                </span>
              </a>
              <a href="#" className="footer__social-link" aria-label="Zalo">
                <span className="footer__social-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" role="img" focusable="false">
                    <path
                      d="M12 3.5c4.9 0 8.8 3.4 8.8 7.7 0 2.5-1.4 4.6-3.7 6l.5 3.3-3.2-1.7c-.8.2-1.6.3-2.4.3-4.9 0-8.8-3.4-8.8-7.8 0-4.3 3.9-7.8 8.8-7.8z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.2 9.2h7.6l-5.5 5.6h5.6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="footer__title">Liên kết</h4>
            <ul className="footer__links">
              <li>
                <Link to="/services" className="footer__link">
                  Dịch vụ
                </Link>
              </li>
              <li>
                <Link to="/shop" className="footer__link">
                  Cửa hàng
                </Link>
              </li>
              <li>
                <Link to="/services" className="footer__link">
                  Đặt lịch
                </Link>
              </li>
              <li>
                <Link to="/about" className="footer__link">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link to="/contact" className="footer__link">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="footer__title">Liên hệ</h4>
            <ul className="footer__links">
              <li>
                QTSC Building 1, Đường Quang Trung, Tân Hưng Thuận, Hóc Môn,
                Thành phố Hồ Chí Minh, Vietnam
              </li>
              <li>0900 123 456</li>
              <li>hello@petspa.vn</li>
            </ul>
          </div>
          <div>
            <h4 className="footer__title">Đăng ký nhận tin</h4>
            <form className="footer__newsletter" onSubmit={onNewsletter}>
              <div className="footer__input-wrap">
                <input
                  type="email"
                  className="footer__input"
                  name="email"
                  placeholder="Email của bạn"
                  required
                />
                <button type="submit" className="btn btn--primary">
                  Gửi
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} Pet Spa & Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

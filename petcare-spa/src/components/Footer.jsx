import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="footer__brand">Pet Spa & Shop</div>
            <p className="footer__text">Spa thú cưng chuyên nghiệp, cửa hàng phụ kiện và thức ăn chất lượng. Cam kết mang lại sự hài lòng cho bạn và thú cưng.</p>
            <div className="footer__social">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="Zalo"><i className="fas fa-phone"></i></a>
            </div>
          </div>
          <div>
            <h4 className="footer__title">Liên kết</h4>
            <ul className="footer__links">
              <li><Link to="/services" className="footer__link">Dịch vụ</Link></li>
              <li><Link to="/shop" className="footer__link">Cửa hàng</Link></li>
              <li><Link to="/booking" className="footer__link">Đặt lịch</Link></li>
              <li><Link to="/about" className="footer__link">Về chúng tôi</Link></li>
              <li><Link to="/contact" className="footer__link">Liên hệ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="footer__title">Liên hệ</h4>
            <ul className="footer__links">
              <li><i className="fas fa-map-marker-alt"></i> QTSC Building 1, Đường Quang Trung, Tân Hưng Thuận, Hóc Môn, Thành phố Hồ Chí Minh, Vietnam</li>
              <li><i className="fas fa-phone"></i> 0900 123 456</li>
              <li><i className="fas fa-envelope"></i> hello@petspa.vn</li>
            </ul>
          </div>
          <div>
            <h4 className="footer__title">Đăng ký nhận tin</h4>
            <form className="footer__newsletter" id="newsletterForm">
              <div className="footer__input-wrap">
                <input type="email" className="footer__input" name="email" placeholder="Email của bạn" required />
                <button type="submit" className="btn btn--primary">Gửi</button>
              </div>
            </form>
          </div>
        </div>
        <div className="footer__bottom">
          <p>&copy; 2025 Pet Spa & Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

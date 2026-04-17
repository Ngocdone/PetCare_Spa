/**
 * Liên hệ: form hoặc thông tin (theo thiết kế hiện tại).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Contact() {
  const [errors, setErrors] = useState({})

  function onSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const name = String(fd.get('name') || '').trim()
    const email = String(fd.get('email') || '').trim()
    const message = String(fd.get('message') || '').trim()
    const next = {}
    if (!name) next.name = 'Vui lòng nhập họ tên.'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@<>]+$/
    if (!email || !emailRe.test(email))
      next.email = 'Vui lòng nhập email hợp lệ.'
    if (!message) next.message = 'Vui lòng nhập nội dung.'
    setErrors(next)
    if (Object.keys(next).length) return
    window.alert(
      `Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi qua email ${email} trong thời gian sớm nhất.`
    )
    e.target.reset()
    setErrors({})
  }

  return (
    <main className="page-main page-main--contact">
      <section className="contact-hero">
        <div className="contact-hero__bg" />
        <div className="container contact-hero__inner">
          <h1 className="contact-hero__title">Liên hệ</h1>
          <p className="contact-hero__subtitle">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Gửi tin nhắn hoặc
            gọi trực tiếp để được tư vấn.
          </p>
        </div>
      </section>

      <section className="section contact-section">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb__list">
              <li className="breadcrumb__item">
                <Link to="/" className="breadcrumb__link">
                  Trang chủ
                </Link>
              </li>
              <li className="breadcrumb__item">
                <span className="breadcrumb__current">Liên hệ</span>
              </li>
            </ol>
          </nav>
          <div className="contact-grid">
            <div className="contact-info">
              <h2 className="contact-info__title">Thông tin liên hệ</h2>
              <ul className="contact-info__list">
                <li>
                  <div>
                    <strong>Địa chỉ</strong>
                    <span>
                      QTSC Building 1, Đường Quang Trung, Tân Hưng Thuận, Hóc
                      Môn, Thành phố Hồ Chí Minh, Vietnam
                    </span>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Điện thoại</strong>
                    <a href="tel:0900123456">0900 123 456</a>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Email</strong>
                    <a href="mailto:hello@petspa.vn">hello@petspa.vn</a>
                  </div>
                </li>
              </ul>
              <div className="contact-info__hours">
                <h3 className="contact-info__subtitle">Giờ mở cửa</h3>
                <p>Thứ 2 – Chủ nhật: 8:00 – 20:00</p>
              </div>
              <div className="contact-map" id="contactMap">
                <iframe
                  src="https://www.google.com/maps?q=10.8537718,106.6283475&hl=vi&z=17&output=embed"
                  width="100%"
                  height={220}
                  style={{ border: 0, borderRadius: 'var(--radius-md)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Bản đồ QTSC Spring"
                />
              </div>
            </div>
            <div className="contact-form-wrap">
              <h2 className="contact-form__title">Gửi tin nhắn</h2>
              <p className="contact-form__desc">
                Điền form bên dưới, chúng tôi sẽ phản hồi trong vòng 24 giờ.
              </p>
              <form className="contact-form" id="contactForm" onSubmit={onSubmit}>
                <div className="form-group">
                  <label htmlFor="contactName">
                    Họ tên <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    name="name"
                    required
                    placeholder="Họ và tên"
                  />
                  <span className="form-error" id="errorContactName">
                    {errors.name || ''}
                  </span>
                </div>
                <div className="form-group">
                  <label htmlFor="contactEmail">
                    Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="email"
                    required
                    placeholder="email@example.com"
                  />
                  <span className="form-error" id="errorContactEmail">
                    {errors.email || ''}
                  </span>
                </div>
                <div className="form-group">
                  <label htmlFor="contactPhone">Số điện thoại</label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="phone"
                    placeholder="0900 123 456"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contactMessage">
                    Nội dung <span className="required">*</span>
                  </label>
                  <textarea
                    id="contactMessage"
                    name="message"
                    rows={4}
                    required
                    placeholder="Nội dung tin nhắn..."
                  />
                  <span className="form-error" id="errorContactMessage">
                    {errors.message || ''}
                  </span>
                </div>
                <button
                  type="submit"
                  className="btn-modern btn-modern--primary btn-modern--lg"
                >
                  Gửi tin nhắn
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

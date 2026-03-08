import { useState } from 'react'
import { Link } from 'react-router-dom'

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Save to localStorage
    const contacts = JSON.parse(localStorage.getItem('petspa_contacts') || '[]')
    contacts.push({ ...formData, createdAt: new Date().toISOString() })
    localStorage.setItem('petspa_contacts', JSON.stringify(contacts))
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <>
        <section className="contact-hero">
          <div className="contact-hero__bg"></div>
          <div className="container contact-hero__inner">
            <h1 className="contact-hero__title">Liên hệ</h1>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <div className="contact-success">
              <i className="fas fa-check-circle" style={{fontSize: '60px', color: '#28a745', marginBottom: '20px'}}></i>
              <h2>Gửi liên hệ thành công!</h2>
              <p>Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
              <Link to="/" className="btn btn--primary">Quay về trang chủ</Link>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <section className="contact-hero">
        <div className="contact-hero__bg"></div>
        <div className="container contact-hero__inner">
          <h1 className="contact-hero__title">Liên hệ</h1>
          <p className="contact-hero__subtitle">Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
        </div>
      </section>

      <section className="section section--contact">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb__list">
              <li className="breadcrumb__item"><Link to="/" className="breadcrumb__link">Trang chủ</Link></li>
              <li className="breadcrumb__item"><span className="breadcrumb__current">Liên hệ</span></li>
            </ol>
          </nav>

          <div className="contact-layout">
            <div className="contact-info">
              <h2>Thông tin liên hệ</h2>
              <div className="contact-info__item">
                <i className="fas fa-map-marker-alt"></i>
                <div>
                  <h3>Địa chỉ</h3>
                  <p>QTSC Building 1, Đường Quang Trung, Tân Hưng Thuận, Hóc Môn, Thành phố Hồ Chí Minh, Vietnam</p>
                </div>
              </div>
              <div className="contact-info__item">
                <i className="fas fa-phone"></i>
                <div>
                  <h3>Điện thoại</h3>
                  <p>0900 123 456</p>
                </div>
              </div>
              <div className="contact-info__item">
                <i className="fas fa-envelope"></i>
                <div>
                  <h3>Email</h3>
                  <p>hello@petspa.vn</p>
                </div>
              </div>
              <div className="contact-info__item">
                <i className="fas fa-clock"></i>
                <div>
                  <h3>Giờ hoạt động</h3>
                  <p>Thứ 2 - Chủ nhật: 8:00 - 20:00</p>
                </div>
              </div>
              <div className="contact-social">
                <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
                <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                <a href="#" aria-label="Zalo"><i className="fas fa-phone"></i></a>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <h2>Gửi tin nhắn</h2>
              <div className="contact-form__grid">
                <div className="contact-form__field">
                  <label htmlFor="name">Họ tên *</label>
                  <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="contact-form__field">
                  <label htmlFor="email">Email *</label>
                  <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="contact-form__field">
                  <label htmlFor="phone">Số điện thoại</label>
                  <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="contact-form__field">
                  <label htmlFor="subject">Chủ đề</label>
                  <input type="text" name="subject" id="subject" value={formData.subject} onChange={handleChange} />
                </div>
              </div>
              <div className="contact-form__field">
                <label htmlFor="message">Tin nhắn *</label>
                <textarea name="message" id="message" rows="5" value={formData.message} onChange={handleChange} required></textarea>
              </div>
              <button type="submit" className="btn btn--primary btn--lg">
                <i className="fas fa-paper-plane"></i> Gửi tin nhắn
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

export default Contact

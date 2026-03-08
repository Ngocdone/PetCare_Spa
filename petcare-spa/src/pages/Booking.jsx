import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DATA, formatPrice } from '../data/data'
import { saveBooking, getCurrentUser } from '../utils/storage'

function Booking() {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    service: searchParams.get('service') || '',
    petType: searchParams.get('petType') || 'cho',
    petName: '',
    petWeight: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    address: '',
    notes: '',
    pickup: false,
    date: '',
    time: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Kiểm tra trạng thái đăng nhập và điền thông tin user nếu đã đăng nhập
  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setIsLoggedIn(true)
      setFormData(prev => ({
        ...prev,
        ownerName: user.name || '',
        ownerPhone: user.phone || '',
        ownerEmail: user.email || '',
        address: user.address || ''
      }))
    } else {
      setIsLoggedIn(false)
    }
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const user = getCurrentUser()
    
    // Lấy thông tin dịch vụ từ DATA
    const selectedService = DATA.services.find(s => s.id === formData.service)
    const servicePrice = selectedService 
      ? (formData.petType === 'cho' ? selectedService.priceDog : selectedService.priceCat)
      : 0
    
    const booking = {
      serviceId: formData.service,
      serviceName: selectedService?.name || '',
      servicePrice: servicePrice,
      petType: formData.petType,
      petName: formData.petName,
      petWeight: formData.petWeight || 0,
      ownerName: formData.ownerName,
      ownerPhone: formData.ownerPhone,
      ownerEmail: formData.ownerEmail,
      ownerAddress: formData.address,
      note: formData.notes,
      date: formData.date,
      time: formData.time + ':00',
      pickup: formData.pickup,
      userId: user?.id || null,
      status: 'pending'
    }
    
    // Lưu vào localStorage (backup)
    saveBooking(booking)
    
    // Gửi lên server
    try {
      const token = localStorage.getItem('petspa_token')
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(booking)
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Booking saved to server:', data)
      } else {
        console.error('Failed to save booking to server')
      }
    } catch (error) {
      console.error('Error saving booking:', error)
    }
    
    setSubmitted(true)
  }

  const selectedService = DATA.services.find(s => s.id === formData.service)

  if (submitted) {
    return (
      <div className="container" style={{padding: '100px 0', textAlign: 'center'}}>
        <div className="booking-success">
          <i className="fas fa-check-circle" style={{fontSize: '60px', color: '#28a745', marginBottom: '20px'}}></i>
          <h2>Đặt lịch thành công!</h2>
          <p>Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.</p>
          <Link to="/" className="btn btn--primary">Quay về trang chủ</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <section className="booking-hero">
        <div className="booking-hero__bg"></div>
        <div className="container booking-hero__inner">
          <h1 className="booking-hero__title">Đặt lịch dịch vụ</h1>
          <p className="booking-hero__subtitle">Điền thông tin để đặt lịch spa cho bé</p>
        </div>
      </section>

      <section className="section section--booking">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb__list">
              <li className="breadcrumb__item"><Link to="/" className="breadcrumb__link">Trang chủ</Link></li>
              <li className="breadcrumb__item"><span className="breadcrumb__current">Đặt lịch</span></li>
            </ol>
          </nav>

          <div className="booking-layout">
            <form className="booking-form" onSubmit={handleSubmit}>
              {/* Service Selection */}
              <div className="booking-form__section">
                <h3>1. Chọn dịch vụ</h3>
                <div className="booking-services">
                  {DATA.services.map(service => (
                    <label 
                      key={service.id} 
                      className={`booking-service-card ${formData.service === service.id ? 'active' : ''}`}
                    >
                      <input 
                        type="radio" 
                        name="service" 
                        value={service.id}
                        checked={formData.service === service.id}
                        onChange={handleChange}
                      />
                      <img src={service.image} alt={service.name} />
                      <div className="booking-service-card__content">
                        <h4>{service.name}</h4>
                        <p>{service.description}</p>
                        <span className="price">
                          {formData.petType === 'cho' ? formatPrice(service.priceDog) : formatPrice(service.priceCat)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pet Info */}
              <div className="booking-form__section">
                <h3>2. Thông tin thú cưng</h3>
                <div className="booking-form__grid">
                  <div className="booking-form__field">
                    <label htmlFor="petType">Loại thú cưng</label>
                    <select name="petType" id="petType" value={formData.petType} onChange={handleChange}>
                      <option value="cho">Chó</option>
                      <option value="meo">Mèo</option>
                    </select>
                  </div>
                  <div className="booking-form__field">
                    <label htmlFor="petName">Tên thú cưng *</label>
                    <input type="text" name="petName" id="petName" value={formData.petName} onChange={handleChange} required />
                  </div>
                  <div className="booking-form__field">
                    <label htmlFor="petWeight">Cân nặng (kg)</label>
                    <input type="number" name="petWeight" id="petWeight" value={formData.petWeight} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="booking-form__section">
                <h3>3. Thông tin liên hệ</h3>
                {isLoggedIn && (
                  <div className="booking-form__info" style={{
                    background: '#e7f5ff',
                    padding: '10px 15px',
                    borderRadius: '5px',
                    marginBottom: '15px',
                    fontSize: '14px',
                    color: '#0066cc'
                  }}>
                    <i className="fas fa-info-circle"></i> Thông tin được điền từ tài khoản của bạn
                  </div>
                )}
                <div className="booking-form__grid">
                  <div className="booking-form__field">
                    <label htmlFor="ownerName">Họ tên *</label>
                    <input type="text" name="ownerName" id="ownerName" value={formData.ownerName} onChange={handleChange} required />
                  </div>
                  <div className="booking-form__field">
                    <label htmlFor="ownerPhone">Số điện thoại *</label>
                    <input type="tel" name="ownerPhone" id="ownerPhone" value={formData.ownerPhone} onChange={handleChange} required />
                  </div>
                  <div className="booking-form__field">
                    <label htmlFor="ownerEmail">Email *</label>
                    <input type="email" name="ownerEmail" id="ownerEmail" value={formData.ownerEmail} onChange={handleChange} required />
                  </div>
                  <div className="booking-form__field">
                    <label htmlFor="address">Địa chỉ</label>
                    <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="booking-form__section">
                <h3>4. Chọn ngày và giờ</h3>
                <div className="booking-form__grid">
                  <div className="booking-form__field">
                    <label htmlFor="date">Ngày *</label>
                    <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required />
                  </div>
                  <div className="booking-form__field">
                    <label htmlFor="time">Giờ *</label>
                    <select name="time" id="time" value={formData.time} onChange={handleChange} required>
                      <option value="">Chọn giờ</option>
                      <option value="08:00">08:00</option>
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="11:00">11:00</option>
                      <option value="13:00">13:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                      <option value="16:00">16:00</option>
                      <option value="17:00">17:00</option>
                    </select>
                  </div>
                </div>
                <div className="booking-form__field">
                  <label className="booking-checkbox">
                    <input type="checkbox" name="pickup" checked={formData.pickup} onChange={handleChange} />
                    <span>Yêu cầu đưa đón tại nhà (miễn phí trong 5km)</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="booking-form__section">
                <div className="booking-form__field">
                  <label htmlFor="notes">Ghi chú thêm</label>
                  <textarea name="notes" id="notes" rows="3" value={formData.notes} onChange={handleChange}></textarea>
                </div>
              </div>

              <button type="submit" className="btn btn--primary btn--lg">
                <i className="fas fa-calendar-check"></i> Xác nhận đặt lịch
              </button>
            </form>

            {/* Summary */}
            {selectedService && (
              <div className="booking-summary">
                <h3>Tóm tắt đặt lịch</h3>
                <div className="booking-summary__item">
                  <span>Dịch vụ:</span>
                  <strong>{selectedService.name}</strong>
                </div>
                <div className="booking-summary__item">
                  <span>Loại thú cưng:</span>
                  <strong>{formData.petType === 'cho' ? 'Chó' : 'Mèo'}</strong>
                </div>
                <div className="booking-summary__item">
                  <span>Giá dịch vụ:</span>
                  <strong className="price">
                    {formData.petType === 'cho' ? formatPrice(selectedService.priceDog) : formatPrice(selectedService.priceCat)}
                  </strong>
                </div>
                <div className="booking-summary__divider"></div>
                <div className="booking-summary__total">
                  <span>Tổng cộng:</span>
                  <strong>
                    {formData.petType === 'cho' ? formatPrice(selectedService.priceDog) : formatPrice(selectedService.priceCat)}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default Booking

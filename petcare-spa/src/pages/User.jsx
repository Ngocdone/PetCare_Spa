import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser, getBookings } from '../utils/storage'

function User() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [bookings, setBookings] = useState([])
  const [activeTab, setActiveTab] = useState('bookings')

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }
    setUser(currentUser)
    setBookings(getBookings())
  }, [navigate])

  if (!user) {
    return null
  }

  return (
    <>
      <section className="user-hero">
        <div className="user-hero__bg"></div>
        <div className="container user-hero__inner">
          <div className="user-hero__profile">
            <div className="user-hero__avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="user-hero__info">
              <h1 className="user-hero__name">{user.name || user.email}</h1>
              <p className="user-hero__email">{user.email}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--user">
        <div className="container">
          <div className="user-layout">
            <aside className="user-sidebar">
              <button 
                className={`user-sidebar__item ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookings')}
              >
                <i className="fas fa-calendar-alt"></i> Lịch hẹn
              </button>
              <button 
                className={`user-sidebar__item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="fas fa-user-cog"></i> Thông tin cá nhân
              </button>
              <button 
                className={`user-sidebar__item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <i className="fas fa-shopping-bag"></i> Đơn hàng
              </button>
              <button 
                className="user-sidebar__item"
                onClick={() => {
                  localStorage.removeItem('petspa_current_user')
                  navigate('/')
                }}
              >
                <i className="fas fa-sign-out-alt"></i> Đăng xuất
              </button>
            </aside>

            <div className="user-content">
              {activeTab === 'bookings' && (
                <div className="user-bookings">
                  <h2>Lịch hẹn của tôi</h2>
                  {bookings.length === 0 ? (
                    <div className="user-empty">
                      <i className="fas fa-calendar-plus"></i>
                      <p>Chưa có lịch hẹn nào</p>
                      <Link to="/booking" className="btn btn--primary">Đặt lịch ngay</Link>
                    </div>
                  ) : (
                    <div className="user-bookings__list">
                      {bookings.map(booking => (
                        <div key={booking.id} className="user-booking-card">
                          <div className="user-booking-card__header">
                            <span className={`user-booking-card__status status--${booking.status}`}>
                              {booking.status === 'pending' ? 'Chờ xác nhận' : 'Đã xác nhận'}
                            </span>
                            <span className="user-booking-card__date">{booking.date}</span>
                          </div>
                          <div className="user-booking-card__body">
                            <h3>{booking.service}</h3>
                            <p>Thú cưng: {booking.petName}</p>
                            <p>Liên hệ: {booking.ownerPhone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="user-profile">
                  <h2>Thông tin cá nhân</h2>
                  <form className="user-profile__form">
                    <div className="user-profile__field">
                      <label>Họ tên</label>
                      <input type="text" defaultValue={user.name || ''} />
                    </div>
                    <div className="user-profile__field">
                      <label>Email</label>
                      <input type="email" defaultValue={user.email} disabled />
                    </div>
                    <div className="user-profile__field">
                      <label>Số điện thoại</label>
                      <input type="tel" defaultValue={user.phone || ''} />
                    </div>
                    <button type="submit" className="btn btn--primary">Cập nhật</button>
                  </form>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="user-orders">
                  <h2>Đơn hàng của tôi</h2>
                  <div className="user-empty">
                    <i className="fas fa-box-open"></i>
                    <p>Chưa có đơn hàng nào</p>
                    <Link to="/shop" className="btn btn--primary">Mua sắm ngay</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default User

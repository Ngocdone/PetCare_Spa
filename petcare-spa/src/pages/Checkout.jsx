import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCart, clearCart, formatPrice } from '../utils/storage'

function Checkout() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'cod',
    notes: ''
  })

  useEffect(() => {
    const cart = getCart()
    if (cart.length === 0) {
      navigate('/cart')
    }
    setCartItems(cart)
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Save order
    const order = {
      ...formData,
      items: cartItems,
      total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    // Save to localStorage
    const orders = JSON.parse(localStorage.getItem('petspa_orders') || '[]')
    orders.push(order)
    localStorage.setItem('petspa_orders', JSON.stringify(orders))
    
    // Clear cart
    clearCart()
    
    // Show success and redirect
    alert('Đặt hàng thành công! Cảm ơn bạn.')
    navigate('/')
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (cartItems.length === 0) {
    return null
  }

  return (
    <>
      <section className="checkout-hero">
        <div className="checkout-hero__bg"></div>
        <div className="container checkout-hero__inner">
          <h1 className="checkout-hero__title">Thanh toán</h1>
        </div>
      </section>

      <section className="section section--checkout">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb__list">
              <li className="breadcrumb__item"><Link to="/" className="breadcrumb__link">Trang chủ</Link></li>
              <li className="breadcrumb__item"><span className="breadcrumb__current">Thanh toán</span></li>
            </ol>
          </nav>

          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="checkout-form__section">
              <h3>Thông tin khách hàng</h3>
              <div className="checkout-form__grid">
                <div className="checkout-form__field">
                  <label htmlFor="name">Họ tên *</label>
                  <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="checkout-form__field">
                  <label htmlFor="phone">Số điện thoại *</label>
                  <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required />
                </div>
                <div className="checkout-form__field">
                  <label htmlFor="email">Email *</label>
                  <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="checkout-form__field">
                  <label htmlFor="address">Địa chỉ nhận hàng *</label>
                  <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required />
                </div>
              </div>
            </div>

            <div className="checkout-form__section">
              <h3>Phương thức thanh toán</h3>
              <div className="checkout-payment-methods">
                <label className={`checkout-payment-method ${formData.paymentMethod === 'cod' ? 'active' : ''}`}>
                  <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleChange} />
                  <i className="fas fa-money-bill-wave"></i>
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </label>
                <label className={`checkout-payment-method ${formData.paymentMethod === 'bank' ? 'active' : ''}`}>
                  <input type="radio" name="paymentMethod" value="bank" checked={formData.paymentMethod === 'bank'} onChange={handleChange} />
                  <i className="fas fa-university"></i>
                  <span>Chuyển khoản ngân hàng</span>
                </label>
                <label className={`checkout-payment-method ${formData.paymentMethod === 'momo' ? 'active' : ''}`}>
                  <input type="radio" name="paymentMethod" value="momo" checked={formData.paymentMethod === 'momo'} onChange={handleChange} />
                  <i className="fas fa-wallet"></i>
                  <span>Ví MoMo</span>
                </label>
              </div>
            </div>

            <div className="checkout-form__section">
              <label htmlFor="notes">Ghi chú</label>
              <textarea name="notes" id="notes" rows="3" value={formData.notes} onChange={handleChange}></textarea>
            </div>

            <div className="checkout-summary">
              <h3>Đơn hàng ({cartItems.length} sản phẩm)</h3>
              <div className="checkout-summary__items">
                {cartItems.map(item => (
                  <div key={item.id} className="checkout-summary__item">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <span className="name">{item.name}</span>
                      <span className="qty">x{item.quantity}</span>
                    </div>
                    <span className="price">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="checkout-summary__row">
                <span>Tạm tính:</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="checkout-summary__row">
                <span>Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>
              <div className="checkout-summary__divider"></div>
              <div className="checkout-summary__row checkout-summary__total">
                <span>Tổng cộng:</span>
                <span>{formatPrice(total)}</span>
              </div>
              <button type="submit" className="btn btn--primary btn--lg" style={{width: '100%', marginTop: '20px'}}>
                Đặt hàng
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}

export default Checkout

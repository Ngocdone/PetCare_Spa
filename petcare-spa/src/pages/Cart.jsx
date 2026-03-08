import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCart, removeFromCart, clearCart, formatPrice } from '../utils/storage'

function Cart() {
  const [cartItems, setCartItems] = useState([])

  useEffect(() => {
    setCartItems(getCart())
  }, [])

  const handleRemove = (itemId) => {
    removeFromCart(itemId)
    setCartItems(getCart())
  }

  const handleUpdateQuantity = (itemId, delta) => {
    const cart = getCart()
    const item = cart.find(i => i.id === itemId)
    if (item) {
      item.quantity = Math.max(1, item.quantity + delta)
      localStorage.setItem('petspa_cart', JSON.stringify(cart))
      setCartItems([...cart])
    }
  }

  const handleClearCart = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      clearCart()
      setCartItems([])
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (cartItems.length === 0) {
    return (
      <>
        <section className="cart-hero">
          <div className="cart-hero__bg"></div>
          <div className="container cart-hero__inner">
            <h1 className="cart-hero__title">Giỏ hàng</h1>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <div className="cart-empty">
              <i className="fas fa-shopping-cart"></i>
              <h2>Giỏ hàng trống</h2>
              <p>Chưa có sản phẩm nào trong giỏ hàng</p>
              <Link to="/shop" className="btn btn--primary">Mua sắm ngay</Link>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <section className="cart-hero">
        <div className="cart-hero__bg"></div>
        <div className="container cart-hero__inner">
          <h1 className="cart-hero__title">Giỏ hàng</h1>
          <p className="cart-hero__subtitle">{cartItems.length} sản phẩm</p>
        </div>
      </section>

      <section className="section section--cart">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb__list">
              <li className="breadcrumb__item"><Link to="/" className="breadcrumb__link">Trang chủ</Link></li>
              <li className="breadcrumb__item"><span className="breadcrumb__current">Giỏ hàng</span></li>
            </ol>
          </nav>

          <div className="cart-layout">
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <Link to={`/product/${item.id}`} className="cart-item__image">
                    <img src={item.image} alt={item.name} />
                  </Link>
                  <div className="cart-item__info">
                    <Link to={`/product/${item.id}`} className="cart-item__name">{item.name}</Link>
                    <span className="cart-item__price">{formatPrice(item.price)}</span>
                  </div>
                  <div className="cart-item__quantity">
                    <button onClick={() => handleUpdateQuantity(item.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.id, 1)}>+</button>
                  </div>
                  <div className="cart-item__total">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                  <button className="cart-item__remove" onClick={() => handleRemove(item.id)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Tóm tắt đơn hàng</h3>
              <div className="cart-summary__row">
                <span>Tạm tính:</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="cart-summary__row">
                <span>Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>
              <div className="cart-summary__divider"></div>
              <div className="cart-summary__row cart-summary__total">
                <span>Tổng cộng:</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Link to="/checkout" className="btn btn--primary btn--lg" style={{width: '100%', marginTop: '20px'}}>
                Tiến hành thanh toán
              </Link>
              <button className="btn btn--outline" style={{width: '100%', marginTop: '10px'}} onClick={handleClearCart}>
                Xóa giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Cart

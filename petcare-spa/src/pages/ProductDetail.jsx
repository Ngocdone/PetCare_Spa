import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DATA, formatPrice } from '../data/data'
import { addToCart } from '../utils/storage'

function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const found = DATA.products.find(p => p.id === id)
    setProduct(found)
  }, [id])

  if (!product) {
    return (
      <div className="container" style={{padding: '100px 0', textAlign: 'center'}}>
        <h2>Không tìm thấy sản phẩm</h2>
        <Link to="/shop" className="btn btn--primary">Quay lại cửa hàng</Link>
      </div>
    )
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity
    })
    alert('Đã thêm vào giỏ hàng!')
  }

  const relatedProducts = DATA.products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return (
    <>
      {/* Breadcrumb */}
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb" style={{marginTop: '20px'}}>
          <ol className="breadcrumb__list">
            <li className="breadcrumb__item"><Link to="/" className="breadcrumb__link">Trang chủ</Link></li>
            <li className="breadcrumb__item"><Link to="/shop" className="breadcrumb__link">Cửa hàng</Link></li>
            <li className="breadcrumb__item"><span className="breadcrumb__current">{product.name}</span></li>
          </ol>
        </nav>
      </div>

      {/* Product Detail */}
      <section className="section section--product-detail">
        <div className="container">
          <div className="product-detail">
            <div className="product-detail__gallery">
              <img src={product.image} alt={product.name} className="product-detail__image" />
            </div>
            <div className="product-detail__info">
              <h1 className="product-detail__title">{product.name}</h1>
              <div className="product-detail__rating">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`fas fa-star ${i < Math.floor(product.rating) ? 'product-detail__star--full' : 'product-detail__star--empty'}`}></i>
                ))}
                <span>({product.rating} đánh giá)</span>
              </div>
              <div className="product-detail__price-wrap">
                <span className="product-detail__price">{formatPrice(product.price)}</span>
                {product.oldPrice && (
                  <span className="product-detail__price-old">{formatPrice(product.oldPrice)}</span>
                )}
              </div>
              <p className="product-detail__desc">{product.description}</p>
              
              <div className="product-detail__meta">
                <div className="product-detail__meta-item">
                  <span className="product-detail__meta-label">Loại thú cưng:</span>
                  <span className="product-detail__meta-value">
                    {product.petType === 'both' ? 'Chó & Mèo' : product.petType === 'cho' ? 'Chó' : 'Mèo'}
                  </span>
                </div>
                <div className="product-detail__meta-item">
                  <span className="product-detail__meta-label">Danh mục:</span>
                  <span className="product-detail__meta-value">{product.category}</span>
                </div>
              </div>

              <div className="product-detail__actions">
                <div className="product-detail__quantity">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)}>+</button>
                </div>
                <button className="btn btn--primary btn--lg" onClick={handleAddToCart}>
                  <i className="fas fa-cart-plus"></i> Thêm vào giỏ
                </button>
              </div>

              <div className="product-detail__features">
                <div className="product-detail__feature">
                  <i className="fas fa-truck"></i>
                  <span>Giao hàng nhanh</span>
                </div>
                <div className="product-detail__feature">
                  <i className="fas fa-shield-alt"></i>
                  <span>Bảo hành chính hãng</span>
                </div>
                <div className="product-detail__feature">
                  <i className="fas fa-undo"></i>
                  <span>Đổi trả 7 ngày</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="section__title">Sản phẩm liên quan</h2>
            <div className="products-grid">
              {relatedProducts.map(p => (
                <div key={p.id} className="card card--product">
                  <Link to={`/product/${p.id}`}>
                    <img className="card__image" src={p.image} alt={p.name} />
                  </Link>
                  <div className="card__body">
                    <h3 className="card__title">
                      <Link to={`/product/${p.id}`}>{p.name}</Link>
                    </h3>
                    <div className="card__footer">
                      <span className="card__price">{formatPrice(p.price)}</span>
                      <button 
                        className="btn btn--primary btn--sm"
                        onClick={() => {
                          addToCart({ id: p.id, name: p.name, price: p.price, image: p.image, quantity: 1 })
                          alert('Đã thêm vào giỏ hàng!')
                        }}
                      >
                        <i className="fas fa-cart-plus"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

export default ProductDetail

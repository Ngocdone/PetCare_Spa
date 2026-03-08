import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DATA, formatPrice } from '../data/data'
import { addToCart } from '../utils/storage'

function Shop() {
  const [search, setSearch] = useState('')
  const [selectedPet, setSelectedPet] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPrice, setSelectedPrice] = useState('all')
  const [sortOrder, setSortOrder] = useState('default')
  const [currentPage, setCurrentPage] = useState(1)
  const PER_PAGE = 9

  const filteredProducts = useMemo(() => {
    let result = [...DATA.products]

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchLower) || 
        (p.description && p.description.toLowerCase().includes(searchLower))
      )
    }

    // Pet type filter
    if (selectedPet !== 'all') {
      result = result.filter(p => p.petType === selectedPet || p.petType === 'both')
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory)
    }

    // Price filter
    if (selectedPrice !== 'all') {
      const [min, max] = selectedPrice.split('-').map(v => parseInt(v) || (v === '' ? Infinity : 0))
      result = result.filter(p => p.price >= min && p.price <= max)
    }

    // Sort
    if (sortOrder === 'price-asc') result.sort((a, b) => a.price - b.price)
    else if (sortOrder === 'price-desc') result.sort((a, b) => b.price - a.price)

    return result
  }, [search, selectedPet, selectedCategory, selectedPrice, sortOrder])

  const totalPages = Math.ceil(filteredProducts.length / PER_PAGE)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    })
    alert('Đã thêm vào giỏ hàng!')
  }

  const countForPet = (petId) => {
    if (petId === 'all') return DATA.products.length
    return DATA.products.filter(p => p.petType === petId || p.petType === 'both').length
  }

  const countForCategory = (catId) => {
    if (catId === 'all') return DATA.products.length
    return DATA.products.filter(p => p.category === catId).length
  }

  return (
    <>
      {/* Hero */}
      <section className="shop-hero">
        <div className="shop-hero__bg"></div>
        <div className="container shop-hero__inner">
          <h1 className="shop-hero__title">Thức ăn & Phụ kiện thú cưng</h1>
          <p className="shop-hero__subtitle">Sản phẩm chính hãng, giao nhanh. Chăm sóc bé từng bữa ăn.</p>
        </div>
      </section>

      {/* Shop Content */}
      <section className="section section--shop">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb__list">
              <li className="breadcrumb__item"><Link to="/" className="breadcrumb__link">Trang chủ</Link></li>
              <li className="breadcrumb__item"><span className="breadcrumb__current">Cửa hàng</span></li>
            </ol>
          </nav>

          <div className="shop-layout">
            {/* Sidebar */}
            <aside className="shop-sidebar" id="shopSidebar">
              <div className="shop-sidebar__section">
                <h3 className="shop-sidebar__title">LOẠI THÚ CƯNG</h3>
                <ul className="shop-sidebar__list" id="sidebarPetType">
                  {['all', 'cho', 'meo'].map(pet => (
                    <li key={pet}>
                      <button 
                        className={`shop-sidebar__link ${selectedPet === pet ? 'active' : ''}`}
                        onClick={() => { setSelectedPet(pet); setCurrentPage(1); }}
                      >
                        <span className="shop-sidebar__check"><i className="fas fa-check"></i></span>
                        <span className="shop-sidebar__link-inner">
                          <span className="shop-sidebar__link-text">
                            {pet === 'all' ? 'Tất cả' : pet === 'cho' ? 'Chó' : 'Mèo'}
                          </span>
                        </span>
                        <span className="shop-sidebar__count">{countForPet(pet)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="shop-sidebar__section">
                <h3 className="shop-sidebar__title">DANH MỤC SẢN PHẨM</h3>
                <ul className="shop-sidebar__list" id="sidebarProductCat">
                  {DATA.productCategories.filter(c => c.id !== 'cho' && c.id !== 'meo').map(cat => (
                    <li key={cat.id}>
                      <button 
                        className={`shop-sidebar__link ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
                      >
                        <span className="shop-sidebar__check"><i className="fas fa-check"></i></span>
                        <span className="shop-sidebar__link-inner">
                          <span className="shop-sidebar__link-text">{cat.name}</span>
                        </span>
                        <span className="shop-sidebar__count">{countForCategory(cat.id)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="shop-sidebar__section">
                <h3 className="shop-sidebar__title">GIÁ SẢN PHẨM</h3>
                <ul className="shop-sidebar__list shop-sidebar__list--price">
                  {[
                    { id: 'all', label: 'Tất cả giá' },
                    { id: '0-100000', label: 'Dưới 100.000₫' },
                    { id: '100000-200000', label: '100.000 - 200.000₫' },
                    { id: '200000-500000', label: '200.000 - 500.000₫' },
                    { id: '500000-', label: 'Trên 500.000₫' }
                  ].map(price => (
                    <li key={price.id}>
                      <button 
                        className={`shop-sidebar__link ${selectedPrice === price.id ? 'active' : ''}`}
                        onClick={() => { setSelectedPrice(price.id); setCurrentPage(1); }}
                      >
                        <span className="shop-sidebar__check"><i className="fas fa-check"></i></span>
                        <span className="shop-sidebar__link-inner">{price.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Main Content */}
            <div className="shop-main">
              <div className="shop-main__top">
                <div className="shop-search">
                  <i className="fas fa-search"></i>
                  <input 
                    type="search" 
                    id="shopSearch" 
                    placeholder="Tìm sản phẩm..." 
                    className="shop-search__input"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  />
                </div>
                <div className="shop-sort">
                  <label htmlFor="shopSort">Sắp xếp:</label>
                  <select 
                    id="shopSort" 
                    className="shop-sort__select"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="default">Mới nhất</option>
                    <option value="price-asc">Giá thấp đến cao</option>
                    <option value="price-desc">Giá cao đến thấp</option>
                  </select>
                </div>
              </div>

              <p className="shop-results">
                {filteredProducts.length} sản phẩm
                {totalPages > 1 && ` (trang ${currentPage}/${totalPages})`}
              </p>

              {filteredProducts.length === 0 ? (
                <div className="shop-empty is-visible">
                  <i className="fas fa-box-open"></i>
                  <p>Không tìm thấy sản phẩm phù hợp.</p>
                  <span>Thử đổi từ khóa hoặc bộ lọc.</span>
                </div>
              ) : (
                <>
                  <div className="shop-grid">
                    {paginatedProducts.map(product => (
                      <div key={product.id} className="card card--product">
                        <Link to={`/product/${product.id}`}>
                          <img className="card__image" src={product.image} alt={product.name} />
                        </Link>
                        <div className="card__body">
                          <h3 className="card__title">
                            <Link to={`/product/${product.id}`}>{product.name}</Link>
                          </h3>
                          <div className="card__rating">
                            {[...Array(5)].map((_, i) => (
                              <i key={i} className={`fas fa-star ${i < Math.floor(product.rating) ? 'card__star--full' : 'card__star--empty'}`}></i>
                            ))}
                          </div>
                          <div className="card__footer">
                            <div className="card__price-wrap">
                              <div className="card__price-line">
                                <span className="card__price">{formatPrice(product.price)}</span>
                                {product.oldPrice && <span className="card__price-old">{formatPrice(product.oldPrice)}</span>}
                              </div>
                            </div>
                            <button 
                              type="button" 
                              className="btn btn--primary btn--sm"
                              onClick={() => handleAddToCart(product)}
                            >
                              <i className="fas fa-cart-plus"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="shop-pagination">
                      <div className="shop-pagination__inner">
                        <button 
                          className="shop-pagination__btn shop-pagination__prev" 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => p - 1)}
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <div className="shop-pagination__pages">
                          {[...Array(totalPages)].map((_, i) => (
                            <button 
                              key={i + 1}
                              className={`shop-pagination__page ${currentPage === i + 1 ? 'shop-pagination__page--active' : ''}`}
                              onClick={() => setCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                        <button 
                          className="shop-pagination__btn shop-pagination__next" 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => p + 1)}
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Shop

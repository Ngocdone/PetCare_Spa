import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DATA, formatPrice } from '../data/data'

function Services() {
  const [selectedPet, setSelectedPet] = useState('cho')

  return (
    <>
      {/* Hero */}
      <section className="services-hero">
        <div className="services-hero__bg"></div>
        <div className="container services-hero__inner">
          <h1 className="services-hero__title">Dịch vụ Spa & Chăm sóc</h1>
          <p className="services-hero__subtitle">Chuyên nghiệp, tận tâm với từng bé thú cưng</p>
        </div>
      </section>

      {/* Services Content */}
      <section className="section section--services-list">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb__list">
              <li className="breadcrumb__item"><Link to="/" className="breadcrumb__link">Trang chủ</Link></li>
              <li className="breadcrumb__item"><span className="breadcrumb__current">Dịch vụ</span></li>
            </ol>
          </nav>

          {/* Pet Type Tabs */}
          <div className="services-tabs">
            <button 
              className={`services-tab ${selectedPet === 'cho' ? 'active' : ''}`}
              onClick={() => setSelectedPet('cho')}
            >
              <i className="fas fa-dog"></i> Dịch vụ cho Chó
            </button>
            <button 
              className={`services-tab ${selectedPet === 'meo' ? 'active' : ''}`}
              onClick={() => setSelectedPet('meo')}
            >
              <i className="fas fa-cat"></i> Dịch vụ cho Mèo
            </button>
          </div>

          {/* Services Grid */}
          <div className="services-grid">
            {DATA.services.filter(s => s.petType === 'both' || s.petType === selectedPet).map(service => (
              <div key={service.id} className="card card--service">
                <img src={service.image} alt={service.name} className="card__image" />
                <div className="card__body">
                  <h3 className="card__title">{service.name}</h3>
                  <p className="card__text">{service.description}</p>
                  <div className="card__meta">
                    <span className="card__duration">
                      <i className="fas fa-clock"></i> {service.duration} {service.unit || 'phút'}
                    </span>
                  </div>
                  <div className="card__footer">
                    <div className="card__price-wrap">
                      <span className="card__price">
                        {selectedPet === 'cho' ? formatPrice(service.priceDog) : formatPrice(service.priceCat)}
                      </span>
                      <span className="card__price-label">
                        / {selectedPet === 'cho' ? 'chó' : 'mèo'}
                      </span>
                    </div>
                    <Link to={`/booking?service=${service.id}&petType=${selectedPet}`} className="btn btn--primary">
                      Đặt ngay
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="services-features">
            <div className="services-feature">
              <div className="services-feature__icon">
                <i className="fas fa-leaf"></i>
              </div>
              <h3>100% Organic</h3>
              <p>Sản phẩm tự nhiên, an toàn cho da lông</p>
            </div>
            <div className="services-feature">
              <div className="services-feature__icon">
                <i className="fas fa-user-md"></i>
              </div>
              <h3>Chuyên gia</h3>
              <p>Đội ngũ Groomer chuyên nghiệp</p>
            </div>
            <div className="services-feature">
              <div className="services-feature__icon">
                <i className="fas fa-video"></i>
              </div>
              <h3>Giám sát 24/7</h3>
              <p>Theo dõi qua app khi đang làm dịch vụ</p>
            </div>
            <div className="services-feature">
              <div className="services-feature__icon">
                <i className="fas fa-car"></i>
              </div>
              <h3>Đưa đón</h3>
              <p>Miễn phí trong bán kính 5km</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section--cta">
        <div className="container">
          <div className="cta-box">
            <h2>Đặt lịch ngay hôm nay</h2>
            <p>Thú cưng của bạn xứng đáng được chăm sóc tốt nhất</p>
            <Link to="/booking" className="btn btn--primary btn--lg">
              <i className="fas fa-calendar-check"></i> Đặt lịch ngay
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default Services

/**
 * Trang chủ: hero, dịch vụ nổi bật, sản phẩm, modal đặt lịch.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../api/products.js'
import { fetchServices } from '../api/services.js'
import ServiceBookingModal from '../components/ServiceBookingModal.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { formatPrice } from '../utils/format.js'
import { getProductImageSrc } from '../utils/assets.js'
import { isServiceFeatured } from '../utils/serviceFeatured.js'

const HERO_BG = [
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1920&q=80',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1920&q=80',
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1920&q=80',
]

const STATIC_SERVICES = [
  {
    id: 's1',
    name: 'Tắm & sấy',
    description: 'Tắm sạch, sấy khô và chải lông gọn gàng.',
    image:
      'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80',
    priceDog: 150000,
    priceCat: 130000,
  },
  {
    id: 's2',
    name: 'Cắt tỉa lông',
    description: 'Kiểu dáng theo giống, an toàn cho da và lông.',
    image:
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    priceDog: 250000,
    priceCat: 220000,
  },
  {
    id: 's3',
    name: 'Spa thơm mát',
    description: 'Ủ thảo mộc, massage nhẹ nhàng cho thư giãn.',
    image:
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80',
    priceDog: 320000,
    priceCat: 290000,
  },
]

const GALLERY_DEFAULT = [
  {
    src: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    title: 'Chó Poodle sau spa',
  },
  {
    src: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
    title: 'Chó Golden vui vẻ',
  },
  {
    src: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80',
    title: 'Mèo Ba Tư',
  },
  {
    src: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80',
    title: 'Chó Corgi đáng yêu',
  },
  {
    src: 'https://images.unsplash.com/photo-1581888227599-779811939961?w=800&q=80',
    title: 'Chăm sóc chuyên nghiệp',
  },
]

const BRANDS = [
  'Royal Canin',
  'Pedigree',
  'Whiskas',
  'Hills',
  'Organic Pet',
  'PetSafe',
]

const FAQS = [
  {
    q: 'Thú cưng cần chuẩn bị gì trước khi đến spa?',
    a: 'Nên cho bé đi vệ sinh trước, mang theo sổ tiêm phòng (nếu có) và mô tả tình trạng da lông để groomer tư vấn.',
  },
  {
    q: 'Có dịch vụ đưa đón không?',
    a: 'Có, miễn phí trong bán kính 5km tùy khung giờ. Vui lòng ghi chú khi đặt lịch hoặc gọi hotline.',
  },
]

export default function Home() {
  const [heroIdx, setHeroIdx] = useState(0)
  const [beforePct, setBeforePct] = useState(50)
  const [cd, setCd] = useState({
    d: '00',
    h: '00',
    m: '00',
    s: '00',
  })
  const [products, setProducts] = useState([])
  const [productsErr, setProductsErr] = useState(null)
  const [faqOpen, setFaqOpen] = useState(0)
  const [apiServices, setApiServices] = useState(null)
  const [bookingService, setBookingService] = useState(null)

  const bestSellers = useMemo(() => {
    const best = products.filter((p) => p.bestSeller).slice(0, 8)
    if (best.length) return best
    return products.slice(0, 8)
  }, [products])

  useEffect(() => {
    const t = setInterval(() => {
      setHeroIdx((i) => (i + 1) % HERO_BG.length)
    }, 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      const diff = end - new Date()
      if (diff <= 0) {
        setCd({ d: '00', h: '00', m: '00', s: '00' })
        return
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const secs = Math.floor((diff % (1000 * 60)) / 1000)
      setCd({
        d: String(days).padStart(2, '0'),
        h: String(hours).padStart(2, '0'),
        m: String(mins).padStart(2, '0'),
        s: String(secs).padStart(2, '0'),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((e) => setProductsErr(e.message))
  }, [])

  useEffect(() => {
    fetchServices()
      .then(setApiServices)
      .catch(() => setApiServices(null))
  }, [])

  const homeServiceCards = useMemo(() => {
    if (apiServices === null) {
      return STATIC_SERVICES.map((s) => ({ kind: 'static', service: s }))
    }
    if (apiServices.length === 0) {
      return []
    }
    const featured = apiServices
      .filter((s) => isServiceFeatured(s))
      .sort((a, b) => (Number(a.orderNo) || 0) - (Number(b.orderNo) || 0))
    return featured.slice(0, 6).map((s) => ({ kind: 'api', service: s }))
  }, [apiServices])

  const homeServicesFromApi = apiServices !== null

  return (
    <main>
      <section className="hero-modern">
        <div className="hero-modern__slider">
          {HERO_BG.map((url, i) => (
            <div
              key={url}
              className={`hero-modern__slide${i === heroIdx ? ' active' : ''}`}
              style={{ backgroundImage: `url('${url}')` }}
            >
              <div className="hero-modern__overlay" />
            </div>
          ))}
        </div>
        <div className="hero-modern__content">
          <div className="container">
            <div className="hero-modern__text">
              <h1 className="hero-modern__title" data-aos="fade-up">
                Spa &amp; Chăm Sóc
                <br />
                <span className="hero-modern__title-highlight">
                  Thú Cưng Chuyên Nghiệp
                </span>
              </h1>
              <p
                className="hero-modern__subtitle"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                Dịch vụ spa cao cấp, sản phẩm organic an toàn, đội ngũ giàu kinh
                nghiệm.
                <br />
                Thú cưng của bạn xứng đáng được chăm sóc tốt nhất!
              </p>
              <div
                className="hero-modern__cta"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                <Link
                  to="/services"
                  className="btn-modern btn-modern--primary"
                >
                  <span>Đặt lịch ngay</span>
                </Link>
                <Link
                  to="/shop"
                  className="btn-modern btn-modern--outline"
                >
                  <span>Xem cửa hàng</span>
                </Link>
              </div>
              <div
                className="hero-modern__stats"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                <div className="hero-stat">
                  <span className="hero-stat__number">5000+</span>
                  <span className="hero-stat__label">Khách hàng</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat__number">4.9/5</span>
                  <span className="hero-stat__label">Đánh giá</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat__number">10+</span>
                  <span className="hero-stat__label">Năm kinh nghiệm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-modern__controls">
          <button
            type="button"
            className="hero-modern__arrow hero-modern__arrow--prev"
            aria-label="Trước"
            onClick={() =>
              setHeroIdx((i) => (i - 1 + HERO_BG.length) % HERO_BG.length)
            }
          >
            ‹
          </button>
          <button
            type="button"
            className="hero-modern__arrow hero-modern__arrow--next"
            aria-label="Sau"
            onClick={() => setHeroIdx((i) => (i + 1) % HERO_BG.length)}
          >
            ›
          </button>
        </div>
        <div className="hero-modern__dots">
          {HERO_BG.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`hero-modern__dot${i === heroIdx ? ' active' : ''}`}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setHeroIdx(i)}
            />
          ))}
        </div>
      </section>

      <section className="section section--about-modern" id="about">
        <div className="container">
          <div className="about-modern">
            <div className="about-modern__content" data-aos="fade-right">
              <span className="about-modern__badge">Về chúng tôi</span>
              <h2 className="about-modern__title">
                Chuyên Gia Chăm Sóc
                <br />
                Thú Cưng Hàng Đầu
              </h2>
              <p className="about-modern__text">
                Pet Spa &amp; Shop tự hào là đơn vị tiên phong trong lĩnh vực chăm
                sóc thú cưng tại Việt Nam. Với hơn 10 năm kinh nghiệm, chúng tôi
                cam kết mang đến dịch vụ spa cao cấp, sản phẩm organic an toàn
                và đội ngũ chuyên gia giàu kinh nghiệm.
              </p>
              <div className="about-modern__features">
                <div className="about-feature">
                  <div className="about-feature__content">
                    <h4>Chứng nhận quốc tế</h4>
                    <p>Đội ngũ groomer được đào tạo bài bản</p>
                  </div>
                </div>
                <div className="about-feature">
                  <div className="about-feature__content">
                    <h4>100% Organic</h4>
                    <p>Sản phẩm an toàn, thân thiện môi trường</p>
                  </div>
                </div>
                <div className="about-feature">
                  <div className="about-feature__content">
                    <h4>Bảo hiểm toàn diện</h4>
                    <p>An tâm tuyệt đối cho thú cưng</p>
                  </div>
                </div>
              </div>
              <Link
                to="/about"
                className="btn-modern btn-modern--primary"
              >
                Tìm hiểu thêm
              </Link>
            </div>
            <div className="about-modern__media" data-aos="fade-left">
              <div className="before-after-slider">
                <div className="before-after-slider__container">
                  <img
                    src={getProductImageSrc('sau-spa.jpg')}
                    alt="Sau spa"
                    className="before-after-slider__after"
                  />
                  <img
                    src={getProductImageSrc('truoc-spa.jpg')}
                    alt="Trước spa"
                    className="before-after-slider__before"
                    style={{
                      clipPath: `inset(0 ${100 - beforePct}% 0 0)`,
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={beforePct}
                    className="before-after-slider__range"
                    id="beforeAfterRange"
                    onChange={(e) =>
                      setBeforePct(Number(e.target.value))
                    }
                  />
                  <div
                    className="before-after-slider__divider"
                    id="beforeAfterDivider"
                    style={{ left: `${beforePct}%` }}
                  >
                    <div className="before-after-slider__handle" />
                  </div>
                </div>
                <div className="before-after-slider__labels">
                  <span className="before-after-slider__label before-after-slider__label--before">
                    Trước
                  </span>
                  <span className="before-after-slider__label before-after-slider__label--after">
                    Sau
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--why-modern">
        <div className="container">
          <div className="section-header-modern" data-aos="fade-up">
            <h2 className="section-title-modern">Tại Sao Chọn Pet Spa &amp; Shop?</h2>
            <p className="section-subtitle-modern">
              Chúng tôi cam kết mang đến trải nghiệm chăm sóc thú cưng tốt nhất
            </p>
          </div>
          <div className="why-grid-modern">
            {[
              {
                img: 'oganic.jpg',
                title: '100% Organic',
                desc: 'Sản phẩm chăm sóc từ thiên nhiên, không hóa chất độc hại.',
              },
              {
                img: 'chuyen-gia-lanh-nghe.jpg',
                title: 'Chuyên Gia Lành Nghề',
                desc: 'Groomer chứng chỉ quốc tế, hơn 10 năm kinh nghiệm.',
              },
              {
                img: 'giam-sat.png',
                title: 'Giám Sát 24/7',
                desc: 'Camera HD, theo dõi trực tiếp qua app.',
              },
              {
                img: 'dua-don.jpg',
                title: 'Đưa Đón Miễn Phí',
                desc: 'Trong bán kính 5km, tiết kiệm thời gian.',
              },
            ].map((w) => (
              <div key={w.title} className="why-card-modern" data-aos="fade-up">
                <div className="why-card-modern__image">
                  <img src={getProductImageSrc(w.img)} alt={w.title} />
                  <div className="why-card-modern__overlay" />
                </div>
                <div className="why-card-modern__content">
                  <h3 className="why-card-modern__title">{w.title}</h3>
                  <p className="why-card-modern__desc">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--services">
        <div className="container">
          <h2 className="section__title">Dịch vụ nổi bật</h2>
          <p className="section__subtitle">
            Cắt tỉa, Tắm, Spa toàn diện, Khách sạn thú cưng.
          </p>
          <div
            className="products-grid"
            style={{ marginTop: '1.5rem' }}
          >
            {homeServiceCards.length === 0 && homeServicesFromApi ? (
              <p className="section__subtitle" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                Chưa có dịch vụ nào được đánh dấu nổi bật. Vào{' '}
                <Link to="/admin/services">quản trị → Dịch vụ spa</Link> để bật “Dịch vụ nổi bật”, hoặc{' '}
                <Link to="/services">xem tất cả dịch vụ</Link>.
              </p>
            ) : null}
            {homeServiceCards.map((item) => {
              const s = item.service
              const isInactive = String(s.status || 'active') !== 'active'
              const priceText =
                s.priceDog != null &&
                s.priceCat != null &&
                s.priceDog !== s.priceCat
                  ? `Từ ${formatPrice(Math.min(s.priceDog, s.priceCat))}`
                  : formatPrice(s.priceDog ?? s.priceCat ?? 0)
              const isApi = item.kind === 'api'
              const showFeaturedBadge = isApi && isServiceFeatured(s)
              return (
                <div className="card card--service" key={String(s.id)}>
                  {showFeaturedBadge ? (
                    <span className="card__badge-featured">Nổi bật</span>
                  ) : null}
                  <img
                    className="card__image"
                    src={getProductImageSrc(s.image || '')}
                    alt={s.name}
                  />
                  <div className="card__body">
                    <h3 className="card__title">{s.name}</h3>
                    <p className="card__text">{s.description}</p>
                    <div className="card__footer">
                      <span className="card__price">{priceText}</span>
                      {isApi ? (
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => {
                            if (isInactive) {
                              window.alert('Dịch vụ tạm ngưng. Vui lòng chọn dịch vụ khác.')
                              return
                            }
                            setBookingService(s)
                          }}
                        >
                          {isInactive ? 'Tạm ngưng' : 'Đặt lịch'}
                        </button>
                      ) : (
                        <Link to="/services" className="btn btn--primary btn--sm">
                          Đặt lịch
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section section--process">
        <div className="container">
          <h2 className="section__title">Quy trình đơn giản</h2>
          <p className="section__subtitle">
            4 bước từ đặt lịch đến bàn giao thú cưng.
          </p>
          <div className="process-grid">
            {[
              ['1', 'Đặt lịch', 'Chọn dịch vụ và ngày giờ phù hợp.'],
              ['2', 'Đưa đón', 'Đón tại nhà hoặc bạn đưa đến spa.'],
              ['3', 'Spa', 'Tắm, cắt tỉa theo gói đã chọn.'],
              ['4', 'Bàn giao', 'Giao bé tận nhà hoặc đón tại spa.'],
            ].map(([num, title, desc]) => (
              <div className="process-step" key={num}>
                <div className="process-step__num">{num}</div>
                <h3 className="process-step__title">{title}</h3>
                <p className="process-step__desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--promo">
        <div className="container">
          <div className="promo-banner">
            <div className="promo-banner__content">
              <h2 className="promo-banner__title">Giảm 20% gói Spa toàn diện</h2>
              <p className="promo-banner__subtitle">
                Áp dụng đến hết tháng. Đặt lịch ngay!
              </p>
              <div className="countdown" id="countdown">
                <div className="countdown__item">
                  <span className="countdown__value" id="cdDays">
                    {cd.d}
                  </span>
                  <span className="countdown__label">Ngày</span>
                </div>
                <div className="countdown__item">
                  <span className="countdown__value" id="cdHours">
                    {cd.h}
                  </span>
                  <span className="countdown__label">Giờ</span>
                </div>
                <div className="countdown__item">
                  <span className="countdown__value" id="cdMins">
                    {cd.m}
                  </span>
                  <span className="countdown__label">Phút</span>
                </div>
                <div className="countdown__item">
                  <span className="countdown__value" id="cdSecs">
                    {cd.s}
                  </span>
                  <span className="countdown__label">Giây</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--products">
        <div className="container">
          <h2 className="section__title">Sản phẩm bán chạy</h2>
          {productsErr ? (
            <p className="section__subtitle" style={{ color: 'crimson' }}>
              {productsErr} — Hãy chạy backend và import database/petcare_spa_vi.sql.
            </p>
          ) : null}
          <div className="products-grid" id="bestSellersGrid">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="text-center" style={{ marginTop: '1.5rem' }}>
            <Link to="/shop" className="btn btn--primary">
              Xem tất cả sản phẩm
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--gallery-modern">
        <div className="container">
          <div className="section-header-modern" data-aos="fade-up">
            <h2 className="section-title-modern">Khoảnh Khắc Đáng Yêu</h2>
            <p className="section-subtitle-modern">
              Hình ảnh chân thật về thú cưng sau khi được chăm sóc
            </p>
          </div>
          <div className="gallery-modern" id="galleryModern">
            {GALLERY_DEFAULT.map((g, i) => (
              <div
                key={g.title}
                className="gallery-modern__item aos-animate"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="gallery-modern__image">
                  <img src={g.src} alt={g.title} loading="lazy" />
                  <div className="gallery-modern__overlay">
                    <span className="gallery-modern__caption">{g.title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--faq">
        <div className="container">
          <h2 className="section__title">Câu hỏi thường gặp</h2>
          <div className="accordion" id="faqAccordion">
            {FAQS.map((item, i) => (
              <div
                className={`accordion__item${faqOpen === i ? ' open' : ''}`}
                key={item.q}
              >
                <button
                  type="button"
                  className="accordion__header"
                  onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}
                >
                  {item.q}
                </button>
                <div
                  className="accordion__body"
                  style={
                    faqOpen === i
                      ? { maxHeight: '200px' }
                      : { maxHeight: 0 }
                  }
                >
                  <div className="accordion__content">
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--brands">
        <div className="brands">
          <div className="brands__track" id="brandsTrack">
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <span className="brands__item" key={`${b}-${i}`}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {bookingService ? (
        <ServiceBookingModal
          key={bookingService.id}
          service={bookingService}
          petFilter="all"
          onClose={() => setBookingService(null)}
        />
      ) : null}
    </main>
  )
}

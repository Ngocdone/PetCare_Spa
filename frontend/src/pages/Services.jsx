/**
 * Danh sách dịch vụ spa + lọc; dữ liệu từ fetchServices.
 */
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchServices } from '../api/services.js'
import { isServiceFeatured } from '../utils/serviceFeatured.js'
import { formatPrice } from '../utils/format.js'
import { getProductImageSrc } from '../utils/assets.js'
import ServiceBookingModal from '../components/ServiceBookingModal.jsx'
import { getCurrentUser } from '../utils/auth.js'

function filterByPet(list, pet) {
  if (pet === 'all') return list
  return list.filter((s) => {
    const pt = s.petType || 'both'
    if (pet === 'dog')
      return pt === 'both' || pt === 'cho' || pt === 'dog'
    if (pet === 'cat')
      return pt === 'both' || pt === 'meo' || pt === 'cat'
    return pt === pet || pt === 'both'
  })
}

function renderPriceHtml(s, petFilter) {
  const pt = String(s.petType || 'both').toLowerCase()
  const dogOnly = pt === 'cho' || pt === 'dog'
  const catOnly = pt === 'meo' || pt === 'cat'
  const hasDog = s.priceDog != null && Number(s.priceDog) > 0
  const hasCat = s.priceCat != null && Number(s.priceCat) > 0
  if (dogOnly) return formatPrice(s.priceDog ?? 0)
  if (catOnly) return formatPrice(s.priceCat ?? 0)
  if (petFilter === 'dog' && hasDog) return formatPrice(s.priceDog ?? 0)
  if (petFilter === 'cat' && hasCat) return formatPrice(s.priceCat ?? 0)
  if (hasDog && hasCat && s.priceDog !== s.priceCat) {
    return (
      <span className="service-card__price-row">
        <span>Chó: {formatPrice(s.priceDog ?? 0)}</span>
        <span>Mèo: {formatPrice(s.priceCat ?? 0)}</span>
      </span>
    )
  }
  return formatPrice(s.priceDog ?? s.priceCat ?? 0)
}

export default function Services() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const initial =
    searchParams.get('pet') === 'dog' || searchParams.get('pet') === 'cat'
      ? searchParams.get('pet')
      : 'all'
  const [petFilter, setPetFilter] = useState(initial)
  const [services, setServices] = useState([])
  const [err, setErr] = useState(null)
  const [bookingService, setBookingService] = useState(null)

  useEffect(() => {
    fetchServices()
      .then(setServices)
      .catch((e) => setErr(e.message))
  }, [])

  const list = useMemo(
    () => filterByPet(services, petFilter),
    [services, petFilter]
  )

  return (
    <main className="page-main page-main--services">
      <section className="services-hero">
        <div className="services-hero__bg" />
        <div className="container services-hero__inner">
          <h1 className="services-hero__title">Spa &amp; Chăm sóc thú cưng</h1>
          <p className="services-hero__subtitle">
            Bảng giá rõ ràng, đặt lịch nhanh chóng. Chuyên nghiệp, tận tâm.
          </p>
        </div>
      </section>

      <section className="section section--services-list">
        <div className="container">
          <div className="services-filter" id="servicesFilter">
            <button
              type="button"
              className={`services-filter__btn${petFilter === 'all' ? ' active' : ''}`}
              data-pet="all"
              onClick={() => setPetFilter('all')}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`services-filter__btn${petFilter === 'dog' ? ' active' : ''}`}
              data-pet="dog"
              onClick={() => setPetFilter('dog')}
            >
              Chó
            </button>
            <button
              type="button"
              className={`services-filter__btn${petFilter === 'cat' ? ' active' : ''}`}
              data-pet="cat"
              onClick={() => setPetFilter('cat')}
            >
              Mèo
            </button>
          </div>

          {err ? (
            <p style={{ color: 'crimson' }}>{err} — Hãy chạy backend và import DB.</p>
          ) : null}

          <div className="services-list" id="servicesList">
            {list.map((s) => {
              const duration = s.unit
                ? `${s.duration} ${s.unit}`
                : `${s.duration} phút`
              const isInactive = String(s.status || 'active') !== 'active'
              return (
                <article
                  className="service-card"
                  key={s.id}
                  id={s.category}
                  {...(isServiceFeatured(s) ? { 'data-featured': 'true' } : {})}
                  data-pet-type={s.petType || 'both'}
                >
                  <div className="service-card__image-wrap">
                    <img
                      className="service-card__image"
                      src={getProductImageSrc(s.image || '')}
                      alt={s.name}
                      loading="lazy"
                    />
                    <span className="service-card__duration">{duration}</span>
                  </div>
                  <div className="service-card__body">
                    <h2 className="service-card__title">{s.name}</h2>
                    <p className="service-card__desc">{s.description}</p>
                    <div className="service-card__price">
                      {renderPriceHtml(s, petFilter)}
                    </div>
                    <button
                      type="button"
                      className="btn btn--primary service-card__cta"
                      onClick={() => {
                        if (isInactive) {
                          window.alert('Dịch vụ tạm ngưng. Vui lòng chọn dịch vụ khác.')
                          return
                        }
                        const u = getCurrentUser()
                        if (!u?.id) {
                          const ret = encodeURIComponent(location.pathname + location.search)
                          navigate(`/login?return=${ret}&reason=booking_required`)
                          return
                        }
                        setBookingService(s)
                      }}
                    >
                      {isInactive ? 'Tạm ngưng' : 'Đặt lịch'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {bookingService ? (
        <ServiceBookingModal
          key={bookingService.id}
          service={bookingService}
          petFilter={petFilter}
          onClose={() => setBookingService(null)}
        />
      ) : null}
    </main>
  )
}

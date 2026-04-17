/**
 * Modal đặt lịch dịch vụ từ trang chủ/dịch vụ: form + POST booking API.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiUrl } from '../config.js'
import { fetchMyPets } from '../api/pets.js'
import { formatPrice } from '../utils/format.js'
import { localDateStr } from '../utils/localDateStr.js'
import { getCurrentUser } from '../utils/auth.js'
import { getUserProfile } from '../utils/userProfile.js'

const BOOKINGS_KEY = 'petspa_bookings'

const DEFAULT_SHOPS = [
  {
    id: 1,
    name: 'Pet Spa & Shop - Cơ sở 1',
    address:
      'QTSC Building 1, Đường Quang Trung, Tân Hưng Thuận, Hóc Môn, TP. Hồ Chí Minh',
  },
]

function getTimeSlots() {
  const slots = []
  for (let h = 8; h <= 17; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 17 && m === 30) break
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

function isSlotPassed(slotTimeStr, selectedDateStr) {
  const todayStr = localDateStr()
  if (selectedDateStr !== todayStr) return false
  const today = new Date()
  const parts = slotTimeStr.split(':')
  const slotMin = parseInt(parts[0], 10) * 60 + parseInt(parts[1] || 0, 10)
  const nowMin = today.getHours() * 60 + today.getMinutes()
  return slotMin <= nowMin
}

function getServicePrice(s, petType) {
  if (petType === 'dog' && s.priceDog != null) return s.priceDog
  if (petType === 'cat' && s.priceCat != null) return s.priceCat
  return s.priceDog ?? s.priceCat ?? 0
}

function initialPetTypeFrom(service, petFilter) {
  if (petFilter === 'dog') return 'dog'
  if (petFilter === 'cat') return 'cat'
  const pt = service.petType
  if (pt === 'cho' || pt === 'dog') return 'dog'
  if (pt === 'meo' || pt === 'cat') return 'cat'
  return null
}

function formatDateVi(isoDate) {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) return isoDate
  return `${d}/${m}/${y}`
}

/**
 * Modal đặt lịch nhanh: hiển thị thông tin dịch vụ từ thẻ + form có
 * thông tin user mặc định (đã đăng nhập / đã lưu profile).
 */
export default function ServiceBookingModal({ service, petFilter = 'all', onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [myPets, setMyPets] = useState([])
  const [petId, setPetId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerAddress, setOwnerAddress] = useState('')
  const [note, setNote] = useState('')

  const [err, setErr] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId] = useState(null)
  const [successSummary, setSuccessSummary] = useState(null)

  useEffect(() => {
    setPetId('')
    setMyPets([])
    setDate(localDateStr())
    setTime('')
    setNote('')
    setErr({})
    setSuccessId(null)
    setSuccessSummary(null)
    setSubmitting(false)

    const u = getCurrentUser()
    const profile = getUserProfile()
    setOwnerName(profile.name || u?.name || '')
    setOwnerEmail(profile.email || u?.email || '')
    setOwnerPhone(profile.phone || u?.phone || '')
    setOwnerAddress(profile.address || '')
  }, [service, petFilter])

  useEffect(() => {
    let cancelled = false
    const u = getCurrentUser()
    if (!u?.id) {
      setMyPets([])
      return () => {
        cancelled = true
      }
    }
    ;(async () => {
      try {
        const data = await fetchMyPets()
        if (cancelled) return
        if (data?.success && Array.isArray(data.pets)) setMyPets(data.pets)
        else setMyPets([])
      } catch {
        if (!cancelled) setMyPets([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [service?.id])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const durationLabel = service.unit
    ? `${service.duration} ${service.unit}`
    : `${service.duration} phút`

  const resolvedPetType = useMemo(
    () => initialPetTypeFrom(service, petFilter),
    [service, petFilter]
  )

  const availableSlots = useMemo(() => {
    if (!date) return []
    return getTimeSlots().filter((t) => !isSlotPassed(t, date))
  }, [date])

  const minDate = localDateStr()

  const priceDisplay = useMemo(() => {
    const t = resolvedPetType
    if (!t) {
      if (
        service.priceDog != null &&
        service.priceCat != null &&
        service.priceDog !== service.priceCat
      ) {
        return `${formatPrice(service.priceDog)} / ${formatPrice(service.priceCat)}`
      }
      return formatPrice(service.priceDog ?? service.priceCat ?? 0)
    }
    return formatPrice(getServicePrice(service, t))
  }, [service, resolvedPetType])

  const petOptions = useMemo(() => {
    if (!Array.isArray(myPets) || !myPets.length) return []
    if (!resolvedPetType) return myPets
    return myPets.filter((p) => String(p.pet_type || '').toLowerCase() === resolvedPetType)
  }, [myPets, resolvedPetType])

  useEffect(() => {
    if (!petOptions.length) {
      if (petId) setPetId('')
      return
    }
    const exists = petOptions.some((p) => String(p.id) === String(petId))
    if (!exists) setPetId(String(petOptions[0].id))
  }, [petOptions, petId])

  const clearErrors = (keys) => {
    setErr((prev) => {
      const n = { ...prev }
      keys.forEach((k) => delete n[k])
      return n
    })
  }

  const validate = () => {
    const e = {}
    if (!petId) e.petId = 'Vui lòng chọn thú cưng.'
    if (!date) e.date = 'Vui lòng chọn ngày.'
    if (!time) e.time = 'Vui lòng chọn giờ.'
    if (!ownerName.trim()) e.ownerName = 'Vui lòng nhập họ tên.'
    const phone = ownerPhone.replace(/\s/g, '')
    if (!phone || phone.length < 10) e.ownerPhone = 'Số điện thoại hợp lệ (ít nhất 10 số).'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!ownerEmail.trim() || !emailRe.test(ownerEmail)) e.ownerEmail = 'Email hợp lệ.'
    setErr(e)
    return Object.keys(e).length === 0
  }

  const getPayload = useCallback(() => {
    const u = getCurrentUser()
    let emailOut = ownerEmail.trim()
    if (u?.email) emailOut = u.email.trim().toLowerCase()
    const selectedPet = petOptions.find((p) => String(p.id) === String(petId)) || null
    const pType = selectedPet?.pet_type || resolvedPetType || 'dog'
    const servicePrice = getServicePrice(service, pType)
    const pName = String(selectedPet?.name || '').trim()
    const petWeight =
      selectedPet?.weight_kg != null && selectedPet?.weight_kg !== ''
        ? Number(selectedPet.weight_kg)
        : null
    return {
      user_id: u?.id || null,
      pet_id: selectedPet?.id || null,
      service_id: String(service.id),
      serviceName: service.name || '',
      servicePrice,
      pet_type: pType,
      pet_name: pName,
      pet_weight_kg: petWeight,
      shop_id: DEFAULT_SHOPS[0]?.id || null,
      shopName: DEFAULT_SHOPS[0]?.name || '',
      date,
      time,
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      ownerEmail: emailOut,
      ownerAddress: ownerAddress.trim(),
      note: note.trim(),
    }
  }, [
    ownerName,
    ownerPhone,
    ownerEmail,
    ownerAddress,
    note,
    service,
    petOptions,
    petId,
    resolvedPetType,
    date,
    time,
  ])

  const onSubmit = (ev) => {
    ev.preventDefault()
    const currentUser = getCurrentUser()
    if (!currentUser?.id) {
      window.alert('Vui lòng đăng nhập để đặt lịch.')
      const ret = encodeURIComponent(location.pathname + location.search)
      onClose()
      navigate(`/login?return=${ret}&reason=booking_required`)
      return
    }
    if (!validate()) return
    const data = getPayload()
    setSubmitting(true)
    fetch(apiUrl('/api/bookings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: data.user_id,
        pet_id: data.pet_id || 0,
        service_id: data.service_id,
        date: data.date,
        time: data.time,
        shop_id: data.shop_id,
        owner_name: data.ownerName,
        owner_phone: data.ownerPhone,
        owner_email: data.ownerEmail,
        owner_address: data.ownerAddress || '',
        pet_name: data.pet_name,
        pet_type: data.pet_type,
        pet_weight_kg: data.pet_weight_kg,
        note: data.note,
      }),
    })
      .then((res) => res.text())
      .then((text) => {
        let result
        try {
          result = JSON.parse(text)
        } catch {
          throw new Error('Máy chủ trả về dữ liệu không hợp lệ.')
        }
        if (result.success) {
          const id = result.id
          setSuccessId(id != null ? String(id) : '')
          setSuccessSummary({
            ownerName: data.ownerName,
            ownerPhone: data.ownerPhone,
            ownerEmail: data.ownerEmail,
            ownerAddress: (data.ownerAddress || '').trim(),
            serviceName: data.serviceName,
            petName: data.pet_name,
            shopName: data.shopName,
            date: data.date,
            time: data.time,
            priceLabel: formatPrice(data.servicePrice),
            note: (data.note || '').trim(),
          })
          try {
            const list = JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || []
            list.push({
              id: id != null ? String(id) : String(Date.now()),
              petName: data.pet_name || '',
              serviceName: data.serviceName || '',
              date: data.date || '',
              time: data.time || '',
              status: 'pending',
              ownerEmail: data.ownerEmail || '',
              servicePrice: data.servicePrice != null ? Number(data.servicePrice) : 0,
            })
            localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list))
          } catch {
            /* ignore */
          }
        } else {
          window.alert(
            result.error ||
              'Rất tiếc, việc đặt lịch chưa thực hiện được. Vui lòng thử lại sau.'
          )
        }
      })
      .catch(() => window.alert('Không thể kết nối. Thử lại sau.'))
      .finally(() => setSubmitting(false))
  }

  return (
    <div
      className="service-booking-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="service-booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-booking-modal-title"
      >
        <div className="service-booking-modal__head">
          <div className="service-booking-modal__head-main">
            <span className="service-booking-modal__eyebrow">Pet Care Spa</span>
            <h2 id="service-booking-modal-title" className="service-booking-modal__title">
              Đặt lịch nhanh
            </h2>
            <p className="service-booking-modal__lede">
              Xem lại dịch vụ và điền thông tin — chúng tôi sẽ gọi xác nhận.
            </p>
          </div>
          <button
            type="button"
            className="service-booking-modal__close"
            aria-label="Đóng"
            onClick={onClose}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {successId !== null ? (
          <div className="service-booking-modal__body service-booking-modal__success">
            <div className="service-booking-modal__success-card">
              <div className="service-booking-modal__success-icon" aria-hidden>
                ✓
              </div>
              <h3 className="service-booking-modal__success-title">
                Đã nhận yêu cầu đặt lịch
              </h3>
              <p className="service-booking-modal__success-id">
                Mã lịch: <strong>{successId}</strong>
              </p>
              {successSummary ? (
                <div className="service-booking-modal__success-summary">
                  <p className="service-booking-modal__success-summary-title">
                    Thông tin đặt lịch
                  </p>
                  <dl className="service-booking-modal__success-dl">
                    <div>
                      <dt>Họ tên</dt>
                      <dd>{successSummary.ownerName}</dd>
                    </div>
                    <div>
                      <dt>Điện thoại</dt>
                      <dd>{successSummary.ownerPhone}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{successSummary.ownerEmail}</dd>
                    </div>
                    {successSummary.ownerAddress ? (
                      <div className="service-booking-modal__success-dl--full">
                        <dt>Địa chỉ</dt>
                        <dd>{successSummary.ownerAddress}</dd>
                      </div>
                    ) : null}
                    <div className="service-booking-modal__success-dl--full">
                      <dt>Dịch vụ</dt>
                      <dd>{successSummary.serviceName}</dd>
                    </div>
                    <div>
                      <dt>Thú cưng</dt>
                      <dd>{successSummary.petName}</dd>
                    </div>
                    <div>
                      <dt>Chi nhánh</dt>
                      <dd>{successSummary.shopName || '—'}</dd>
                    </div>
                    <div>
                      <dt>Ngày &amp; giờ</dt>
                      <dd>
                        {formatDateVi(successSummary.date)} —{' '}
                        {successSummary.time || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt>Ước tính</dt>
                      <dd>{successSummary.priceLabel}</dd>
                    </div>
                    {successSummary.note ? (
                      <div className="service-booking-modal__success-dl--full">
                        <dt>Ghi chú</dt>
                        <dd>{successSummary.note}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : null}
              <p className="service-booking-modal__success-msg">
                Spa sẽ liên hệ qua số điện thoại bạn đã cung cấp trong thời gian sớm nhất.
              </p>
              <div className="service-booking-modal__success-actions">
                <button
                  type="button"
                  className="service-booking-modal__btn service-booking-modal__btn--primary"
                  onClick={onClose}
                >
                  Đóng
                </button>
                <Link
                  to="/user"
                  className="service-booking-modal__btn service-booking-modal__btn--ghost"
                >
                  Lịch của tôi
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <form
            className="service-booking-modal__form"
            onSubmit={onSubmit}
            noValidate
          >
            <div className="service-booking-modal__scroll">
              <div className="service-booking-modal__panel service-booking-modal__panel--service">
                <h3 className="service-booking-modal__section-title">
                  Dịch vụ
                </h3>
                <div className="service-booking-modal__service-layout">
                  {service.image ? (
                    <img
                      className="service-booking-modal__thumb"
                      src={service.image}
                      alt=""
                    />
                  ) : null}
                  <div className="service-booking-modal__service-body">
                    <p className="service-booking-modal__service-name">
                      {service.name}
                    </p>
                    <div className="service-booking-modal__service-meta">
                      <span className="service-booking-modal__meta-pill">
                        {durationLabel}
                      </span>
                      <span className="service-booking-modal__price">
                        {priceDisplay}
                      </span>
                    </div>
                    {service.description ? (
                      <p className="service-booking-modal__service-desc">
                        {service.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="service-booking-modal__columns">
                <div className="service-booking-modal__panel service-booking-modal__panel--stack">
                  <h3 className="service-booking-modal__section-title">
                    Liên hệ
                  </h3>
                  <div className="service-booking-modal__grid service-booking-modal__grid--contact">
                    <div className="form-group">
                      <label htmlFor="sbm-owner-name">
                        Họ tên <span className="required">*</span>
                      </label>
                      <input
                        id="sbm-owner-name"
                        type="text"
                        value={ownerName}
                        onChange={(e) => {
                          setOwnerName(e.target.value)
                          clearErrors(['ownerName'])
                        }}
                        className={err.ownerName ? 'error' : ''}
                      />
                      <span className="form-error">{err.ownerName || ''}</span>
                    </div>
                    <div className="form-group">
                      <label htmlFor="sbm-owner-phone">
                        Số điện thoại <span className="required">*</span>
                      </label>
                      <input
                        id="sbm-owner-phone"
                        type="tel"
                        value={ownerPhone}
                        onChange={(e) => {
                          setOwnerPhone(e.target.value)
                          clearErrors(['ownerPhone'])
                        }}
                        className={err.ownerPhone ? 'error' : ''}
                      />
                      <span className="form-error">{err.ownerPhone || ''}</span>
                    </div>
                    <div className="form-group form-group--full">
                      <label htmlFor="sbm-owner-email">
                        Email <span className="required">*</span>
                      </label>
                      <input
                        id="sbm-owner-email"
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => {
                          setOwnerEmail(e.target.value)
                          clearErrors(['ownerEmail'])
                        }}
                        className={err.ownerEmail ? 'error' : ''}
                      />
                      <span className="form-error">{err.ownerEmail || ''}</span>
                    </div>
                    <div className="form-group form-group--full">
                      <label htmlFor="sbm-owner-address">Địa chỉ</label>
                      <textarea
                        id="sbm-owner-address"
                        rows={2}
                        value={ownerAddress}
                        onChange={(e) => setOwnerAddress(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="service-booking-modal__panel service-booking-modal__panel--stack">
                  <h3 className="service-booking-modal__section-title">
                    Lịch hẹn
                  </h3>
                  <div className="service-booking-modal__grid service-booking-modal__grid--schedule">
                <div className="form-group form-group--full">
                  <label htmlFor="sbm-pet">
                    Thú cưng <span className="required">*</span>
                  </label>
                  <select
                    id="sbm-pet"
                    value={petId}
                    onChange={(e) => {
                      setPetId(e.target.value)
                      clearErrors(['petId'])
                    }}
                    className={err.petId ? 'error' : ''}
                  >
                    <option value="">-- Chọn thú cưng --</option>
                    {petOptions.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name}
                        {p.weight_kg != null ? ` (${p.weight_kg} kg)` : ''}
                      </option>
                    ))}
                  </select>
                  <span className="form-error">
                    {err.petId ||
                      (!petOptions.length
                        ? 'Bạn chưa có thú cưng phù hợp. Hãy thêm ở mục Thú cưng của tôi.'
                        : '')}
                  </span>
                  {!petOptions.length ? (
                    <Link to="/user?tab=pets" className="service-booking-modal__link-inline" onClick={onClose}>
                      + Thêm thú cưng
                    </Link>
                  ) : null}
                </div>

                <div className="form-group">
                  <label htmlFor="sbm-date">
                    Ngày <span className="required">*</span>
                  </label>
                  <input
                    id="sbm-date"
                    type="date"
                    min={minDate}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value)
                      setTime('')
                      clearErrors(['date'])
                    }}
                    className={err.date ? 'error' : ''}
                  />
                  <span className="form-error">{err.date || ''}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="sbm-time">
                    Giờ <span className="required">*</span>
                  </label>
                  <select
                    id="sbm-time"
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value)
                      clearErrors(['time'])
                    }}
                    className={err.time ? 'error' : ''}
                    disabled={!date}
                  >
                    <option value="">
                      {!date ? '-- Chọn ngày trước --' : '-- Chọn giờ --'}
                    </option>
                    {availableSlots.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="form-error">{err.time || ''}</span>
                </div>

                <div className="form-group form-group--full">
                  <label htmlFor="sbm-note">Ghi chú</label>
                  <textarea
                    id="sbm-note"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="service-booking-modal__foot service-booking-modal__foot--single">
              <button
                type="submit"
                className="service-booking-modal__btn service-booking-modal__btn--primary"
                disabled={submitting}
              >
                {submitting ? 'Đang gửi…' : 'Xác nhận đặt lịch'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

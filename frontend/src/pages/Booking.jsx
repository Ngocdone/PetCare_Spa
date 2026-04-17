/**
 * Đặt lịch dịch vụ: chọn dịch vụ, thú cưng, giờ — POST /api/bookings (legacy booking).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { apiUrl } from '../config.js'
import { fetchServices } from '../api/services.js'
import { fetchTeam } from '../api/team.js'
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

function mapPetTypeToServiceFilter(petType) {
  return petType === 'dog' ? 'cho' : 'meo'
}

function filterServicesForPet(services, petType) {
  if (!petType) return []
  const mapType = mapPetTypeToServiceFilter(petType)
  return services.filter((s) => {
    const pt = s.petType || 'both'
    if (pt === 'both' || pt === 'ca_hai') return true
    return pt === mapType
  })
}

function shiftTeamForHour(team, hour) {
  if (!team.length) return []
  const shiftTeam = team.filter((nv) => {
    const isOdd = parseInt(String(nv.id), 10) % 2 !== 0
    return hour < 13 ? isOdd : !isOdd
  })
  return shiftTeam.length ? shiftTeam : team
}

export default function Booking() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const currentUser = getCurrentUser()
  if (!currentUser?.id) {
    const ret = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?return=${ret}&reason=booking_required`} replace />
  }
  const presetService = searchParams.get('service') || ''
  const presetPet = searchParams.get('pet')

  const [step, setStep] = useState(1)
  const [services, setServices] = useState([])
  const [team, setTeam] = useState([])
  const [petsList, setPetsList] = useState([])

  const [petType, setPetType] = useState(() =>
    presetPet === 'cat' ? 'cat' : presetPet === 'dog' ? 'dog' : null
  )
  const [serviceId, setServiceId] = useState(presetService)
  const [petSelect, setPetSelect] = useState('')
  const [petName, setPetName] = useState('')
  const [petWeight, setPetWeight] = useState('')

  const [shopId, setShopId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [employeeName, setEmployeeName] = useState('')

  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerAddress, setOwnerAddress] = useState('')
  const [note, setNote] = useState('')

  const [err, setErr] = useState({})
  const [timeOpen, setTimeOpen] = useState(false)
  const timeWrapRef = useRef(null)
  const [successId, setSuccessId] = useState(null)

  const shops = DEFAULT_SHOPS

  useEffect(() => {
    fetchServices().then(setServices).catch(() => setServices([]))
    fetchTeam().then(setTeam).catch(() => setTeam([]))
  }, [])

  useEffect(() => {
    const u = getCurrentUser()
    if (!u?.id) {
      setPetsList([])
      return
    }
    fetch(apiUrl(`/api/pets?user_id=${encodeURIComponent(u.id)}`))
      .then((r) => r.json())
      .then((arr) => setPetsList(Array.isArray(arr) ? arr : []))
      .catch(() => setPetsList([]))
  }, [])

  useEffect(() => {
    const u = getCurrentUser()
    const profile = getUserProfile()
    if (!u) return
    setOwnerName((n) => n || profile.name || u.name || '')
    setOwnerEmail((e) => e || profile.email || u.email || '')
    setOwnerPhone((p) => p || profile.phone || u.phone || '')
    setOwnerAddress((a) => a || profile.address || '')
  }, [])

  useEffect(() => {
    if (!presetService || !services.length) return
    const found = services.find(
      (s) => String(s.id) === String(presetService)
    )
    if (!found) return
    const pt =
      found.petType === 'meo'
        ? 'cat'
        : found.petType === 'cho'
          ? 'dog'
          : presetPet === 'cat'
            ? 'cat'
            : presetPet === 'dog'
              ? 'dog'
              : null
    if (pt) setPetType(pt)
    setServiceId(String(found.id))
  }, [presetService, presetPet, services])

  const filteredServices = useMemo(
    () => filterServicesForPet(services, petType),
    [services, petType]
  )

  const availableSlots = useMemo(() => {
    if (!date) return []
    return getTimeSlots().filter((t) => !isSlotPassed(t, date))
  }, [date])

  const hourForShift = time ? parseInt(time.split(':')[0], 10) : 12
  const employeeOptions = useMemo(
    () => shiftTeamForHour(team, hourForShift),
    [team, hourForShift]
  )

  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === String(serviceId)),
    [services, serviceId]
  )

  const servicePrice = selectedService
    ? getServicePrice(selectedService, petType || 'dog')
    : 0

  useEffect(() => {
    function onDocClick(e) {
      if (timeWrapRef.current && !timeWrapRef.current.contains(e.target))
        setTimeOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setTimeOpen(false)
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const minDate = localDateStr()

  const petsForSelect = useMemo(() => {
    if (!petType) return []
    return petsList.filter((p) => p.pet_type === petType)
  }, [petsList, petType])

  const clearErrors = (keys) => {
    setErr((prev) => {
      const n = { ...prev }
      keys.forEach((k) => {
        delete n[k]
      })
      return n
    })
  }

  const validate1 = () => {
    const e = {}
    if (!petType) e.petType = 'Vui lòng chọn Chó hoặc Mèo.'
    if (!serviceId) e.service = 'Vui lòng chọn dịch vụ.'
    if (!petSelect) e.pet = 'Vui lòng chọn thú cưng hoặc thêm mới.'
    if (petSelect === 'new') {
      if (!petName.trim()) e.petName = 'Vui lòng nhập tên thú cưng.'
      const w = parseFloat(petWeight)
      if (!petWeight || w < 0.5)
        e.petWeight = 'Cân nặng hợp lệ (từ 0.5 kg).'
    }
    setErr(e)
    return Object.keys(e).length === 0
  }

  const validate2 = () => {
    const e = {}
    if (!shopId) e.shop = 'Vui lòng chọn chi nhánh.'
    if (!date) e.date = 'Vui lòng chọn ngày.'
    if (!time) e.time = 'Vui lòng chọn giờ.'
    setErr(e)
    return Object.keys(e).length === 0
  }

  const validate3 = () => {
    const e = {}
    if (!ownerName.trim()) e.ownerName = 'Vui lòng nhập họ tên.'
    const phone = ownerPhone.replace(/\s/g, '')
    if (!phone || phone.length < 10)
      e.ownerPhone = 'Số điện thoại hợp lệ (ít nhất 10 số).'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!ownerEmail.trim() || !emailRe.test(ownerEmail))
      e.ownerEmail = 'Email hợp lệ.'
    setErr(e)
    return Object.keys(e).length === 0
  }

  const shopLabel = useMemo(() => {
    const s = shops.find((x) => String(x.id) === String(shopId))
    return s?.name || ''
  }, [shopId, shops])

  const getFormPayload = useCallback(() => {
    let petId = 0
    let pName = petName.trim()
    let pWeight = petWeight ? parseFloat(petWeight) : null
    if (petSelect && petSelect !== 'new') {
      const p = petsList.find((x) => String(x.id) === petSelect)
      if (p) {
        petId = p.id
        pName = p.name || ''
        pWeight =
          p.weight_kg != null ? Number(p.weight_kg) : pWeight
      }
    }
    const u = getCurrentUser()
    let emailOut = ownerEmail.trim()
    if (u?.email) emailOut = u.email.trim().toLowerCase()
    return {
      user_id: u?.id || null,
      pet_id: petId,
      service_id: serviceId,
      serviceName: selectedService?.name || '',
      servicePrice,
      pet_type: petType || 'dog',
      pet_name: pName,
      pet_weight_kg: pWeight,
      shop_id: shopId ? parseInt(shopId, 10) : null,
      shopName: shopLabel,
      date,
      time,
      employeeName,
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      ownerEmail: emailOut,
      ownerAddress: ownerAddress.trim(),
      note: note.trim(),
    }
  }, [
    petSelect,
    petName,
    petWeight,
    petsList,
    ownerName,
    ownerPhone,
    ownerEmail,
    ownerAddress,
    note,
    serviceId,
    selectedService,
    servicePrice,
    petType,
    shopId,
    shopLabel,
    date,
    time,
    employeeName,
  ])

  const submitBooking = () => {
    const data = getFormPayload()
    let payloadNote = data.note
    if (data.employeeName) {
      payloadNote = `Chuyên viên được chọn: ${data.employeeName}\n----------------\n${data.note}`
    }
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
        note: payloadNote,
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
      .catch(() => {
        window.alert('Không thể kết nối. Thử lại sau.')
      })
  }

  const stepCls = (n) =>
    `booking-step${n === step ? ' active' : ''}${n < step ? ' done' : ''}`

  return (
    <main className="page-main page-main--booking">
      <section className="booking-hero">
        <div className="booking-hero__bg" />
        <div className="container booking-hero__inner">
          <h1 className="booking-hero__title">Đặt lịch Spa</h1>
          <p className="booking-hero__subtitle">
            Chọn loại Chó hoặc Mèo, sau đó chọn dịch vụ và thú cưng. Chúng tôi
            sẽ xác nhận qua điện thoại trong vòng 24h.
          </p>
        </div>
      </section>

      <section className="section section--booking">
        <div className="container container--booking">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb__list">
              <li className="breadcrumb__item">
                <Link to="/" className="breadcrumb__link">
                  Trang chủ
                </Link>
              </li>
              <li className="breadcrumb__item">
                <span className="breadcrumb__current">Đặt lịch</span>
              </li>
            </ol>
          </nav>

          <div className="booking-stepper" id="bookingSteps">
            <div className="booking-stepper__line" aria-hidden="true" />
            <div className={stepCls(1)}>
              <span className="booking-step__circle">
                <span className="booking-step__num">1</span>
              </span>
              <span className="booking-step__label">
                Thú cưng &amp;
                Dịch vụ
              </span>
            </div>
            <div className={stepCls(2)}>
              <span className="booking-step__circle">
                <span className="booking-step__num">2</span>
              </span>
              <span className="booking-step__label">
                Ngày
                &amp; Giờ
              </span>
            </div>
            <div className={stepCls(3)}>
              <span className="booking-step__circle">
                <span className="booking-step__num">3</span>
              </span>
              <span className="booking-step__label">
                Thông tin
              </span>
            </div>
            <div className={stepCls(4)}>
              <span className="booking-step__circle">
                <span className="booking-step__num">4</span>
              </span>
              <span className="booking-step__label">
                Xác
                nhận
              </span>
            </div>
          </div>

          <form
            className="booking-form"
            id="bookingForm"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              submitBooking()
            }}
          >
            {step === 1 ? (
              <div className="booking-panel active" data-panel="1">
                <div className="booking-panel__head">
                  <h2 className="booking-panel__title">
                    Chọn loại thú cưng và dịch vụ
                  </h2>
                  <p className="booking-panel__desc">
                    Chọn <strong>Chó</strong> hoặc <strong>Mèo</strong> trước,
                    sau đó chọn dịch vụ phù hợp. Cuối cùng chọn thú cưng có sẵn
                    hoặc thêm mới.
                  </p>
                </div>
                <div className="booking-panel__body booking-panel__grid">
                  <div className="form-group form-group--full">
                    <label>
                      Loại thú
                      cưng <span className="required">*</span>
                    </label>
                    <div className="form-radio-group form-radio-group--cards">
                      <label className="form-radio form-radio--card">
                        <input
                          type="radio"
                          name="petType"
                          value="dog"
                          checked={petType === 'dog'}
                          onChange={() => {
                            setPetType('dog')
                            setServiceId('')
                            setPetSelect('')
                            clearErrors(['petType'])
                          }}
                        />
                        <span className="form-radio__content">
                          Chó
                        </span>
                      </label>
                      <label className="form-radio form-radio--card">
                        <input
                          type="radio"
                          name="petType"
                          value="cat"
                          checked={petType === 'cat'}
                          onChange={() => {
                            setPetType('cat')
                            setServiceId('')
                            setPetSelect('')
                            clearErrors(['petType'])
                          }}
                        />
                        <span className="form-radio__content">
                          Mèo
                        </span>
                      </label>
                    </div>
                    <span className="form-error">{err.petType || ''}</span>
                  </div>
                  <div className="form-group form-group--full">
                    <label htmlFor="bookingService">
                      Dịch vụ{' '}
                      <span className="required">*</span>
                    </label>
                    <select
                      id="bookingService"
                      value={serviceId}
                      onChange={(e) => {
                        setServiceId(e.target.value)
                        clearErrors(['service'])
                      }}
                      className={err.service ? 'error' : ''}
                    >
                      <option value="">
                        {petType
                          ? '-- Chọn dịch vụ --'
                          : '-- Chọn Chó hoặc Mèo trước --'}
                      </option>
                      {filteredServices.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.name} — {formatPrice(getServicePrice(s, petType || 'dog'))}
                        </option>
                      ))}
                    </select>
                    <span className="form-error">{err.service || ''}</span>
                  </div>
                  <div className="form-group form-group--full">
                    <label htmlFor="bookingPet">
                      Thú cưng{' '}
                      <span className="required">*</span>
                    </label>
                    <select
                      id="bookingPet"
                      value={petSelect}
                      onChange={(e) => {
                        setPetSelect(e.target.value)
                        clearErrors(['pet'])
                        if (e.target.value !== 'new') {
                          const p = petsForSelect.find(
                            (x) => String(x.id) === e.target.value
                          )
                          if (p) {
                            setPetName(p.name || '')
                            setPetWeight(
                              p.weight_kg != null ? String(p.weight_kg) : ''
                            )
                          }
                        }
                      }}
                      className={err.pet ? 'error' : ''}
                    >
                      <option value="">
                        {!petType
                          ? '-- Chọn loại và dịch vụ trước --'
                          : '-- Chọn thú cưng --'}
                      </option>
                      <option value="new">+ Thêm thú cưng mới</option>
                      {petsForSelect.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name}
                          {p.weight_kg != null ? ` — ${p.weight_kg} kg` : ''}
                        </option>
                      ))}
                    </select>
                    <span className="form-error">{err.pet || ''}</span>
                  </div>
                  {petSelect === 'new' ? (
                    <div
                      className="form-group form-group--full"
                      id="bookingPetManual"
                    >
                      <div className="form-group">
                        <label htmlFor="petName">
                          Tên thú
                          cưng <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="petName"
                          value={petName}
                          onChange={(e) => {
                            setPetName(e.target.value)
                            clearErrors(['petName'])
                          }}
                          className={err.petName ? 'error' : ''}
                          placeholder="VD: Cún, Miu..."
                        />
                        <span className="form-error">{err.petName || ''}</span>
                      </div>
                      <div className="form-group">
                        <label htmlFor="petWeight">
                          Cân
                          nặng (kg) <span className="required">*</span>
                        </label>
                        <input
                          type="number"
                          id="petWeight"
                          min="0.5"
                          max="100"
                          step="0.5"
                          value={petWeight}
                          onChange={(e) => {
                            setPetWeight(e.target.value)
                            clearErrors(['petWeight'])
                          }}
                          className={err.petWeight ? 'error' : ''}
                          placeholder="VD: 5"
                        />
                        <span className="form-hint-inline">
                          Từ 0.5 – 100 kg
                        </span>
                        <span className="form-error">{err.petWeight || ''}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="booking-panel__actions">
                  <button
                    type="button"
                    className="btn-modern btn-modern--primary"
                    onClick={() => validate1() && setStep(2)}
                  >
                    Tiếp theo
                  </button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="booking-panel active" data-panel="2">
                <div className="booking-panel__head">
                  <h2 className="booking-panel__title">Chọn ngày và giờ</h2>
                  <p className="booking-panel__desc">
                    Chọn khung giờ phù hợp. Giờ làm việc: 8:00 – 18:00, mỗi slot
                    30 phút.
                  </p>
                </div>
                <div className="booking-panel__body booking-panel__grid booking-panel__grid--date">
                  <div className="form-group form-group--full">
                    <label htmlFor="bookingShop">
                      Địa chỉ chi nhánh <span className="required">*</span>
                    </label>
                    <select
                      id="bookingShop"
                      value={shopId}
                      onChange={(e) => {
                        setShopId(e.target.value)
                        clearErrors(['shop'])
                      }}
                      className={err.shop ? 'error' : ''}
                    >
                      <option value="">-- Chọn chi nhánh --</option>
                      {shops.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.name}
                          {s.address
                            ? ` — ${s.address.length > 40 ? `${s.address.slice(0, 40)}...` : s.address}`
                            : ''}
                        </option>
                      ))}
                    </select>
                    <span className="form-error">{err.shop || ''}</span>
                  </div>
                  <div className="form-group">
                    <label htmlFor="bookingDate">
                      Ngày{' '}
                      <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="bookingDate"
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
                    <label htmlFor="bookingTimeTrigger">
                      Giờ{' '}
                      <span className="required">*</span>
                    </label>
                    <div
                      className="booking-time-custom"
                      id="bookingTimeWrap"
                      ref={timeWrapRef}
                    >
                      <select
                        id="bookingTime"
                        className={`booking-time-custom__native${err.time ? ' error' : ''}`}
                        tabIndex={-1}
                        aria-hidden="true"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      >
                        <option value="">-- Chọn giờ --</option>
                        {availableSlots.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={`booking-time-custom__trigger${err.time ? ' error' : ''}`}
                        disabled={!date}
                        aria-haspopup="listbox"
                        aria-expanded={timeOpen}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!date) return
                          setTimeOpen((o) => !o)
                        }}
                      >
                        <span id="bookingTimeDisplay">
                          {!date
                            ? 'Chọn ngày trước'
                            : time || '-- Chọn giờ --'}
                        </span>
                        <span className="booking-time-custom__chev" aria-hidden />
                      </button>
                      <div
                        className="booking-time-custom__dropdown"
                        hidden={!timeOpen}
                      >
                        <ul
                          className="booking-time-custom__list"
                          id="bookingTimeListOptions"
                          role="listbox"
                        >
                          {availableSlots.map((t) => (
                            <li key={t}>
                              <button
                                type="button"
                                className="booking-time-custom__opt"
                                role="option"
                                onClick={() => {
                                  setTime(t)
                                  setTimeOpen(false)
                                  setEmployeeName('')
                                  clearErrors(['time'])
                                }}
                              >
                                {t}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <span className="form-error">{err.time || ''}</span>
                  </div>
                  {time ? (
                    <div
                      className="form-group form-group--full"
                      id="employeeGroup"
                      style={{ marginTop: 15 }}
                    >
                      <label htmlFor="bookingEmployee">
                        Chọn chuyên viên (tùy chọn)
                      </label>
                      <select
                        id="bookingEmployee"
                        value={employeeName}
                        onChange={(e) => setEmployeeName(e.target.value)}
                      >
                        <option value="">
                          -- Bất kỳ chuyên viên nào cũng được --
                        </option>
                        {employeeOptions.map((nv) => (
                          <option key={nv.id} value={nv.name}>
                            {nv.name} ({nv.role})
                          </option>
                        ))}
                      </select>
                      <span className="form-hint" style={{ marginTop: 5 }}>
                        Ca làm việc hiện tại:{' '}
                        <strong style={{ color: 'var(--primary-color)' }}>
                          {hourForShift < 13
                            ? 'Sáng (8:00 - 12:00)'
                            : 'Chiều (13:00 - 18:00)'}
                        </strong>
                      </span>
                    </div>
                  ) : null}
                </div>
                <p className="form-hint">
                  Chúng tôi sẽ kiểm tra
                  trùng lịch và gọi xác nhận qua điện thoại.
                </p>
                <div className="booking-panel__actions">
                  <button
                    type="button"
                    className="btn-modern btn-modern--secondary"
                    onClick={() => setStep(1)}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className="btn-modern btn-modern--primary"
                    onClick={() => validate2() && setStep(3)}
                  >
                    Tiếp theo
                  </button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="booking-panel active" data-panel="3">
                <div className="booking-panel__head">
                  <h2 className="booking-panel__title">Thông tin chủ nuôi</h2>
                  <p className="booking-panel__desc">
                    Để chúng tôi liên hệ xác nhận và hỗ trợ đưa đón nếu cần.
                  </p>
                </div>
                <div className="booking-panel__body booking-panel__grid">
                  <div className="form-group">
                    <label htmlFor="ownerName">
                      Họ tên{' '}
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="ownerName"
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
                    <label htmlFor="ownerPhone">
                      Số điện
                      thoại <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      id="ownerPhone"
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
                    <label htmlFor="ownerEmail">
                      Email{' '}
                      <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="ownerEmail"
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
                    <label htmlFor="ownerAddress">
                      Địa chỉ
                    </label>
                    <textarea
                      id="ownerAddress"
                      rows={2}
                      value={ownerAddress}
                      onChange={(e) => setOwnerAddress(e.target.value)}
                    />
                  </div>
                  <div className="form-group form-group--full">
                    <label htmlFor="note">Ghi chú</label>
                    <textarea
                      id="note"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>
                <div className="booking-panel__actions">
                  <button
                    type="button"
                    className="btn-modern btn-modern--secondary"
                    onClick={() => setStep(2)}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className="btn-modern btn-modern--primary"
                    onClick={() => validate3() && setStep(4)}
                  >
                    Tiếp theo
                  </button>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="booking-panel active" data-panel="4">
                <div className="booking-panel__head">
                  <h2 className="booking-panel__title">Xác nhận đặt lịch</h2>
                  <p className="booking-panel__desc">
                    Kiểm tra thông tin và nhấn xác nhận để hoàn tất.
                  </p>
                </div>
                <div className="booking-summary" id="bookingSummary">
                  <div className="booking-summary__block">
                    <div className="booking-summary__block-title">Thú cưng</div>
                    <div className="booking-summary__row">
                      <span className="booking-summary__label">Loại</span>
                      <span className="booking-summary__value">
                        {petType === 'cat' ? 'Mèo' : 'Chó'}
                      </span>
                    </div>
                    <div className="booking-summary__row">
                      <span className="booking-summary__label">Tên</span>
                      <span className="booking-summary__value">
                        {getFormPayload().pet_name}
                      </span>
                    </div>
                    <div className="booking-summary__row">
                      <span className="booking-summary__label">Cân nặng</span>
                      <span className="booking-summary__value">
                        {getFormPayload().pet_weight_kg != null
                          ? `${getFormPayload().pet_weight_kg} kg`
                          : ''}
                      </span>
                    </div>
                  </div>
                  <div className="booking-summary__block">
                    <div className="booking-summary__block-title">Dịch vụ</div>
                    <div className="booking-summary__row">
                      <span className="booking-summary__label">Gói dịch vụ</span>
                      <span className="booking-summary__value">
                        {selectedService?.name}
                      </span>
                    </div>
                  </div>
                  <div className="booking-summary__block">
                    <div className="booking-summary__block-title">Lịch hẹn</div>
                    {shopLabel ? (
                      <div className="booking-summary__row">
                        <span className="booking-summary__label">Chi nhánh</span>
                        <span className="booking-summary__value">
                          {shopLabel}
                        </span>
                      </div>
                    ) : null}
                    <div className="booking-summary__row">
                      <span className="booking-summary__label">Ngày</span>
                      <span className="booking-summary__value">{date}</span>
                    </div>
                    <div className="booking-summary__row">
                      <span className="booking-summary__label">Giờ</span>
                      <span className="booking-summary__value">{time}</span>
                    </div>
                    {employeeName ? (
                      <div className="booking-summary__row">
                        <span className="booking-summary__label">
                          Chuyên viên
                        </span>
                        <span className="booking-summary__value">
                          {employeeName}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="booking-summary__block">
                    <div className="booking-summary__block-title">Liên hệ</div>
                    <div className="booking-summary__row">
                      <span className="booking-summary__label">Họ tên</span>
                      <span className="booking-summary__value">{ownerName}</span>
                    </div>
                    <div className="booking-summary__row">
                      <span className="booking-summary__label">Điện thoại</span>
                      <span className="booking-summary__value">{ownerPhone}</span>
                    </div>
                    <div className="booking-summary__row">
                      <span className="booking-summary__label">Email</span>
                      <span className="booking-summary__value">{ownerEmail}</span>
                    </div>
                    <div className="booking-summary__row">
                      <span className="booking-summary__label">Địa chỉ</span>
                      <span className="booking-summary__value">
                        {ownerAddress}
                      </span>
                    </div>
                    {note ? (
                      <div className="booking-summary__row">
                        <span className="booking-summary__label">Ghi chú</span>
                        <span className="booking-summary__value">{note}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="booking-summary__total-block">
                    <div className="booking-summary__total-row">
                      <span>Tổng thanh toán</span>
                      <span>{formatPrice(servicePrice)}</span>
                    </div>
                  </div>
                </div>
                <div className="booking-panel__actions">
                  <button
                    type="button"
                    className="btn-modern btn-modern--secondary"
                    onClick={() => setStep(3)}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className="btn-modern btn-modern--primary btn-modern--lg"
                    onClick={submitBooking}
                  >
                    Xác nhận đặt lịch
                  </button>
                </div>
              </div>
            ) : null}
          </form>
        </div>
      </section>

      <div
        className={`booking-success-overlay${successId !== null ? ' booking-success-overlay--visible' : ''}`}
        aria-hidden={successId === null ? 'true' : 'false'}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSuccessId(null)
        }}
      >
        <div className="booking-success-modal" role="dialog">
          <div className="booking-success-modal__icon">
            <span className="booking-success-modal__ok">Đã gửi</span>
          </div>
          <h2 className="booking-success-modal__title">Đặt lịch thành công!</h2>
          <p className="booking-success-modal__booking-id">
            Mã lịch đặt: <strong>{successId}</strong>
          </p>
          <p className="booking-success-modal__msg">
            Chúng tôi sẽ liên hệ xác nhận qua số điện thoại của bạn trong thời
            gian sớm nhất.
          </p>
          <div className="booking-success-modal__actions">
            <Link to="/" className="btn btn--primary booking-success-modal__btn">
              Về trang chủ
            </Link>
            <Link
              to="/user"
              className="btn btn--secondary booking-success-modal__btn"
            >
              Xem lịch đặt của tôi
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

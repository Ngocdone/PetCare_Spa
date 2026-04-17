/**
 * Tài khoản khách: hồ sơ, đơn hàng, thú cưng, đổi mật khẩu, avatar (trang trung tâm user).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { formatPrice } from '../utils/format.js'
import { apiUrl } from '../config.js'
import { fetchProducts } from '../api/products.js'
import { createPet, deletePet, fetchMyPets, updatePet } from '../api/pets.js'
import UserAvatar from '../components/UserAvatar.jsx'
import ProductImage from '../components/ProductImage.jsx'
import ProductCard from '../components/ProductCard.jsx'
import {
  clearUserSession,
  fetchWithSessionFallback,
  getCurrentUser,
  setCurrentUser,
  setSessionToken,
} from '../utils/auth.js'
import { getUserProfile, saveUserProfile } from '../utils/userProfile.js'
import { CART_KEY } from '../utils/cartStorage.js'

const PETS_KEY = 'petspa_pets'
const ADDRESSES_KEY = 'petspa_addresses'
const FAVORITES_KEY = 'petspa_favorites'
const ORDERS_KEY = 'petspa_orders'
const BOOKINGS_KEY = 'petspa_bookings'
const HIDDEN_ORDERS_KEY = 'petspa_hidden_orders'
const HIDDEN_BOOKINGS_KEY = 'petspa_hidden_bookings'

const BOOKING_STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

const ORDER_STATUS_LABEL = {
  pending: 'Chờ xử lý',
  awaiting_payment: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

function normalizeOrderStatus(status) {
  const s = String(status || '').trim().toLowerCase()
  if (!s) return 'pending'
  const normalized = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (['pending', 'cho_xu_ly', 'cho_xac_nhan', 'cho_duyet'].includes(normalized)) return 'pending'
  if (['awaiting_payment', 'cho_thanh_toan', 'waiting_payment'].includes(normalized))
    return 'awaiting_payment'
  if (['confirmed', 'da_xac_nhan', 'xac_nhan'].includes(normalized)) return 'confirmed'
  if (['shipping', 'dang_giao', 'dang_van_chuyen'].includes(normalized)) return 'shipping'
  if (['completed', 'hoan_thanh', 'da_hoan_thanh', 'giao_thanh_cong'].includes(normalized))
    return 'completed'
  if (['cancelled', 'da_huy', 'huy'].includes(normalized)) return 'cancelled'
  return s
}

/** Giá một lịch (VND): API trả spaRevenue; local có thể có servicePrice sau khi đặt. */
function bookingAmountVnd(b) {
  const n = Number(
    b.spaRevenue ?? b.spa_revenue_vnd ?? b.total ?? b.servicePrice ?? b.service_price ?? 0
  )
  return Number.isFinite(n) ? Math.round(n) : 0
}

function normalizeBookingStatus(status) {
  const s = String(status || '').trim().toLowerCase()
  if (!s) return 'pending'
  const normalized = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (['pending', 'cho_xac_nhan', 'cho_xu_ly', 'cho_duyet'].includes(normalized))
    return 'pending'
  if (['confirmed', 'da_xac_nhan', 'xac_nhan'].includes(normalized)) return 'confirmed'
  if (['completed', 'hoan_thanh', 'da_hoan_thanh', 'giao_thanh_cong'].includes(normalized))
    return 'completed'
  if (['cancelled', 'da_huy', 'huy'].includes(normalized)) return 'cancelled'
  return s
}

function readJson(key, fallback = []) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return Array.isArray(v) ? v : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

function formatBookingDateTime(date, time) {
  const d = String(date || '').trim()
  const t = String(time || '').trim()
  if (!d) return '—'
  const parts = d.split('-')
  if (parts.length === 3) {
    const outDate = `${parts[2]}/${parts[1]}/${parts[0]}`
    return t ? `${outDate} ${t}` : outDate
  }
  return t ? `${d} ${t}` : d
}

function canCancelBooking(status) {
  const s = normalizeBookingStatus(status)
  return s !== 'cancelled' && s !== 'completed'
}

function canDeleteBooking(status) {
  const s = normalizeBookingStatus(status)
  return s === 'completed' || s === 'cancelled'
}

function formatOrderDateTime(iso) {
  const v = String(iso || '').trim()
  if (!v) return '—'
  const normalized = v.replace('T', ' ')
  const [date = '', time = ''] = normalized.split(' ')
  const parts = date.split('-')
  if (parts.length === 3) {
    const d = `${parts[2]}/${parts[1]}/${parts[0]}`
    return time ? `${d} ${time.slice(0, 5)}` : d
  }
  return normalized
}

function orderItemCount(order) {
  if (!Array.isArray(order?.items)) return 0
  return order.items.reduce((s, it) => s + (Number(it.quantity) || 1), 0)
}

function orderPreviewImage(order) {
  if (!Array.isArray(order?.items)) return ''
  const first = order.items.find((it) => String(it.image || '').trim())
  return first?.image || ''
}

/** Mã sản phẩm dòng đầu (để mở trang SP / đánh giá từ đơn hoàn thành) */
function firstOrderLineProductId(order) {
  if (!Array.isArray(order?.items) || !order.items.length) return ''
  const it = order.items[0]
  const raw = it?.id ?? it?.product_id ?? it?.productId ?? it?.ma_san_pham
  if (raw == null || String(raw).trim() === '') return ''
  return String(raw).trim()
}

/** Tên sản phẩm đại diện của đơn (ưu tiên dòng đầu) */
function firstOrderLineProductName(order) {
  if (!Array.isArray(order?.items) || !order.items.length) return ''
  const it = order.items[0]
  const raw =
    it?.name ??
    it?.product_name ??
    it?.productName ??
    it?.ten_san_pham ??
    it?.title
  return raw == null ? '' : String(raw).trim()
}

function canDeleteOrder(status) {
  const s = String(status || '').toLowerCase()
  return s === 'completed' || s === 'cancelled'
}

function orderIdKeys(orderId) {
  const rawId = String(orderId ?? '').trim()
  const numId = rawId.replace(/\D/g, '')
  return [rawId, numId].filter(Boolean)
}

/** Đơn mới nhất lên đầu (ưu tiên createdAt, fallback id số). */
function sortOrdersNewestFirst(list) {
  return [...(Array.isArray(list) ? list : [])].sort((a, b) => {
    const ta = new Date(a?.createdAt || a?.created_at || 0).getTime()
    const tb = new Date(b?.createdAt || b?.created_at || 0).getTime()
    if (Number.isFinite(tb - ta) && tb !== ta) return tb - ta
    const ida = Number(String(a?.id ?? '').replace(/\D/g, '')) || 0
    const idb = Number(String(b?.id ?? '').replace(/\D/g, '')) || 0
    return idb - ida
  })
}

const VALID_TABS = new Set([
  'overview',
  'profile',
  'pets',
  'bookings',
  'orders',
  'favorites',
  'addresses',
  'password',
])

const ACCOUNT_NAV_ITEMS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'profile', label: 'Hồ sơ cá nhân' },
  { id: 'pets', label: 'Thú cưng của tôi' },
  { id: 'bookings', label: 'Lịch hẹn Spa' },
  { id: 'orders', label: 'Đơn hàng' },
  { id: 'favorites', label: 'Yêu thích' },
  { id: 'addresses', label: 'Địa chỉ' },
  { id: 'password', label: 'Đổi mật khẩu' },
]

const TIER_LABEL = {
  bronze: 'Đồng',
  silver: 'Bạc',
  gold: 'Vàng',
  platinum: 'Bạch kim',
}

function tierDisplayLabel(tier) {
  const t = String(tier || 'bronze').toLowerCase().trim()
  return TIER_LABEL[t] || (tier ? String(tier) : 'Đồng')
}

function AccountNavIcon({ id }) {
  const svg = {
    className: 'user-nav__icon-svg',
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  }
  const sw = { stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (id) {
    case 'overview':
      return (
        <svg {...svg}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...sw} />
          <path d="M9 22V12h6v10" {...sw} />
        </svg>
      )
    case 'profile':
      return (
        <svg {...svg}>
          <circle cx="12" cy="8" r="4" {...sw} />
          <path d="M4 22v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2" {...sw} />
        </svg>
      )
    case 'pets':
      return (
        <svg {...svg}>
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
            {...sw}
          />
        </svg>
      )
    case 'bookings':
      return (
        <svg {...svg}>
          <rect x="3" y="4" width="18" height="18" rx="2" {...sw} />
          <path d="M16 2v4M8 2v4M3 10h18" {...sw} />
        </svg>
      )
    case 'orders':
      return (
        <svg {...svg}>
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" {...sw} />
          <path d="M3 6h18" {...sw} />
          <path d="M16 10a4 4 0 0 1-8 0" {...sw} />
        </svg>
      )
    case 'favorites':
      return (
        <svg {...svg}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" {...sw} />
        </svg>
      )
    case 'addresses':
      return (
        <svg {...svg}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" {...sw} />
          <circle cx="12" cy="10" r="3" {...sw} />
        </svg>
      )
    case 'password':
      return (
        <svg {...svg}>
          <rect x="5" y="11" width="14" height="10" rx="2" {...sw} />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" {...sw} />
        </svg>
      )
    default:
      return null
  }
}

function OverviewStatIcon({ variant }) {
  const svg = {
    className: 'user-stat-card__icon-svg',
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  }
  const sw = { stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (variant) {
    case 'pets':
      return (
        <svg {...svg}>
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
            {...sw}
          />
        </svg>
      )
    case 'bookings':
      return (
        <svg {...svg}>
          <rect x="3" y="4" width="18" height="18" rx="2" {...sw} />
          <path d="M16 2v4M8 2v4M3 10h18" {...sw} />
        </svg>
      )
    case 'orders':
      return (
        <svg {...svg}>
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" {...sw} />
          <path d="M3 6h18" {...sw} />
        </svg>
      )
    case 'tier':
      return (
        <svg {...svg}>
          <path d="M12 2l2.4 7.4h7.8l-6.3 4.6 2.4 7.4L12 17.8 5.7 21.4l2.4-7.4L1.8 9.4h7.8L12 2z" {...sw} />
        </svg>
      )
    case 'spending':
      return (
        <svg {...svg}>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" {...sw} />
        </svg>
      )
    default:
      return null
  }
}

export default function User() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') || 'overview'
  const tab = VALID_TABS.has(tabParam) ? tabParam : 'overview'
  function selectTab(id) {
    setSearchParams({ tab: id }, { replace: true })
  }
  const [userTick, setUserTick] = useState(0)
  const [serverOrders, setServerOrders] = useState([])
  const [serverBookings, setServerBookings] = useState([])

  useEffect(() => {
    const sync = () => setUserTick((n) => n + 1)
    window.addEventListener('petspa-user-updated', sync)
    return () => window.removeEventListener('petspa-user-updated', sync)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadServerOrders() {
      try {
        const res = await fetch(apiUrl('/api/admin/data'))
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        setServerOrders(Array.isArray(data?.orders) ? data.orders : [])
        setServerBookings(Array.isArray(data?.appointments) ? data.appointments : [])
      } catch {
        /* ignore: fallback localStorage when API unavailable */
      }
    }
    loadServerOrders()
    const t = window.setInterval(loadServerOrders, 15000)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [])

  const user = getCurrentUser()
  const profile = getUserProfile()
  const [pName, setPName] = useState(profile.name || user?.name || '')
  const [pPhone, setPPhone] = useState(profile.phone || user?.phone || '')
  const [pAvatar, setPAvatar] = useState(
    () => (profile.avatar || user?.avatar || '').trim()
  )
  const [pDob, setPDob] = useState(profile.dob || '')
  const [pAddress, setPAddress] = useState(
    profile.address || user?.address || ''
  )
  const [pGender, setPGender] = useState(profile.gender || '')
  const [avatarFileName, setAvatarFileName] = useState('')
  const avatarInputRef = useRef(null)
  const [avatarUploadFile, setAvatarUploadFile] = useState(null)
  const avatarPreviewRef = useRef('')
  const [orderDetail, setOrderDetail] = useState(null)
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [selectedBookingIds, setSelectedBookingIds] = useState([])
  const [addrLabel, setAddrLabel] = useState('')
  const [addrLine, setAddrLine] = useState('')
  const [addrPhone, setAddrPhone] = useState('')
  const [catalogProducts, setCatalogProducts] = useState([])
  const [pwdErr, setPwdErr] = useState('')
  const [pwdOk, setPwdOk] = useState('')
  const [pwdSubmitting, setPwdSubmitting] = useState(false)

  const [myPetsServer, setMyPetsServer] = useState([])
  const [petsLoading, setPetsLoading] = useState(false)
  const [petsErr, setPetsErr] = useState('')
  const [petFormOpen, setPetFormOpen] = useState(false)
  const [petSaving, setPetSaving] = useState(false)
  const [petForm, setPetForm] = useState({
    id: null,
    name: '',
    pet_type: 'dog',
    weight_kg: '',
  })

  const reloadMyPets = useCallback(async () => {
    if (!user?.id) {
      setMyPetsServer([])
      return
    }
    setPetsLoading(true)
    setPetsErr('')
    try {
      const data = await fetchMyPets()
      if (data.success) setMyPetsServer(data.pets || [])
      else {
        setMyPetsServer([])
        if (data.error) setPetsErr(data.error)
      }
    } catch {
      setPetsErr('Không tải được danh sách thú cưng.')
      setMyPetsServer([])
    } finally {
      setPetsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setMyPetsServer([])
      return
    }
    if (tab !== 'pets' && tab !== 'overview') return
    reloadMyPets()
  }, [reloadMyPets, tab, user?.id])

  useEffect(() => {
    if (tab !== 'profile') return
    const u = getCurrentUser()
    if (u && Object.prototype.hasOwnProperty.call(u, 'address')) {
      setPAddress(u.address != null ? String(u.address).trim() : '')
    }
  }, [userTick, tab])

  useEffect(() => {
    fetchProducts().then(setCatalogProducts).catch(() => setCatalogProducts([]))
  }, [])

  useEffect(() => {
    if (tab !== 'password') {
      setPwdErr('')
      setPwdOk('')
    }
  }, [tab])

  useEffect(() => {
    return () => {
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current)
        avatarPreviewRef.current = ''
      }
    }
  }, [])

  const localPets = readJson(PETS_KEY)
  const pets = user?.id ? myPetsServer : localPets
  const bookings = readJson(BOOKINGS_KEY)
  const orders = readJson(ORDERS_KEY)
  const favorites = readJson(FAVORITES_KEY)
  const addresses = readJson(ADDRESSES_KEY)

  const userEmail = (user?.email || '').toLowerCase()
  const hiddenOrderIds = readJson(HIDDEN_ORDERS_KEY)
  const hiddenBookingIds = readJson(HIDDEN_BOOKINGS_KEY)
  const hiddenOrderKeys = useMemo(() => {
    const set = new Set()
    hiddenOrderIds.forEach((id) => {
      orderIdKeys(id).forEach((k) => set.add(k))
    })
    return set
  }, [hiddenOrderIds])
  const hiddenBookingKeys = useMemo(() => {
    const set = new Set()
    hiddenBookingIds.forEach((id) => {
      orderIdKeys(id).forEach((k) => set.add(k))
    })
    return set
  }, [hiddenBookingIds])
  const myOrders = useMemo(() => {
    if (!user) return []
    const localOrders = orders
      .filter((o) => !userEmail || (o.email || '').toLowerCase() === userEmail)
      .filter((o) => !orderIdKeys(o.id).some((k) => hiddenOrderKeys.has(k)))
      .map((o) => ({
        ...o,
        status: normalizeOrderStatus(o.status ?? o.trang_thai ?? o.status_db ?? o.order_status),
      }))

    const remoteOrders = serverOrders
      .filter((o) => !userEmail || (o.email || '').toLowerCase() === userEmail)
      .filter((o) => !orderIdKeys(o.id).some((k) => hiddenOrderKeys.has(k)))
      .map((o) => ({
        ...o,
        status: normalizeOrderStatus(o.status ?? o.trang_thai ?? o.status_db ?? o.order_status),
      }))

    if (!remoteOrders.length) return sortOrdersNewestFirst(localOrders)

    const byRemoteKey = new Map()
    remoteOrders.forEach((o) => {
      const rawId = String(o.id ?? '')
      const numId = rawId.replace(/\D/g, '')
      if (rawId) byRemoteKey.set(rawId, o)
      if (numId) byRemoteKey.set(numId, o)
    })

    const mergedLocal = localOrders.map((o) => {
      const rawId = String(o.id ?? '')
      const numId = rawId.replace(/\D/g, '')
      const remote = byRemoteKey.get(rawId) || byRemoteKey.get(numId)
      return remote ? { ...o, ...remote, status: remote.status } : o
    })

    const localKeys = new Set(
      mergedLocal.flatMap((o) => {
        const rawId = String(o.id ?? '')
        const numId = rawId.replace(/\D/g, '')
        return [rawId, numId].filter(Boolean)
      })
    )
    const remoteOnly = remoteOrders.filter((o) => {
      const rawId = String(o.id ?? '')
      const numId = rawId.replace(/\D/g, '')
      return !localKeys.has(rawId) && !localKeys.has(numId)
    })

    return sortOrdersNewestFirst([...mergedLocal, ...remoteOnly])
  }, [orders, serverOrders, userEmail, user, hiddenOrderKeys])

  const myBookings = useMemo(() => {
    if (!user) return []
    const localList = bookings
      .filter(
        (b) =>
          !userEmail ||
          (b.ownerEmail || b.owner_email || '').toLowerCase() === userEmail
      )
      .filter((b) => !orderIdKeys(b.id).some((k) => hiddenBookingKeys.has(k)))
      .map((b) => ({
        ...b,
        status: normalizeBookingStatus(b.status ?? b.trang_thai ?? b.status_raw),
      }))

    const remoteList = serverBookings
      .filter(
        (b) =>
          !userEmail ||
          (b.ownerEmail || b.owner_email || '').toLowerCase() === userEmail
      )
      .filter((b) => !orderIdKeys(b.id).some((k) => hiddenBookingKeys.has(k)))
      .map((b) => {
        const owner = (b.ownerEmail || b.owner_email || '').trim()
        return {
          ...b,
          petName: b.petName ?? b.pet_name ?? '',
          serviceName: b.serviceName ?? b.service_name ?? b.service_id ?? '',
          ownerEmail: owner,
          status: normalizeBookingStatus(b.status ?? b.trang_thai ?? b.status_raw),
        }
      })

    if (!remoteList.length) return localList

    const byRemoteKey = new Map()
    remoteList.forEach((b) => {
      const rawId = String(b.id ?? '')
      const numId = rawId.replace(/\D/g, '')
      if (rawId) byRemoteKey.set(rawId, b)
      if (numId) byRemoteKey.set(numId, b)
    })

    const mergedLocal = localList.map((b) => {
      const rawId = String(b.id ?? '')
      const numId = rawId.replace(/\D/g, '')
      const remote = byRemoteKey.get(rawId) || byRemoteKey.get(numId)
      if (!remote) return b
      return {
        ...b,
        ...remote,
        petName: remote.petName || remote.pet_name || b.petName,
        serviceName: remote.serviceName || remote.service_name || b.serviceName,
        ownerEmail: remote.ownerEmail || remote.owner_email || b.ownerEmail,
        status: remote.status,
      }
    })

    const localKeys = new Set(
      mergedLocal.flatMap((b) => {
        const rawId = String(b.id ?? '')
        const numId = rawId.replace(/\D/g, '')
        return [rawId, numId].filter(Boolean)
      })
    )
    const remoteOnly = remoteList.filter((b) => {
      const rawId = String(b.id ?? '')
      const numId = rawId.replace(/\D/g, '')
      return !localKeys.has(rawId) && !localKeys.has(numId)
    })

    return [...mergedLocal, ...remoteOnly]
  }, [bookings, serverBookings, userEmail, user, hiddenBookingKeys])

  const { favoriteProducts, favoriteOrphanIds } = useMemo(() => {
    if (!user || !favorites.length) return { favoriteProducts: [], favoriteOrphanIds: [] }
    const byId = new Map(catalogProducts.map((p) => [String(p.id), p]))
    const ordered = []
    const orphan = []
    favorites.forEach((id) => {
      const p = byId.get(String(id))
      if (p) ordered.push(p)
      else orphan.push(id)
    })
    return { favoriteProducts: ordered, favoriteOrphanIds: orphan }
  }, [favorites, catalogProducts, user])

  const userTotalSpendingVnd = useMemo(() => {
    const ordersSum = myOrders
      .filter((o) => normalizeOrderStatus(o.status) === 'completed')
      .reduce((s, o) => s + Number(o.total || 0), 0)
    const bookingsSum = myBookings
      .filter((b) => normalizeBookingStatus(b.status) === 'completed')
      .reduce((s, b) => s + bookingAmountVnd(b), 0)
    return ordersSum + bookingsSum
  }, [myOrders, myBookings])

  const bookingsCanCancel = myBookings.filter((b) => canCancelBooking(b.status)).length

  /* Đồng bộ checkbox xóa đơn với đơn đủ điều kiện xóa */
  useEffect(() => {
    const validIds = new Set(
      myOrders
        .filter((o) => canDeleteOrder(o.status))
        .map((o) => String(o.id || ''))
    )
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cần cập nhật selection khi myOrders đổi
    setSelectedOrderIds((prev) => {
      const next = prev.filter((id) => validIds.has(String(id)))
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) {
        return prev
      }
      return next
    })
  }, [myOrders])

  useEffect(() => {
    const validIds = new Set(
      myBookings
        .filter((b) => canDeleteBooking(b.status))
        .map((b) => String(b.id || ''))
    )
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cần cập nhật selection khi myBookings đổi
    setSelectedBookingIds((prev) => {
      const next = prev.filter((id) => validIds.has(String(id)))
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) {
        return prev
      }
      return next
    })
  }, [myBookings])

  function viewBookingDetail(b) {
    const lines = [
      `Mã lịch: ${b.id || '—'}`,
      `Thú cưng: ${b.petName || '—'}`,
      `Dịch vụ: ${b.serviceName || '—'}`,
      `Ngày giờ: ${formatBookingDateTime(b.date, b.time)}`,
      `Trạng thái: ${
        BOOKING_STATUS_LABEL[b.status] || b.status || BOOKING_STATUS_LABEL.pending
      }`,
      `Ghi chú: ${b.note || '—'}`,
    ]
    window.alert(lines.join('\n'))
  }

  async function cancelBooking(b) {
    if (!canCancelBooking(b.status)) return
    const ok = window.confirm('Bạn có chắc muốn hủy lịch hẹn này không?')
    if (!ok) return
    const bookingId = parseInt(String(b.id || ''), 10)
    if (Number.isFinite(bookingId) && bookingId > 0) {
      try {
        const res = await fetch(apiUrl(`/api/admin/appointments/${bookingId}/status`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || data?.success === false) {
          window.alert(data?.error || 'Không thể hủy lịch hẹn trên máy chủ.')
          return
        }
        setServerBookings((prev) =>
          (Array.isArray(prev) ? prev : []).map((x) =>
            String(x.id || '') === String(bookingId) ? { ...x, status: 'cancelled' } : x
          )
        )
      } catch {
        window.alert('Không kết nối được máy chủ để hủy lịch.')
        return
      }
    }
    const list = readJson(BOOKINGS_KEY)
    const next = list.map((x) => {
      const sameId = String(x.id ?? '') === String(b.id ?? '')
      const sameTime =
        String(x.date || '') === String(b.date || '') &&
        String(x.time || '') === String(b.time || '') &&
        String(x.ownerEmail || '').toLowerCase() ===
          String(b.ownerEmail || '').toLowerCase()
      if (sameId || sameTime) return { ...x, status: 'cancelled' }
      return x
    })
    writeJson(BOOKINGS_KEY, next)
    setUserTick((n) => n + 1)
    window.alert('Đã hủy lịch hẹn.')
  }

  function deleteAllBookings() {
    const removable = myBookings.filter((b) => canDeleteBooking(b.status))
    if (!removable.length) {
      window.alert('Chỉ xóa được lịch đã hoàn thành hoặc đã hủy.')
      return
    }
    const ok = window.confirm(
      `Xóa ${removable.length} lịch (hoàn thành / đã hủy) khỏi danh sách hiển thị?`
    )
    if (!ok) return
    const removeKeys = new Set()
    removable.forEach((b) => {
      orderIdKeys(b.id).forEach((k) => removeKeys.add(k))
    })
    const list = readJson(BOOKINGS_KEY)
    const next = list.filter((x) => !orderIdKeys(x.id).some((k) => removeKeys.has(k)))
    writeJson(BOOKINGS_KEY, next)
    const hiddenSet = new Set(readJson(HIDDEN_BOOKINGS_KEY).map((x) => String(x)))
    removable.forEach((b) => {
      const id = String(b.id || '')
      if (id) hiddenSet.add(id)
    })
    writeJson(HIDDEN_BOOKINGS_KEY, Array.from(hiddenSet))
    setSelectedBookingIds([])
    setUserTick((n) => n + 1)
    window.alert('Đã xóa các lịch đã chọn khỏi danh sách.')
  }

  function toggleBookingSelected(bookingId) {
    const id = String(bookingId || '')
    if (!id) return
    const target = myBookings.find((b) => String(b.id || '') === id)
    if (!target || !canDeleteBooking(target.status)) return
    setSelectedBookingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function deleteSelectedBookings() {
    if (!selectedBookingIds.length) return
    const deletableIds = selectedBookingIds.filter((selId) => {
      const b = myBookings.find((x) => String(x.id || '') === String(selId))
      return b && canDeleteBooking(b.status)
    })
    if (!deletableIds.length) {
      window.alert('Chỉ xóa được lịch đã hoàn thành hoặc đã hủy.')
      return
    }
    const ok = window.confirm(
      `Bạn có chắc muốn xóa ${deletableIds.length} lịch hẹn đã chọn?`
    )
    if (!ok) return
    const setIds = new Set()
    deletableIds.forEach((x) => {
      orderIdKeys(x).forEach((k) => setIds.add(k))
    })
    const list = readJson(BOOKINGS_KEY)
    const next = list.filter((x) => !orderIdKeys(x.id).some((k) => setIds.has(k)))
    writeJson(BOOKINGS_KEY, next)
    const hiddenSet = new Set(readJson(HIDDEN_BOOKINGS_KEY).map((x) => String(x)))
    deletableIds.forEach((id) => hiddenSet.add(String(id)))
    writeJson(HIDDEN_BOOKINGS_KEY, Array.from(hiddenSet))
    setSelectedBookingIds([])
    setUserTick((n) => n + 1)
    window.alert('Đã xóa lịch hẹn đã chọn.')
  }

  function viewOrderDetail(o) {
    setOrderDetail(o)
  }

  function toggleOrderSelected(orderId) {
    const id = String(orderId || '')
    if (!id) return
    const target = myOrders.find((o) => String(o.id || '') === id)
    if (!target || !canDeleteOrder(target.status)) return
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function deleteSelectedOrders() {
    if (!selectedOrderIds.length) return
    const ok = window.confirm(
      `Bạn có chắc muốn xóa ${selectedOrderIds.length} đơn hàng đã chọn?`
    )
    if (!ok) return
    const setIds = new Set()
    selectedOrderIds.forEach((x) => {
      orderIdKeys(x).forEach((k) => setIds.add(k))
    })
    const list = readJson(ORDERS_KEY)
    const next = list.filter((x) => !orderIdKeys(x.id).some((k) => setIds.has(k)))
    writeJson(ORDERS_KEY, next)
    const hidden = readJson(HIDDEN_ORDERS_KEY)
    const hiddenSet = new Set(hidden.map((x) => String(x)))
    selectedOrderIds.forEach((id) => hiddenSet.add(String(id)))
    writeJson(HIDDEN_ORDERS_KEY, Array.from(hiddenSet))
    if (orderDetail && orderIdKeys(orderDetail.id).some((k) => setIds.has(k))) {
      setOrderDetail(null)
    }
    setSelectedOrderIds([])
    setUserTick((n) => n + 1)
    window.alert('Đã xóa đơn hàng đã chọn.')
  }

  function canCancelOrder(status) {
    const s = String(status || '').toLowerCase()
    return s === 'pending' || s === 'confirmed'
  }

  function toggleFavoriteProduct(productId) {
    const pid = String(productId || '').trim()
    if (!pid) return
    const list = readJson(FAVORITES_KEY)
    const exists = list.some((id) => String(id) === pid)
    const next = exists ? list.filter((id) => String(id) !== pid) : [...list, pid]
    writeJson(FAVORITES_KEY, next)
    setUserTick((n) => n + 1)
    window.alert(exists ? 'Đã bỏ khỏi sản phẩm yêu thích.' : 'Đã thêm vào sản phẩm yêu thích.')
  }

  function removeFavoriteProduct(productId) {
    const pid = String(productId || '').trim()
    if (!pid) return
    const list = readJson(FAVORITES_KEY)
    const next = list.filter((id) => String(id) !== pid)
    writeJson(FAVORITES_KEY, next)
    setUserTick((n) => n + 1)
    window.alert('Đã hủy yêu thích sản phẩm.')
  }

  function cancelOrder(o) {
    if (!canCancelOrder(o.status)) return
    const ok = window.confirm('Bạn có chắc muốn hủy đơn hàng này không?')
    if (!ok) return
    const list = readJson(ORDERS_KEY)
    const next = list.map((x) =>
      String(x.id || '') === String(o.id || '') ? { ...x, status: 'cancelled' } : x
    )
    writeJson(ORDERS_KEY, next)
    setOrderDetail((prev) =>
      prev && String(prev.id || '') === String(o.id || '')
        ? { ...prev, status: 'cancelled' }
        : prev
    )
    setUserTick((n) => n + 1)
    window.alert('Đã hủy đơn hàng.')
  }

  function normalizeAddressRow(raw, index) {
    if (typeof raw === 'string') {
      return { id: `legacy_${index}`, label: 'Địa chỉ', address: raw, phone: '' }
    }
    return {
      id: raw.id != null ? String(raw.id) : `idx_${index}`,
      label: String(raw.label || 'Địa chỉ').trim() || 'Địa chỉ',
      address: String(raw.address || raw.line || '').trim(),
      phone: String(raw.phone || '').trim(),
    }
  }

  function addSavedAddress(e) {
    e.preventDefault()
    const line = String(addrLine || '').trim()
    if (!line) {
      window.alert('Vui lòng nhập địa chỉ giao hàng.')
      return
    }
    const list = readJson(ADDRESSES_KEY)
    const label = String(addrLabel || '').trim() || 'Địa chỉ'
    const fallbackPhone = String(pPhone || user?.phone || '').trim()
    const phone = String(addrPhone || '').trim() || fallbackPhone
    list.push({
      id: `addr_${Date.now()}`,
      label,
      address: line,
      ...(phone ? { phone } : {}),
    })
    writeJson(ADDRESSES_KEY, list)
    setAddrLabel('')
    setAddrLine('')
    setAddrPhone('')
    setUserTick((n) => n + 1)
  }

  function removeSavedAddress(index) {
    const list = readJson(ADDRESSES_KEY)
    if (index < 0 || index >= list.length) return
    if (!window.confirm('Xóa địa chỉ này khỏi danh sách đã lưu?')) return
    list.splice(index, 1)
    writeJson(ADDRESSES_KEY, list)
    setUserTick((n) => n + 1)
  }

  function importProfileAddress() {
    const line = String(pAddress || '').trim()
    if (!line) return
    const list = readJson(ADDRESSES_KEY)
    const dup = list.some((x) => {
      const a = typeof x === 'string' ? x : String(x.address || x.line || '').trim()
      return a === line
    })
    if (dup) {
      window.alert('Địa chỉ trong hồ sơ đã có trong danh sách.')
      return
    }
    const phone = String(pPhone || '').trim()
    list.push({
      id: `addr_${Date.now()}`,
      label: 'Địa chỉ từ hồ sơ',
      address: line,
      ...(phone ? { phone } : {}),
    })
    writeJson(ADDRESSES_KEY, list)
    setUserTick((n) => n + 1)
    window.alert('Đã thêm địa chỉ từ hồ sơ.')
  }

  async function saveProfile(e) {
    e.preventDefault()
    let avatarFinal = (pAvatar || '').trim()
    if (avatarUploadFile) {
      const fd = new FormData()
      fd.append('image', avatarUploadFile)
      fd.append('user_id', String(user?.id || ''))
      fd.append('user_email', String(user?.email || ''))
      try {
        const res = await fetchWithSessionFallback(apiUrl('/api/profile/avatar-upload'), {
          method: 'POST',
          body: fd,
        })
        const data = await res.json().catch(() => ({}))
        if (!data.success) {
          window.alert(data.error || 'Không thể tải ảnh đại diện.')
          return
        }
        avatarFinal = String(data.path || data.user?.avatar || '').trim() || avatarFinal
        setAvatarUploadFile(null)
        setAvatarFileName('')
      } catch {
        window.alert('Không thể tải ảnh đại diện.')
        return
      }
    }

    let nameForStorage = pName.trim()
    let phoneForStorage = String(pPhone || '').trim()
    let addressForStorage = String(pAddress || '').trim()

    if (user?.id) {
      try {
        const res = await fetchWithSessionFallback(apiUrl('/api/profile'), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: nameForStorage,
            phone: phoneForStorage,
            address: addressForStorage,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!data.success) {
          window.alert(data.error || 'Không lưu được họ tên / SĐT / địa chỉ lên máy chủ.')
          return
        }
        if (data.user) {
          nameForStorage = String(data.user.name || nameForStorage).trim()
          phoneForStorage = String(data.user.phone ?? phoneForStorage).trim()
          addressForStorage =
            data.user.address != null ? String(data.user.address).trim() : addressForStorage
        }
      } catch {
        window.alert('Không kết nối được máy chủ. Kiểm tra backend và thử lại.')
        return
      }
    }

    saveUserProfile({
      ...getUserProfile(),
      name: nameForStorage,
      phone: phoneForStorage,
      avatar: avatarFinal,
      dob: pDob,
      address: addressForStorage,
      gender: pGender,
    })
    setCurrentUser({
      ...user,
      name: nameForStorage,
      email: user.email,
      phone: phoneForStorage || user?.phone || '',
      address: addressForStorage,
      role: user.role,
      tier: user.tier,
      avatar: avatarFinal || (user.avatar != null ? String(user.avatar).trim() : '') || '',
    })
    setPAvatar(avatarFinal)
    window.dispatchEvent(new CustomEvent('petspa-user-updated'))
    window.alert('Đã lưu hồ sơ.')
  }

  function onAvatarFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!/^image\//i.test(file.type)) {
      window.alert('Vui lòng chọn file ảnh hợp lệ.')
      e.target.value = ''
      return
    }
    if (avatarPreviewRef.current) {
      URL.revokeObjectURL(avatarPreviewRef.current)
      avatarPreviewRef.current = ''
    }
    const previewUrl = URL.createObjectURL(file)
    avatarPreviewRef.current = previewUrl
    setPAvatar(previewUrl)
    setAvatarUploadFile(file)
    setAvatarFileName(file.name)
    e.target.value = ''
  }

  function logout() {
    clearUserSession()
    try {
      localStorage.setItem(CART_KEY, JSON.stringify([]))
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('petspa-cart-updated'))
    window.location.href = '/'
  }

  async function submitChangePassword(e) {
    e.preventDefault()
    setPwdErr('')
    setPwdOk('')
    const fd = new FormData(e.currentTarget)
    const currentPassword = String(fd.get('currentPassword') || '')
    const newPassword = String(fd.get('newPassword') || '')
    const newPasswordConfirm = String(fd.get('newPasswordConfirm') || '')
    if (!currentPassword) {
      setPwdErr('Vui lòng nhập mật khẩu hiện tại.')
      return
    }
    if (newPassword.length < 6) {
      setPwdErr('Mật khẩu mới ít nhất 6 ký tự.')
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setPwdErr('Xác nhận mật khẩu không khớp.')
      return
    }
    setPwdSubmitting(true)
    try {
      const res = await fetchWithSessionFallback(apiUrl('/api/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword, newPasswordConfirm }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.success && data.token) {
        setSessionToken(data.token)
        e.currentTarget.reset()
        setPwdOk('Đã đổi mật khẩu.')
      } else {
        setPwdErr(data.error || 'Không đổi được mật khẩu.')
      }
    } catch {
      setPwdErr('Không kết nối được máy chủ. Kiểm tra backend đang chạy.')
    } finally {
      setPwdSubmitting(false)
    }
  }

  function openPetFormForAdd() {
    setPetForm({ id: null, name: '', pet_type: 'dog', weight_kg: '' })
    setPetFormOpen(true)
  }

  function openPetFormForEdit(p) {
    setPetForm({
      id: p.id,
      name: String(p.name || ''),
      pet_type: String(p.pet_type || 'dog').toLowerCase() === 'cat' ? 'cat' : 'dog',
      weight_kg: p.weight_kg != null && p.weight_kg !== '' ? String(p.weight_kg) : '',
    })
    setPetFormOpen(true)
  }

  async function handlePetFormSubmit(e) {
    e.preventDefault()
    if (!user?.id) return
    const name = String(petForm.name || '').trim()
    if (!name) {
      window.alert('Vui lòng nhập tên thú cưng.')
      return
    }
    const pet_type = petForm.pet_type === 'cat' ? 'cat' : 'dog'
    const weightRaw = String(petForm.weight_kg || '').trim()
    const weight_kg = weightRaw === '' ? null : Number(weightRaw)
    if (weightRaw !== '' && !Number.isFinite(weight_kg)) {
      window.alert('Cân nặng không hợp lệ.')
      return
    }
    setPetSaving(true)
    try {
      let data
      if (petForm.id) {
        data = await updatePet(petForm.id, { name, pet_type, weight_kg })
      } else {
        data = await createPet({ name, pet_type, weight_kg })
      }
      if (data.success) {
        setPetFormOpen(false)
        await reloadMyPets()
        window.dispatchEvent(new CustomEvent('petspa-user-updated'))
      } else {
        window.alert(data.error || 'Không lưu được.')
      }
    } catch {
      window.alert('Lỗi kết nối máy chủ.')
    } finally {
      setPetSaving(false)
    }
  }

  async function handleDeletePet(petId) {
    if (!user?.id) return
    if (!window.confirm('Xóa hồ sơ thú cưng này?')) return
    setPetSaving(true)
    try {
      const data = await deletePet(petId)
      if (data.success) {
        await reloadMyPets()
        window.dispatchEvent(new CustomEvent('petspa-user-updated'))
      } else {
        window.alert(data.error || 'Không xóa được.')
      }
    } catch {
      window.alert('Lỗi kết nối máy chủ.')
    } finally {
      setPetSaving(false)
    }
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <main className="user-main user-page">
      <div className="user-page__ambient" aria-hidden="true" />
      <aside className="user-sidebar" id="userSidebar">
        <div className="user-sidebar__header">
          <UserAvatar
            id="userAvatar"
            user={{
              ...user,
              name: pName || user.name,
              avatar:
                (user.avatar || pAvatar || profile.avatar || '').trim() || '',
            }}
            size={72}
            className="user-sidebar__avatar"
            alt=""
          />
          <div className="user-sidebar__header-text">
            <h2 className="user-sidebar__name" id="userName">
              {pName || user.name || 'Người dùng'}
            </h2>
            <p className="user-sidebar__email" id="userEmail">
              {user.email}
            </p>
            <span className="user-sidebar__tier-badge">{tierDisplayLabel(user.tier)}</span>
          </div>
        </div>
        <nav className="user-sidebar__nav">
          {ACCOUNT_NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`user-nav__item${tab === id ? ' active' : ''}`}
              data-tab={id}
              onClick={() => selectTab(id)}
            >
              <AccountNavIcon id={id} />
              <span className="user-nav__item-label">{label}</span>
            </button>
          ))}
          <Link
            to="#"
            className="user-nav__item user-nav__logout"
            id="btnLogout"
            onClick={(e) => {
              e.preventDefault()
              logout()
            }}
          >
            <span>Đăng xuất</span>
          </Link>
        </nav>
      </aside>

      <div className="user-content">
        <div className="user-content__inner">
        {tab === 'overview' ? (
          <section className="user-panel user-panel--surface active" data-panel="overview">
            <div className="user-overview-hero">
              <p className="user-overview-hero__eyebrow">Tài khoản của bạn</p>
              <h1 className="user-overview-hero__title">
                Xin chào, {pName || user.name || 'bạn'}
              </h1>
              <p className="user-overview-hero__lead">
                Theo dõi thú cưng, lịch spa và đơn mua sắm — mọi thứ gọn trong một trang.
              </p>
            </div>
            <div className="user-stats user-stats--modern">
              <div className="user-stat-card user-stat-card--modern">
                <div className="user-stat-card__icon-wrap" aria-hidden="true">
                  <OverviewStatIcon variant="pets" />
                </div>
                <div className="user-stat-card__info">
                  <span className="user-stat-card__value">{pets.length}</span>
                  <span className="user-stat-card__label">Thú cưng</span>
                </div>
              </div>
              <div className="user-stat-card user-stat-card--modern">
                <div className="user-stat-card__icon-wrap" aria-hidden="true">
                  <OverviewStatIcon variant="bookings" />
                </div>
                <div className="user-stat-card__info">
                  <span className="user-stat-card__value">{myBookings.length}</span>
                  <span className="user-stat-card__label">Lịch hẹn</span>
                </div>
              </div>
              <div className="user-stat-card user-stat-card--modern">
                <div className="user-stat-card__icon-wrap" aria-hidden="true">
                  <OverviewStatIcon variant="orders" />
                </div>
                <div className="user-stat-card__info">
                  <span className="user-stat-card__value">{myOrders.length}</span>
                  <span className="user-stat-card__label">Đơn hàng</span>
                </div>
              </div>
              <div className="user-stat-card user-stat-card--modern">
                <div className="user-stat-card__icon-wrap" aria-hidden="true">
                  <OverviewStatIcon variant="spending" />
                </div>
                <div className="user-stat-card__info">
                  <span className="user-stat-card__value user-stat-card__value--money">
                    {formatPrice(userTotalSpendingVnd)}
                  </span>
                  <span className="user-stat-card__label">Chi tiêu</span>
                </div>
              </div>
              <div className="user-stat-card user-stat-card--modern">
                <div className="user-stat-card__icon-wrap" aria-hidden="true">
                  <OverviewStatIcon variant="tier" />
                </div>
                <div className="user-stat-card__info">
                  <span className="user-stat-card__value user-stat-card__value--tier">
                    {tierDisplayLabel(user.tier)}
                  </span>
                  <span className="user-stat-card__label">Hạng thành viên</span>
                </div>
              </div>
            </div>
            <div className="user-overview-quick">
              <h2 className="user-overview-quick__title">Lối tắt</h2>
              <div className="user-overview-quick__grid">
                <Link to="/shop" className="user-quick-tile">
                  <span className="user-quick-tile__label">Cửa hàng</span>
                  <span className="user-quick-tile__hint">Mua đồ cho thú cưng</span>
                </Link>
                <Link to="/services" className="user-quick-tile">
                  <span className="user-quick-tile__label">Đặt lịch spa</span>
                  <span className="user-quick-tile__hint">Chăm sóc & làm đẹp</span>
                </Link>
                <Link to="/user?tab=profile" className="user-quick-tile">
                  <span className="user-quick-tile__label">Hồ sơ</span>
                  <span className="user-quick-tile__hint">Cập nhật thông tin</span>
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {tab === 'profile' ? (
          <section
            className="user-panel user-panel--surface user-panel--profile active"
            data-panel="profile"
          >
            <header className="profile-page__header">
              <div className="profile-page__header-main">
                <h2 className="user-panel__title profile-page__title">Hồ sơ cá nhân</h2>
                <p className="user-panel__subtitle profile-page__subtitle">
                  Dùng cho đơn hàng & đặt lịch spa.
                </p>
              </div>
            </header>

            <div className="profile-layout profile-layout--v2">
              <aside className="profile-preview-card" aria-label="Xem trước hồ sơ">
                <div className="profile-preview-card__avatar-wrap">
                  <UserAvatar
                    user={{
                      ...user,
                      name: pName || user.name,
                      avatar: (pAvatar || user.avatar || profile.avatar || '').trim() || '',
                    }}
                    size={72}
                    className="profile-preview-card__avatar"
                    alt=""
                  />
                </div>
                <p className="profile-preview-card__name">{pName || user.name || 'Khách hàng'}</p>
                <p className="profile-preview-card__email">{user.email}</p>
                <span className="profile-preview-card__tier">{tierDisplayLabel(user.tier)}</span>
                <div className="profile-preview-card__spending" aria-label="Tổng chi tiêu">
                  <p className="profile-preview-card__spending-label">Chi tiêu</p>
                  <div className="profile-preview-card__spending-line" role="presentation" />
                  <p className="profile-preview-card__spending-value">
                    {formatPrice(userTotalSpendingVnd)}
                  </p>
                </div>
                <p className="profile-preview-card__hint">Đơn hoàn thành + lịch spa hoàn thành</p>
              </aside>

              <div className="profile-form-stack">
                <form className="profile-form profile-form--polished profile-form--v2" onSubmit={saveProfile}>
                  <div className="profile-cards-column">
                  <div className="profile-card profile-card--accent">
                    <div className="profile-card__header">
                      <span className="profile-card__step" aria-hidden="true">
                        1
                      </span>
                      <div>
                        <h3 className="profile-card__title">Thông tin cơ bản</h3>
                        <p className="profile-card__lead">Tên, email, giới tính, ảnh đại diện</p>
                      </div>
                    </div>
                    <div className="profile-card__body">
                      <div className="profile-form__grid">
                        <div className="profile-form__field">
                          <label htmlFor="profileName">
                            Họ tên <span className="required">*</span>
                          </label>
                          <input
                            id="profileName"
                            value={pName}
                            onChange={(e) => setPName(e.target.value)}
                            required
                            autoComplete="name"
                            placeholder="Nguyễn Văn A"
                          />
                        </div>
                        <div className="profile-form__field profile-form__field--readonly">
                          <label htmlFor="profileEmail">Email đăng nhập</label>
                          <input id="profileEmail" type="email" value={user.email} readOnly />
                          <span className="profile-form__hint">Chỉ đổi qua quản trị.</span>
                        </div>
                        <div className="profile-form__field">
                          <label htmlFor="profileGender">Giới tính</label>
                          <select
                            id="profileGender"
                            value={pGender}
                            onChange={(e) => setPGender(e.target.value)}
                          >
                            <option value="">-- Chọn --</option>
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                          </select>
                        </div>
                        <div className="profile-form__field profile-form__field--full profile-avatar-field">
                          <label className="profile-avatar-field__label">
                            Ảnh đại diện
                          </label>
                          <div className="profile-avatar-field__layout">
                            <div className="profile-avatar-field__preview" aria-hidden="true">
                              <UserAvatar
                                user={{
                                  ...user,
                                  name: pName || user.name,
                                  avatar: (pAvatar || user.avatar || profile.avatar || '').trim() || '',
                                }}
                                size={56}
                                className="profile-avatar-field__avatar"
                                alt=""
                              />
                            </div>
                            <div className="profile-avatar-field__inputs">
                              <input
                                ref={avatarInputRef}
                                id="profileAvatar"
                                type="file"
                                accept="image/*"
                                onChange={onAvatarFileChange}
                                aria-describedby="profileAvatarHint"
                                style={{ display: 'none' }}
                              />
                              {avatarFileName ? (
                                <span className="profile-form__hint">Đã chọn: {avatarFileName}</span>
                              ) : null}
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => avatarInputRef.current?.click()}
                                >
                                  Chọn file
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => {
                                    setPAvatar('')
                                    setAvatarFileName('')
                                    setAvatarUploadFile(null)
                                  }}
                                >
                                  Xóa ảnh
                                </button>
                              </div>
                              <span id="profileAvatarHint" className="profile-form__hint">
                                Chỉ chọn ảnh từ máy (JPG, PNG, WebP...). Để trống sẽ hiện chữ cái đầu.
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="profile-card profile-card--accent">
                    <div className="profile-card__header">
                      <span className="profile-card__step" aria-hidden="true">
                        2
                      </span>
                      <div>
                        <h3 className="profile-card__title">Liên hệ & địa chỉ</h3>
                        <p className="profile-card__lead">Giao hàng & lịch hẹn salon</p>
                      </div>
                    </div>
                    <div className="profile-card__body profile-card__body--stack">
                      <div className="profile-subsection">
                        <div className="profile-subsection__head">
                          <span className="profile-subsection__tag">Liên lạc</span>
                          <p className="profile-subsection__text">SĐT & ngày sinh</p>
                        </div>
                        <div className="profile-form__grid">
                          <div className="profile-form__field">
                            <label htmlFor="profilePhone">Số điện thoại</label>
                            <input
                              id="profilePhone"
                              type="tel"
                              value={pPhone}
                              onChange={(e) => setPPhone(e.target.value)}
                              autoComplete="tel"
                              placeholder="09xxxxxxx"
                            />
                          </div>
                          <div className="profile-form__field">
                            <label htmlFor="profileDob">Ngày sinh</label>
                            <input
                              id="profileDob"
                              type="date"
                              value={pDob}
                              onChange={(e) => setPDob(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="profile-subsection profile-subsection--boxed">
                        <div className="profile-subsection__head">
                          <span className="profile-subsection__tag profile-subsection__tag--soft">
                            Giao hàng & spa
                          </span>
                          <p className="profile-subsection__text">Địa chỉ giao hàng / liên hệ spa</p>
                        </div>
                        <div className="profile-form__grid">
                          <div className="profile-form__field profile-form__field--full">
                            <label htmlFor="profileAddress">Địa chỉ</label>
                            <textarea
                              id="profileAddress"
                              rows={2}
                              value={pAddress}
                              onChange={(e) => setPAddress(e.target.value)}
                              autoComplete="street-address"
                              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành…"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>

                  <div className="profile-form__actions profile-form__actions--v2 profile-form__actions--sticky">
                    <p className="profile-form__actions-hint">Nhớ bấm lưu.</p>
                    <button type="submit" className="btn btn--primary btn-profile-save">
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        ) : null}

        {tab === 'pets' ? (
          <section className="user-panel user-panel--surface active" data-panel="pets">
            <div className="user-panel__head user-panel__head--pets">
              <div>
                <h2 className="user-panel__title">Thú cưng của tôi</h2>
                <p className="user-panel__subtitle">
                  Hồ sơ lưu trong cơ sở dữ liệu — dùng khi đặt lịch spa (chọn thú cưng đã lưu).
                </p>
              </div>
              {user?.id ? (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={openPetFormForAdd}
                >
                  + Thêm thú cưng
                </button>
              ) : null}
            </div>

            {petsErr ? (
              <p className="user-pets-alert" role="alert">
                {petsErr}
              </p>
            ) : null}

            {petFormOpen ? (
              <form className="user-pets-form-card" onSubmit={handlePetFormSubmit}>
                <h3 className="user-pets-form-card__title">
                  {petForm.id ? 'Sửa thú cưng' : 'Thêm thú cưng'}
                </h3>
                <div className="user-pets-form-grid">
                  <div className="profile-form__field">
                    <label htmlFor="petName">Tên thú cưng *</label>
                    <input
                      id="petName"
                      value={petForm.name}
                      onChange={(e) => setPetForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Ví dụ: Milu"
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="profile-form__field">
                    <label htmlFor="petType">Loại</label>
                    <select
                      id="petType"
                      value={petForm.pet_type}
                      onChange={(e) =>
                        setPetForm((f) => ({ ...f, pet_type: e.target.value }))
                      }
                    >
                      <option value="dog">Chó</option>
                      <option value="cat">Mèo</option>
                    </select>
                  </div>
                  <div className="profile-form__field">
                    <label htmlFor="petWeight">Cân nặng (kg)</label>
                    <input
                      id="petWeight"
                      type="number"
                      min="0"
                      step="0.1"
                      value={petForm.weight_kg}
                      onChange={(e) =>
                        setPetForm((f) => ({ ...f, weight_kg: e.target.value }))
                      }
                      placeholder="Tuỳ chọn"
                    />
                  </div>
                </div>
                <div className="user-pets-form-card__actions">
                  <button type="submit" className="btn btn--primary btn--sm" disabled={petSaving}>
                    {petSaving ? 'Đang lưu…' : 'Lưu'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setPetFormOpen(false)}
                    disabled={petSaving}
                  >
                    Huỷ
                  </button>
                </div>
              </form>
            ) : null}

            {petsLoading ? (
              <p className="user-pets-loading">Đang tải danh sách…</p>
            ) : null}

            <div className="user-pets-grid user-pets-grid--modern">
              {!petsLoading && pets.length === 0 ? (
                <div className="user-empty user-empty--card">
                  <p className="user-empty__title">Chưa có thú cưng</p>
                  <p className="user-empty__text">
                    Thêm hồ sơ bên dưới hoặc đặt lịch spa — hệ thống có thể tạo thú cưng từ form đặt
                    lịch.
                  </p>
                  <div className="user-empty__actions">
                    {user?.id ? (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={openPetFormForAdd}
                      >
                        Thêm thú cưng
                      </button>
                    ) : null}
                    <Link to="/services" className="btn btn--ghost">
                      Đặt lịch spa
                    </Link>
                  </div>
                </div>
              ) : null}

              {!petsLoading &&
                pets.map((p) => {
                  const pt = String(p.pet_type || p.type || 'dog').toLowerCase()
                  const typeLabel = pt === 'cat' ? 'Mèo' : 'Chó'
                  return (
                    <div key={p.id || p.name} className="user-pet-card user-pet-card--modern">
                      <span className="user-pet-card__type">{typeLabel}</span>
                      <p className="user-pet-card__name">{p.name}</p>
                      <p className="user-pet-card__meta">
                        Cân nặng:{' '}
                        {p.weight_kg != null && p.weight_kg !== ''
                          ? `${p.weight_kg} kg`
                          : '—'}
                      </p>
                      {user?.id && p.id != null ? (
                        <div className="user-pet-card__actions">
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => openPetFormForEdit(p)}
                            disabled={petSaving}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm user-pet-card__btn-del"
                            onClick={() => handleDeletePet(p.id)}
                            disabled={petSaving}
                          >
                            Xóa
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
            </div>
          </section>
        ) : null}

        {tab === 'bookings' ? (
          <section className="user-panel user-panel--surface active" data-panel="bookings">
            <div className="user-panel__head">
              <h2 className="user-panel__title">Lịch hẹn Spa</h2>
              <Link to="/services" className="btn btn--primary">
                Đặt lịch mới
              </Link>
            </div>
            {myBookings.length === 0 ? (
              <p className="user-empty">Chưa có lịch hẹn.</p>
            ) : (
              <div className="user-orders-layout">
                <div className="user-bookings-list-modern">
                  <div className="user-orders-list-modern__actions">
                    <span className="user-orders-list-modern__picked">
                      Đã chọn: {selectedBookingIds.length}
                    </span>
                    <button
                      type="button"
                      className="user-orders-list-modern__delete-btn"
                      disabled={selectedBookingIds.length === 0}
                      onClick={deleteSelectedBookings}
                      title="Chỉ xóa được lịch Hoàn thành hoặc Đã hủy"
                    >
                      🗑 Xóa đã chọn
                    </button>
                  </div>
                  {myBookings.map((b, i) => (
                    <article
                      key={`${b.id}-${i}`}
                      className={`user-booking-card${
                        selectedBookingIds.includes(String(b.id || ''))
                          ? ' user-booking-card--selected'
                          : ''
                      }`}
                    >
                      <label className="user-booking-card__check">
                        <input
                          type="checkbox"
                          checked={selectedBookingIds.includes(String(b.id || ''))}
                          disabled={!canDeleteBooking(b.status)}
                          onChange={() => toggleBookingSelected(b.id)}
                          title={
                            canDeleteBooking(b.status)
                              ? 'Chọn để xóa khỏi danh sách'
                              : 'Chỉ xóa được lịch Hoàn thành hoặc Đã hủy'
                          }
                        />
                      </label>
                      <div className="user-booking-card__main">
                        <p className="user-booking-card__id">#{b.id || '—'} · {b.serviceName || 'Dịch vụ spa'}</p>
                        <p className="user-booking-card__meta">
                          {b.petName || 'Thú cưng'} · {formatBookingDateTime(b.date, b.time)}
                        </p>
                      </div>
                      <span
                        className={`user-order-card__status user-order-card__status--${b.status || 'pending'}`}
                      >
                        {BOOKING_STATUS_LABEL[b.status] || b.status || BOOKING_STATUS_LABEL.pending}
                      </span>
                      <div className="user-booking-card__actions">
                        <button
                          type="button"
                          className="user-order-card__detail-btn"
                          onClick={() => viewBookingDetail(b)}
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          className="user-booking-card__cancel-btn"
                          disabled={!canCancelBooking(b.status)}
                          onClick={() => cancelBooking(b)}
                          title={
                            canCancelBooking(b.status)
                              ? 'Hủy lịch hẹn'
                              : 'Lịch hẹn này không thể hủy'
                          }
                        >
                          Hủy lịch
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <aside className="user-orders-summary">
                  <div className="user-orders-summary__value">{myBookings.length}</div>
                  <p className="user-orders-summary__label">Tổng lịch hẹn</p>
                  <div className="user-orders-summary__value user-orders-summary__value--money">
                    {bookingsCanCancel}
                  </div>
                  <p className="user-orders-summary__label">Có thể hủy</p>
                  <Link to="/services" className="user-orders-summary__cta">
                    Đặt thêm lịch
                  </Link>
                </aside>
              </div>
            )}
          </section>
        ) : null}

        {tab === 'orders' ? (
          <section className="user-panel user-panel--surface active" data-panel="orders">
            <h2 className="user-panel__title">Đơn hàng</h2>
            {myOrders.length === 0 ? (
              <p className="user-empty">
                Chưa có đơn hàng. <Link to="/shop">Mua sắm ngay</Link>
              </p>
            ) : (
              <div className="user-orders-layout">
                <div className="user-orders-list-modern">
                  <div className="user-orders-list-modern__actions">
                    <span className="user-orders-list-modern__picked">
                      Đã chọn: {selectedOrderIds.length}
                    </span>
                    <button
                      type="button"
                      className="user-orders-list-modern__delete-btn"
                      disabled={selectedOrderIds.length === 0}
                      onClick={deleteSelectedOrders}
                    >
                      🗑 Xóa đã chọn
                    </button>
                  </div>
                  {myOrders.map((o, i) => {
                    const reviewProductId = firstOrderLineProductId(o)
                    const firstProductName = firstOrderLineProductName(o)
                    return (
                    <article
                      key={`${o.id}-${i}`}
                      className={`user-order-card${
                        selectedOrderIds.includes(String(o.id || ''))
                          ? ' user-order-card--selected'
                          : ''
                      }`}
                    >
                      <label className="user-order-card__check">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(String(o.id || ''))}
                          disabled={!canDeleteOrder(o.status)}
                          onChange={() => toggleOrderSelected(o.id)}
                          title={
                            canDeleteOrder(o.status)
                              ? 'Chọn để xóa'
                              : 'Chỉ xóa được đơn Hoàn thành hoặc Đã hủy'
                          }
                        />
                      </label>
                      <ProductImage
                        image={orderPreviewImage(o)}
                        alt={o.id || 'order'}
                        className="user-order-card__thumb"
                      />
                      <div className="user-order-card__main">
                        <p className="user-order-card__id">
                          {firstProductName || `Đơn #${o.id || '—'}`}
                        </p>
                        <p className="user-order-card__meta">{formatOrderDateTime(o.createdAt)}</p>
                        <p className="user-order-card__meta">
                          {orderItemCount(o)} sản phẩm
                        </p>
                      </div>
                      <div className="user-order-card__price">
                        {formatPrice(o.total || 0)}
                      </div>
                      <span
                        className={`user-order-card__status user-order-card__status--${
                          o.status || 'pending'
                        }`}
                      >
                        {ORDER_STATUS_LABEL[o.status] ||
                          o.status ||
                          ORDER_STATUS_LABEL.pending}
                      </span>
                      <div className="user-order-card__detail-col">
                        <button
                          type="button"
                          className="user-order-card__detail-btn"
                          onClick={() => viewOrderDetail(o)}
                        >
                          Chi tiết
                        </button>
                        {o.status === 'completed' && reviewProductId ? (
                          <Link
                            to={`/product/${encodeURIComponent(reviewProductId)}?tab=reviews`}
                            className="user-order-card__review-btn"
                          >
                            Đánh giá sản phẩm
                          </Link>
                        ) : null}
                        {o.status === 'completed' && reviewProductId ? (
                          <button
                            type="button"
                            className="user-order-card__review-btn"
                            onClick={() => toggleFavoriteProduct(reviewProductId)}
                          >
                            {favorites.some((id) => String(id) === String(reviewProductId))
                              ? '❤ Đã yêu thích'
                              : '♡ Yêu thích'}
                          </button>
                        ) : null}
                      </div>
                    </article>
                    )
                  })}
                </div>
                <aside className="user-orders-summary">
                  <div className="user-orders-summary__value">{myOrders.length}</div>
                  <p className="user-orders-summary__label">Tổng đơn hàng</p>
                  <div className="user-orders-summary__value user-orders-summary__value--money">
                    {formatPrice(userTotalSpendingVnd)}
                  </div>
                  <p className="user-orders-summary__label">Tổng chi tiêu</p>
                  <Link to="/shop" className="user-orders-summary__cta">
                    Tiếp tục mua sắm
                  </Link>
                </aside>
              </div>
            )}
          </section>
        ) : null}

        {tab === 'favorites' ? (
          <section className="user-panel user-panel--surface active" data-panel="favorites">
            <div className="user-panel__head user-panel__head--borderless">
              <h2 className="user-panel__title">Sản phẩm yêu thích</h2>
            </div>
            {favorites.length === 0 ? (
              <div className="user-empty user-empty--card">
                <p className="user-empty__title">Chưa có sản phẩm yêu thích</p>
                <p className="user-empty__text">Ghé cửa hàng và nhấn trái tim trên sản phẩm để lưu.</p>
                <Link to="/shop" className="btn btn--primary">
                  Mua sắm ngay
                </Link>
              </div>
            ) : (
              <>
                {favoriteProducts.length > 0 ? (
                  <div className="user-favorites-grid">
                    {favoriteProducts.map((p) => (
                      <div key={p.id}>
                        <ProductCard product={p} />
                        <div style={{ marginTop: '0.45rem' }}>
                          <button
                            type="button"
                            className="user-favorites-remove-btn"
                            onClick={() => removeFavoriteProduct(p.id)}
                          >
                            <span aria-hidden>❤</span> Hủy yêu thích
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {favoriteOrphanIds.length > 0 ? (
                  <div className={favoriteProducts.length > 0 ? 'user-favorites-orphans' : ''}>
                    {favoriteProducts.length > 0 ? (
                      <p className="user-favorites-orphans__title">Không tải được chi tiết (vẫn mở được link)</p>
                    ) : null}
                    <ul className="user-favorites-fallback">
                      {favoriteOrphanIds.map((id) => (
                        <li key={id}>
                          <Link to={`/product/${id}`} className="user-favorites-fallback__link">
                            Sản phẩm #{id}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        {tab === 'addresses' ? (
          <section className="user-panel user-panel--surface active" data-panel="addresses">
            <div className="user-panel__head">
              <h2 className="user-panel__title">Địa chỉ giao hàng</h2>
            </div>
            <p className="user-addresses__intro">
              Lưu các địa chỉ thường dùng để điền nhanh khi đặt hàng. Bạn cũng có thể nhập địa chỉ mới
              mỗi lần khi đặt hàng.
            </p>

            {addresses.length === 0 ? (
              <div className="user-addresses-empty">
                <p className="user-addresses-empty__title">Chưa có địa chỉ đã lưu</p>
                <p className="user-addresses-empty__text">
                  Dùng biểu mẫu &quot;Thêm địa chỉ mới&quot; bên dưới. Khi đặt hàng, bạn vẫn có thể nhập
                  hoặc sửa địa chỉ trực tiếp tại trang Thanh toán.
                </p>
              </div>
            ) : (
              <ul className="user-addresses-list" aria-label="Danh sách địa chỉ">
                {addresses.map((raw, i) => {
                  const a = normalizeAddressRow(raw, i)
                  return (
                    <li key={a.id || i} className="user-address-card">
                      <div className="user-address-card__body">
                        <p className="user-address-card__label">{a.label}</p>
                        <p className="user-address-card__line">{a.address || '—'}</p>
                        {a.phone ? (
                          <p className="user-address-card__phone">Điện thoại: {a.phone}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="user-address-card__remove"
                        onClick={() => removeSavedAddress(i)}
                      >
                        Xóa
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {(pAddress || '').trim() ? (
              <div className="user-addresses-profile-sync">
                <p>
                  Hồ sơ của bạn đang có địa chỉ. Bạn có thể thêm nhanh vào sổ địa chỉ để dùng khi đặt
                  hàng.
                </p>
                <button type="button" className="user-addresses-sync-btn" onClick={importProfileAddress}>
                  Thêm địa chỉ từ hồ sơ
                </button>
              </div>
            ) : null}

            <form className="user-addresses-form" onSubmit={addSavedAddress}>
              <h3 className="user-addresses-form__title">Thêm địa chỉ mới</h3>
              <div className="user-addresses-form__grid">
                <label className="user-addresses-form__field">
                  <span>Ghi chú (ví dụ: Nhà, Cơ quan)</span>
                  <input
                    type="text"
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    placeholder="Nhà riêng"
                    autoComplete="off"
                  />
                </label>
                <label className="user-addresses-form__field user-addresses-form__field--full">
                  <span>Địa chỉ giao hàng</span>
                  <textarea
                    value={addrLine}
                    onChange={(e) => setAddrLine(e.target.value)}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                    rows={3}
                    required
                  />
                </label>
                <label className="user-addresses-form__field">
                  <span>Số điện thoại nhận hàng (tuỳ chọn)</span>
                  <input
                    type="tel"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    placeholder="09xxxxxxx"
                    autoComplete="tel"
                  />
                </label>
              </div>
              <button type="submit" className="btn btn--primary user-addresses-form__submit">
                Lưu địa chỉ
              </button>
            </form>
          </section>
        ) : null}

        {tab === 'password' ? (
          <section className="user-panel user-panel--surface active" data-panel="password">
            <div className="user-panel__head user-panel__head--borderless">
              <h2 className="user-panel__title">Đổi mật khẩu</h2>
              <p className="user-panel__subtitle">Bảo mật tài khoản đăng nhập.</p>
            </div>
            <div className="user-password-wrap">
              <p className="user-password-wrap__hint">
                Áp dụng tài khoản đăng ký qua hệ thống (MySQL). Đăng nhập admin demo không dùng được mục
                này.
              </p>
              <form className="user-password-form" onSubmit={submitChangePassword}>
                <label className="user-password-form__field">
                  <span>Mật khẩu hiện tại</span>
                  <input
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    disabled={pwdSubmitting}
                  />
                </label>
                <label className="user-password-form__field">
                  <span>Mật khẩu mới</span>
                  <input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    disabled={pwdSubmitting}
                  />
                </label>
                <label className="user-password-form__field">
                  <span>Xác nhận mật khẩu mới</span>
                  <input
                    name="newPasswordConfirm"
                    type="password"
                    autoComplete="new-password"
                    disabled={pwdSubmitting}
                  />
                </label>
                {pwdErr ? (
                  <p className="user-password-form__msg user-password-form__msg--error" role="alert">
                    {pwdErr}
                  </p>
                ) : null}
                {pwdOk ? (
                  <p className="user-password-form__msg user-password-form__msg--ok" role="status">
                    {pwdOk}
                  </p>
                ) : null}
                <div className="user-password-form__actions">
                  <button
                    type="submit"
                    className="btn btn--primary user-password-form__submit"
                    disabled={pwdSubmitting}
                  >
                    {pwdSubmitting ? 'Đang lưu…' : 'Cập nhật mật khẩu'}
                  </button>
                  <Link to="/" className="btn user-password-form__home">
                    Về trang chủ
                  </Link>
                </div>
              </form>
            </div>
          </section>
        ) : null}
        </div>
      </div>

      {orderDetail ? (
        <div
          className="user-order-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOrderDetail(null)
          }}
        >
          <div className="user-order-modal__panel">
            <div className="user-order-modal__head">
              <div>
                <h3 className="user-order-modal__title">Chi tiết đơn hàng</h3>
                <p className="user-order-modal__meta">
                  {orderDetail.id || '—'} · {formatOrderDateTime(orderDetail.createdAt)}
                </p>
              </div>
              <button
                type="button"
                className="user-order-modal__close"
                onClick={() => setOrderDetail(null)}
              >
                ×
              </button>
            </div>
            <div className="user-order-modal__progress">
              {[
                ['pending', 'Đã đặt hàng'],
                ['confirmed', 'Đã xác nhận'],
                ['shipping', 'Đang giao'],
                ['completed', 'Đã giao'],
              ].map(([k, label], idx, arr) => {
                const order = ['pending', 'confirmed', 'shipping', 'completed']
                const currentIdx = order.indexOf(String(orderDetail.status || 'pending'))
                const active = idx <= Math.max(0, currentIdx)
                return (
                  <div key={k} className={`user-order-modal__step${active ? ' active' : ''}`}>
                    <span className="user-order-modal__dot" />
                    <span>{label}</span>
                    {idx < arr.length - 1 ? <i /> : null}
                  </div>
                )
              })}
            </div>

            <div className="user-order-modal__section">
              <p className="user-order-modal__label">Đơn vị giao hàng</p>
              <p className="user-order-modal__carrier">{orderDetail.carrier || 'PetCare Express'}</p>
              <p className="user-order-modal__phone">{orderDetail.carrierPhone || '1900 1234'}</p>
            </div>

            <div className="user-order-modal__section">
              <p className="user-order-modal__label">Sản phẩm</p>
              <div className="user-order-modal__items">
                {(orderDetail.items || []).map((it, idx) => (
                  <div key={`${it.id}-${idx}`} className="user-order-modal__item">
                    <ProductImage image={it.image} alt={it.name} className="user-order-modal__img" />
                    <div className="user-order-modal__item-main">
                      <p>{it.name || 'Sản phẩm'}</p>
                      <small>x{it.quantity || 1}</small>
                    </div>
                    <strong>{formatPrice((it.price || 0) * (it.quantity || 1))}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="user-order-modal__foot">
              <div>
                <span>Tổng thanh toán</span>
                <strong>{formatPrice(orderDetail.total || 0)}</strong>
              </div>
              <button
                type="button"
                className="user-order-modal__cancel"
                disabled={!canCancelOrder(orderDetail.status)}
                onClick={() => cancelOrder(orderDetail)}
              >
                Hủy đơn hàng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

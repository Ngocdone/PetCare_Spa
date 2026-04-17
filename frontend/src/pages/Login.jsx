/**
 * Đăng nhập / đăng ký / Google OAuth: gọi API legacy, lưu session qua setCurrentUser.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiUrl } from '../config.js'
import { setCurrentUser, setSessionToken } from '../utils/auth.js'
import '../styles/auth-page.css'
import { getShopLogoSrc } from '../utils/assets.js'

function GoogleGMark() {
  return (
    <svg className="auth-page__google-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export default function Login() {
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
  const googleHostRef = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const reason = String(searchParams.get('reason') || '').trim()
  const loginNotice =
    reason === 'booking_required'
      ? 'Vui lòng đăng nhập để đặt lịch dịch vụ.'
      : reason === 'product_required'
        ? 'Vui lòng đăng nhập để mua hoặc thêm sản phẩm vào giỏ hàng.'
      : reason === 'auth_required'
        ? 'Vui lòng đăng nhập để tiếp tục.'
        : ''

  const tab = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const [loginErr, setLoginErr] = useState({ email: '', password: '' })
  const [regErr, setRegErr] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })
  const [googleErr, setGoogleErr] = useState('')
  const [googleHelpOpen, setGoogleHelpOpen] = useState(false)

  function selectTab(next) {
    setGoogleErr('')
    setGoogleHelpOpen(false)
    const p = new URLSearchParams(searchParams)
    if (next === 'login') p.delete('tab')
    else p.set('tab', 'register')
    setSearchParams(p, { replace: true })
  }

  const afterAuthSuccess = useCallback(
    (user, token) => {
      setCurrentUser(user)
      window.dispatchEvent(new CustomEvent('petspa-user-updated'))
      if (token) {
        setSessionToken(token)
      }
      const ret = searchParams.get('return') || '/'
      if (user.role === 'admin') {
        const dec = ret ? decodeURIComponent(ret) : ''
        if (dec && dec.includes('/admin')) {
          navigate(dec.startsWith('/') ? dec : `/${dec}`)
        } else {
          navigate('/admin')
        }
      } else {
        navigate(ret.startsWith('/') ? ret : `/${ret}`)
      }
    },
    [navigate, searchParams]
  )

  const handleGoogleCredential = useCallback(
    async (response) => {
      const credential = response?.credential
      if (!credential) return
      setGoogleErr('')
      try {
        const res = await fetch(apiUrl('/api/auth/google'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential }),
        })
        const data = await res.json().catch(() => ({}))
        if (data.success && data.user) {
          afterAuthSuccess(data.user, data.token)
        } else {
          setGoogleErr(data.error || 'Đăng nhập Google thất bại.')
        }
      } catch {
        setGoogleErr('Không kết nối được máy chủ.')
      }
    },
    [afterAuthSuccess]
  )

  useEffect(() => {
    if (!googleClientId || !googleHostRef.current) return undefined

    let cancelled = false

    function renderButton() {
      if (cancelled || !googleHostRef.current || !window.google?.accounts?.id) return
      const el = googleHostRef.current
      el.innerHTML = ''
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
      })
      const w = Math.min(400, el.offsetWidth || 360)
      window.google.accounts.id.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: w,
        text: 'continue_with',
        locale: 'vi',
        shape: 'pill',
      })
    }

    function boot() {
      if (document.querySelector('script[data-petspa-gsi="1"]')) {
        let tries = 0
        const id = window.setInterval(() => {
          tries += 1
          if (window.google?.accounts?.id || tries > 60) {
            window.clearInterval(id)
            if (window.google?.accounts?.id) renderButton()
          }
        }, 80)
        return () => window.clearInterval(id)
      }
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.dataset.petspaGsi = '1'
      s.onload = () => renderButton()
      document.head.appendChild(s)
      return undefined
    }

    const cleanupTimer = boot()
    const onResize = () => renderButton()
    window.addEventListener('resize', onResize)
    return () => {
      cancelled = true
      window.removeEventListener('resize', onResize)
      if (typeof cleanupTimer === 'function') cleanupTimer()
    }
  }, [googleClientId, handleGoogleCredential])

  function togglePassword(btn, inputId) {
    const input = document.getElementById(inputId)
    const label = btn.querySelector('.auth-page__pw-toggle-label')
    if (!input || !label) return
    const isPass = input.type === 'password'
    input.type = isPass ? 'text' : 'password'
    label.textContent = isPass ? 'Ẩn' : 'Hiện'
  }

  async function onLogin(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const email = String(fd.get('email') || '').trim()
    const password = String(fd.get('password') || '')
    setLoginErr({ email: '', password: '' })
    if (!email) {
      setLoginErr({ email: 'Vui lòng nhập email.', password: '' })
      return
    }
    if (!password) {
      setLoginErr({ email: '', password: 'Vui lòng nhập mật khẩu.' })
      return
    }

    try {
      const res = await fetch(apiUrl('/api/login'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success && data.user) {
        afterAuthSuccess(data.user, data.token)
      } else {
        setLoginErr({
          email: '',
          password: 'Email hoặc mật khẩu không đúng.',
        })
      }
    } catch {
      setLoginErr({
        email: '',
        password:
          'Không kết nối được API. Chạy backend: cd backend && npm start; Vite proxy /api → cổng 3001.',
      })
    }
  }

  async function onRegister(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const name = String(fd.get('name') || '').trim()
    const email = String(fd.get('email') || '').trim()
    const phone = String(fd.get('phone') || '').trim()
    const password = String(fd.get('password') || '')
    const passwordConfirm = String(fd.get('passwordConfirm') || '')
    setRegErr({
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
    })
    const next = {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
    }
    if (!name) next.name = 'Vui lòng nhập họ tên.'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRe.test(email)) next.email = 'Email không hợp lệ.'
    if (password.length < 6) next.password = 'Mật khẩu ít nhất 6 ký tự.'
    if (password !== passwordConfirm)
      next.passwordConfirm = 'Xác nhận mật khẩu không khớp.'
    if (Object.values(next).some(Boolean)) {
      setRegErr(next)
      return
    }

    try {
      const res = await fetch(apiUrl('/api/register'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      })
      const data = await res.json()
      if (data.success && data.user) {
        afterAuthSuccess(data.user, data.token)
      } else {
        setRegErr({
          name: '',
          email: data.error || 'Email đã được đăng ký.',
          password: '',
          passwordConfirm: '',
        })
      }
    } catch {
      setRegErr({
        name: '',
        email: 'Không thể kết nối. Thử lại sau.',
        password: '',
        passwordConfirm: '',
      })
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-page__grid">
        <aside className="auth-page__brand" aria-label="Giới thiệu">
          <div className="auth-page__brand-inner">
            <Link to="/" className="auth-page__brand-logo">
              <span className="auth-page__brand-mark" aria-hidden="true">
                <img
                  src={getShopLogoSrc()}
                  alt=""
                  className="auth-page__brand-logo-img"
                  width={38}
                  height={38}
                  decoding="async"
                />
              </span>
              Pet Spa &amp; Shop
            </Link>
            <h1 className="auth-page__brand-title">
              Chăm sóc thú cưng <em>từ trái tim</em>
            </h1>
            <p className="auth-page__brand-desc">
              Đặt lịch spa, mua sắm và theo dõi đơn hàng — chỉ với một tài khoản.
            </p>
            <div className="auth-page__brand-tags">
              <span className="auth-page__brand-tag">Đặt lịch nhanh</span>
              <span className="auth-page__brand-tag">Ưu đãi thành viên</span>
              <span className="auth-page__brand-tag">Giao hàng tiện lợi</span>
            </div>
          </div>
        </aside>

        <div className="auth-page__panel">
          <div className="auth-page__card">
            <nav className="auth-page__crumb" aria-label="Breadcrumb">
              <Link to="/">← Trang chủ</Link>
            </nav>
            {loginNotice ? (
              <div className="auth-page__notice" role="status">
                {loginNotice}
              </div>
            ) : null}

            <div className="auth-page__tabs" data-active={tab}>
              <span className="auth-page__tab-pill" aria-hidden="true" />
              <button
                type="button"
                className={`auth-page__tab${tab === 'login' ? ' auth-page__tab--active' : ''}`}
                onClick={() => selectTab('login')}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className={`auth-page__tab${tab === 'register' ? ' auth-page__tab--active' : ''}`}
                onClick={() => selectTab('register')}
              >
                Đăng ký
              </button>
            </div>

            <div
              className={`auth-page__panel-form${tab === 'login' ? ' auth-page__panel-form--active' : ''}`}
              id="panelLogin"
            >
              <h2 className="auth-page__form-title">Chào mừng trở lại</h2>
              <p className="auth-page__form-desc">Nhập email và mật khẩu để tiếp tục.</p>
              <form onSubmit={onLogin}>
                <div className="auth-page__field">
                  <div className="auth-page__field-inner">
                    <input
                      type="email"
                      id="loginEmail"
                      name="email"
                      required
                      placeholder=" "
                      autoComplete="email"
                    />
                    <label htmlFor="loginEmail">Email</label>
                  </div>
                  <span className="auth-page__field-error">{loginErr.email}</span>
                </div>
                <div className="auth-page__field auth-page__field--password">
                  <div className="auth-page__field-inner">
                    <input
                      type="password"
                      id="loginPassword"
                      name="password"
                      required
                      placeholder=" "
                      autoComplete="current-password"
                    />
                    <label htmlFor="loginPassword">Mật khẩu</label>
                    <button
                      type="button"
                      className="auth-page__pw-toggle"
                      aria-label="Hiện/ẩn mật khẩu"
                      tabIndex={-1}
                      onClick={(e) => togglePassword(e.currentTarget, 'loginPassword')}
                    >
                      <span className="auth-page__pw-toggle-label">Hiện</span>
                    </button>
                  </div>
                  <span className="auth-page__field-error">{loginErr.password}</span>
                </div>
                <button type="submit" className="auth-page__submit">
                  Đăng nhập
                </button>
              </form>
              
              <p className="auth-page__switch">
                Chưa có tài khoản?{' '}
                <button type="button" className="auth-page__switch-btn" onClick={() => selectTab('register')}>
                  Đăng ký
                </button>
              </p>
            </div>

            <div
              className={`auth-page__panel-form${tab === 'register' ? ' auth-page__panel-form--active' : ''}`}
              id="panelRegister"
            >
              <h2 className="auth-page__form-title">Tạo tài khoản</h2>
              <p className="auth-page__form-desc">Vài thông tin để bắt đầu mua sắm và đặt lịch.</p>
              <form onSubmit={onRegister}>
                <div className="auth-page__field">
                  <div className="auth-page__field-inner">
                    <input
                      type="text"
                      id="regName"
                      name="name"
                      required
                      placeholder=" "
                      autoComplete="name"
                    />
                    <label htmlFor="regName">Họ tên</label>
                  </div>
                  <span className="auth-page__field-error">{regErr.name}</span>
                </div>
                <div className="auth-page__field">
                  <div className="auth-page__field-inner">
                    <input
                      type="email"
                      id="regEmail"
                      name="email"
                      required
                      placeholder=" "
                      autoComplete="email"
                    />
                    <label htmlFor="regEmail">Email</label>
                  </div>
                  <span className="auth-page__field-error">{regErr.email}</span>
                </div>
                <div className="auth-page__field">
                  <div className="auth-page__field-inner">
                    <input
                      type="tel"
                      id="regPhone"
                      name="phone"
                      placeholder=" "
                      autoComplete="tel"
                    />
                    <label htmlFor="regPhone">Số điện thoại (tuỳ chọn)</label>
                  </div>
                </div>
                <div className="auth-page__field auth-page__field--password">
                  <div className="auth-page__field-inner">
                    <input
                      type="password"
                      id="regPassword"
                      name="password"
                      required
                      placeholder=" "
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <label htmlFor="regPassword">Mật khẩu (tối thiểu 6 ký tự)</label>
                    <button
                      type="button"
                      className="auth-page__pw-toggle"
                      aria-label="Hiện/ẩn mật khẩu"
                      tabIndex={-1}
                      onClick={(e) => togglePassword(e.currentTarget, 'regPassword')}
                    >
                      <span className="auth-page__pw-toggle-label">Hiện</span>
                    </button>
                  </div>
                  <span className="auth-page__field-error">{regErr.password}</span>
                </div>
                <div className="auth-page__field auth-page__field--password">
                  <div className="auth-page__field-inner">
                    <input
                      type="password"
                      id="regPasswordConfirm"
                      name="passwordConfirm"
                      required
                      placeholder=" "
                      autoComplete="new-password"
                    />
                    <label htmlFor="regPasswordConfirm">Xác nhận mật khẩu</label>
                    <button
                      type="button"
                      className="auth-page__pw-toggle"
                      aria-label="Hiện/ẩn mật khẩu"
                      tabIndex={-1}
                      onClick={(e) => togglePassword(e.currentTarget, 'regPasswordConfirm')}
                    >
                      <span className="auth-page__pw-toggle-label">Hiện</span>
                    </button>
                  </div>
                  <span className="auth-page__field-error">{regErr.passwordConfirm}</span>
                </div>
                <button type="submit" className="auth-page__submit">
                  Đăng ký
                </button>
              </form>
              <p className="auth-page__switch">
                Đã có tài khoản?{' '}
                <button type="button" className="auth-page__switch-btn" onClick={() => selectTab('login')}>
                  Đăng nhập
                </button>
              </p>
            </div>

            <div className="auth-page__divider">
              <span>hoặc đăng nhập nhanh</span>
            </div>

            <div className="auth-page__google">
              {googleClientId ? (
                <div ref={googleHostRef} className="auth-page__google-host" />
              ) : (
                <>
                  <button
                    type="button"
                    className="auth-page__google-faux"
                    aria-expanded={googleHelpOpen}
                    onClick={() => setGoogleHelpOpen((v) => !v)}
                  >
                    <GoogleGMark />
                    Đăng nhập với Google
                  </button>
                  {googleHelpOpen ? (
                    <div className="auth-page__google-help" id="google-setup-help">
                      <p className="auth-page__google-help-title">Bật đăng nhập Google</p>
                      <p>
                        Tạo OAuth 2.0 Client ID (Web) trên Google Cloud Console. Thêm <code>VITE_GOOGLE_CLIENT_ID</code>{' '}
                        vào <code>frontend/.env</code> và <code>GOOGLE_CLIENT_ID</code> vào <code>backend/.env</code>{' '}
                        (cùng một Client ID). Trong credentials, khai báo <strong>Authorized JavaScript origins</strong>:{' '}
                        ví dụ <code>http://localhost:5173</code> và URL site của bạn.
                      </p>
                    </div>
                  ) : null}
                </>
              )}
              {googleErr ? (
                <p className="auth-page__google-error" role="alert">
                  {googleErr}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

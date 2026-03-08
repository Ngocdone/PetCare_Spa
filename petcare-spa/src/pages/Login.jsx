import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setCurrentUser } from '../utils/storage'
import { DATA } from '../data/data'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Check admin login
    if (formData.email === DATA.adminUser.email && formData.password === DATA.adminUser.password) {
      setCurrentUser({
        email: DATA.adminUser.email,
        role: 'admin',
        name: 'Admin'
      })
      navigate('/')
      return
    }

    // Check registered users
    const users = JSON.parse(localStorage.getItem('petspa_users') || '[]')
    const user = users.find(u => u.email === formData.email && u.password === formData.password)
    
    if (user) {
      setCurrentUser(user)
      navigate('/')
    } else {
      setError('Email hoặc mật khẩu không đúng')
    }
  }

  return (
    <>
      <section className="auth-hero">
        <div className="auth-hero__bg"></div>
        <div className="container auth-hero__inner">
          <h1 className="auth-hero__title">Đăng nhập</h1>
        </div>
      </section>

      <section className="section section--auth">
        <div className="container">
          <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
              <h2>Đăng nhập tài khoản</h2>
              <p className="auth-subtitle">Nhập email và mật khẩu để đăng nhập</p>
              
              {error && <div className="auth-error">{error}</div>}

              <div className="auth-form__field">
                <label htmlFor="email">Email *</label>
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="auth-form__field">
                <label htmlFor="password">Mật khẩu *</label>
                <input 
                  type="password" 
                  name="password" 
                  id="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="auth-form__options">
                <label className="auth-checkbox">
                  <input type="checkbox" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <a href="#" className="auth-link">Quên mật khẩu?</a>
              </div>

              <button type="submit" className="btn btn--primary btn--lg" style={{width: '100%'}}>
                Đăng nhập
              </button>

              <div className="auth-divider">
                <span>hoặc</span>
              </div>

              <p className="auth-footer">
                Chưa có tài khoản? <Link to="/register" className="auth-link">Đăng ký ngay</Link>
              </p>

              <div className="auth-demo">
                <p>Tài khoản demo admin:</p>
                <code>Email: admin@petspa.vn</code>
                <code>Mật khẩu: admin123</code>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

export default Login

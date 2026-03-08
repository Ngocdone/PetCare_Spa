import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PageLoader from './components/PageLoader'
import Home from './pages/Home'
import Services from './pages/Services'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Booking from './pages/Booking'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import User from './pages/User'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'

function App() {
  return (
    <>
      <PageLoader />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="booking" element={<Booking />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="user" element={<User />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
        </Route>
      </Routes>
    </>
  )
}

export default App

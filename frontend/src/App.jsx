/**
 * Định tuyến SPA: trang khách, thanh toán VNPay return, khu admin /admin/* (RequireAdmin).
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Cart from './pages/Cart.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Contact from './pages/Contact.jsx'
import Login from './pages/Login.jsx'
import Shop from './pages/Shop.jsx'
import Services from './pages/Services.jsx'
import About from './pages/About.jsx'
import Checkout from './pages/Checkout.jsx'
import VnpayReturn from './pages/VnpayReturn.jsx'
import User from './pages/User.jsx'
import Process from './pages/Process.jsx'
import RequireAdmin from './components/RequireAdmin.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminProducts from './pages/admin/AdminProducts.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'
import AdminAppointments from './pages/admin/AdminAppointments.jsx'
import AdminServices from './pages/admin/AdminServices.jsx'
import AdminCustomers from './pages/admin/AdminCustomers.jsx'
import AdminCategories from './pages/admin/AdminCategories.jsx'

const rawBase = import.meta.env.BASE_URL || '/'
const routerBasename =
  rawBase === '/' ? undefined : rawBase.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/services" element={<Services />} />
          <Route path="/booking" element={<Navigate to="/services" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/process" element={<Process />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/vnpay-return" element={<VnpayReturn />} />
          <Route path="/payment/vnpay_return" element={<VnpayReturn />} />
          <Route path="/user" element={<User />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="appointments" element={<AdminAppointments />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import MobileMenu from './MobileMenu'

function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <MobileMenu />
    </>
  )
}

export default Layout

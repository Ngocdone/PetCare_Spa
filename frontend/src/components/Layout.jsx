/**
 * Layout khách: Header/Footer, đồng bộ user, Outlet cho nội dung trang.
 */
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSyncUserFromServer } from '../hooks/useSyncUserFromServer.js'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import FloatingActions from './FloatingActions.jsx'

/** Mỗi lần chuyển trang trong SPA: đưa viewport về đầu trang */
function useScrollToTopOnRouteChange() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])
}

export default function Layout() {
  useSyncUserFromServer()
  useScrollToTopOnRouteChange()
  const { pathname } = useLocation()
  const userShell = pathname.startsWith('/user')
  return (
    <>
      <Header />
      <div className={userShell ? 'layout-outlet layout-outlet--user' : 'layout-outlet'}>
        <Outlet />
      </div>
      <FloatingActions />
      <Footer />
    </>
  )
}

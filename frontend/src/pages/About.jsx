/**
 * Giới thiệu cửa hàng / quy trình (nội dung tĩnh + link).
 */
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getProductImageSrc } from '../utils/assets.js'

export default function About() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#quy-trinh') {
      const el = document.getElementById('quy-trinh')
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.pathname, location.hash])

  return (
    <main className="page-main page-main--about">
      <section className="about-hero">
        <div className="about-hero__bg" />
        <div className="container about-hero__inner">
          <h1 className="about-hero__title">Về chúng tôi &amp; Quy trình</h1>
          <p className="about-hero__subtitle">
            Hơn 5 năm đồng hành cùng hàng nghìn chủ nuôi. Tìm hiểu câu chuyện, sứ
            mệnh và quy trình dịch vụ minh bạch, chuyên nghiệp.
          </p>
          <a href="#quy-trinh" className="btn btn--outline btn--light" style={{ marginTop: '1rem', color: '#fff', borderColor: 'rgba(255,255,255,0.8)' }}>
            Xem quy trình
          </a>
        </div>
      </section>

      <section className="section about-story">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb__list">
              <li className="breadcrumb__item">
                <Link to="/" className="breadcrumb__link">
                  Trang chủ
                </Link>
              </li>
              <li className="breadcrumb__item">
                <span className="breadcrumb__current">Về chúng tôi</span>
              </li>
            </ol>
          </nav>
          <div className="about-story__grid">
            <div className="about-story__media">
              <div className="about-story__image-wrap">
                <img
                  src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=85"
                  alt="Pet Spa - Chăm sóc thú cưng"
                />
              </div>
            </div>
            <div className="about-story__content">
              <span className="about-badge">Câu chuyện của chúng tôi</span>
              <h2 className="about-section__title">
                Từ tình yêu thú cưng đến Pet Spa &amp; Shop
              </h2>
              <p className="about-section__lead">
                Pet Spa &amp; Shop được thành lập từ niềm đam mê dành cho động
                vật — nơi spa thú cưng vừa chuyên nghiệp, vừa minh bạch và đặt
                sức khỏe thú cưng lên hàng đầu.
              </p>
              <p>
                Chúng tôi bắt đầu với không gian nhỏ tại TP.HCM và đội ngũ là
                những chủ nuôi hiểu rõ nỗi lo khi gửi thú cưng. Qua từng năm,
                dịch vụ mở rộng: tắm rửa, cắt tỉa, spa, khách sạn thú cưng và
                cửa hàng phụ kiện chất lượng.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section about-founder">
        <div className="container">
          <div className="about-section__header">
            <span className="about-badge">Người sáng lập</span>
            <h2 className="about-section__title">Trái tim đằng sau Pet Spa &amp; Shop</h2>
          </div>
          <div className="about-founder__box">
            <div className="about-founder__image">
              <img src={getProductImageSrc('nnd.jpg')} alt="Người sáng lập Pet Spa" />
            </div>
            <div className="about-founder__content">
              <h3 className="about-founder__name">Nguyễn Ngọc Đô</h3>
              <p className="about-founder__role">Founder &amp; Senior Groomer — 8 năm kinh nghiệm</p>
              <p>
                Founder là chủ nuôi nhiều năm và tốt nghiệm chuyên ngành Thú y,
                kết hợp kiến thức với tình yêu động vật để xây quy trình chăm
                sóc chuẩn mực.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section about-mission">
        <div className="container">
          <div className="about-section__header">
            <span className="about-badge">Sứ mệnh &amp; Tầm nhìn</span>
            <h2 className="about-section__title">Vì sao chúng tôi làm điều này</h2>
          </div>
          <div className="about-mission__grid">
            <div className="about-mission__card">
              <h3 className="about-mission__title">Sứ mệnh</h3>
              <p>
                Trải nghiệm chăm sóc an toàn, chuyên nghiệp và đầy yêu thương —
                mỗi bé cưng được coi như thành viên gia đình.
              </p>
            </div>
            <div className="about-mission__card">
              <h3 className="about-mission__title">Tầm nhìn</h3>
              <p>
                Trở thành thương hiệu spa thú cưng được tin cậy tại Việt Nam nhờ
                chất lượng, minh bạch và đạo đức nghề nghiệp.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section process-section" id="quy-trinh">
        <div className="container">
          <div className="about-section__header">
            <span className="about-badge">Quy trình</span>
            <h2 className="about-section__title">Quy trình dịch vụ &amp; mua sắm</h2>
            <p className="about-section__sub">
              Từ đặt lịch đến nhận thú cưng — minh bạch, chuyên nghiệp.
            </p>
          </div>
          <div className="process-block">
            <div className="process-block__header">
              <span className="process-badge">Dịch vụ Spa</span>
              <h2 className="process-block__title">Quy trình đặt lịch spa</h2>
            </div>
            <div className="process-timeline">
              <div className="process-step">
                <div className="process-step__num">1</div>
                <div className="process-step__content">
                  <h3 className="process-step__title">Đặt lịch hẹn</h3>
                  <p className="process-step__desc">
                    Chọn dịch vụ trên website hoặc gọi hotline.
                  </p>
                  <Link to="/services" className="process-step__link">
                    Đặt lịch ngay
                  </Link>
                </div>
                <div className="process-step__media">
                  <img
                    src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=85"
                    alt="Đặt lịch"
                  />
                </div>
              </div>
              <div className="process-step process-step--reverse">
                <div className="process-step__num">2</div>
                <div className="process-step__content">
                  <h3 className="process-step__title">Đến cửa hàng</h3>
                  <p className="process-step__desc">
                    Đưa bé đúng giờ, nhân viên tiếp đón và trao đổi mong muốn.
                  </p>
                </div>
                <div className="process-step__media">
                  <img src={getProductImageSrc('gui-thu-cung.jpg')} alt="Gửi thú cưng" />
                </div>
              </div>
            </div>
          </div>
          <div className="process-block" style={{ marginTop: '3rem' }}>
            <div className="process-block__header">
              <span className="process-badge">Mua sắm</span>
              <h2 className="process-block__title">Mua sắm tại cửa hàng online</h2>
            </div>
            <p className="process-block__lead">
              Chọn sản phẩm, thêm vào giỏ, thanh toán và nhận hàng — theo dõi đơn
              trong mục tài khoản.
            </p>
            <Link to="/shop" className="btn btn--primary" style={{ marginTop: '1rem' }}>
              Vào cửa hàng
            </Link>
          </div>
        </div>
      </section>

      <section className="section about-team">
        <div className="container">
          <div className="about-section__header">
            <span className="about-badge">Đội ngũ</span>
            <h2 className="about-section__title">Chuyên gia chăm sóc thú cưng</h2>
          </div>
          <div className="about-team__grid">
            {[
              ['Lê Phúc Vinh', 'Senior Groomer', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=85'],
              ['Nguyễn Ngọc Thiện', 'Spa Specialist', 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300&q=85'],
              ['Phạm Võ Thành Hưng', 'Pet Stylist', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=85'],
            ].map(([n, r, src]) => (
              <div className="about-team__card" key={n}>
                <div className="about-team__photo">
                  <img src={src} alt={n} />
                </div>
                <h3 className="about-team__name">{n}</h3>
                <p className="about-team__role">{r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

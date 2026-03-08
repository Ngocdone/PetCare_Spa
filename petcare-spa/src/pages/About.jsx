import { Link } from 'react-router-dom'
import { DATA } from '../data/data'

function About() {
  return (
    <>
      <section className="about-hero">
        <div className="about-hero__bg"></div>
        <div className="container about-hero__inner">
          <h1 className="about-hero__title">Về chúng tôi</h1>
          <p className="about-hero__subtitle">Pet Spa & Shop - Nơi thú cưng được yêu thương</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb__list">
              <li className="breadcrumb__item"><Link to="/" className="breadcrumb__link">Trang chủ</Link></li>
              <li className="breadcrumb__item"><span className="breadcrumb__current">Về chúng tôi</span></li>
            </ol>
          </nav>

          <div className="about-content">
            <div className="about-intro">
              <h2>Chào mừng đến với Pet Spa & Shop</h2>
              <p>
                Với hơn 10 năm kinh nghiệm trong lĩnh vực chăm sóc thú cưng, Pet Spa & Shop tự hào là đơn vị tiên phong 
                tại Việt Nam trong việc cung cấp dịch vụ spa cao cấp và sản phẩm chăm sóc thú cưng chất lượng.
              </p>
              <p>
                Chúng tôi cam kết mang đến cho bé cưng của bạn những trải nghiệm tuyệt vời nhất với đội ngũ chuyên gia 
                giàu kinh nghiệm, sản phẩm organic an toàn và dịch vụ tận tâm.
              </p>
            </div>

            <div className="about-features">
              <div className="about-feature">
                <div className="about-feature__icon">
                  <i className="fas fa-award"></i>
                </div>
                <h3>Chứng nhận quốc tế</h3>
                <p>Đội ngũ groomer được đào tạo bài bản với chứng chỉ quốc tế</p>
              </div>
              <div className="about-feature">
                <div className="about-feature__icon">
                  <i className="fas fa-leaf"></i>
                </div>
                <h3>100% Organic</h3>
                <p>Sản phẩm tự nhiên, không hóa chất độc hại</p>
              </div>
              <div className="about-feature">
                <div className="about-feature__icon">
                  <i className="fas fa-heart"></i>
                </div>
                <h3>Tận tâm</h3>
                <p>Chăm sóc từng bé thú cưng như thành viên trong gia đình</p>
              </div>
              <div className="about-feature">
                <div className="about-feature__icon">
                  <i className="fas fa-clock"></i>
                </div>
                <h3>Linh hoạt</h3>
                <p>Đặt lịch online 24/7, hỗ trợ đưa đón tận nơi</p>
              </div>
            </div>

            <div className="about-team">
              <h2>Đội ngũ của chúng tôi</h2>
              <div className="team-grid">
                {DATA.team.map(member => (
                  <div key={member.id} className="team-card">
                    <img src={member.image} alt={member.name} className="team-card__image" />
                    <div className="team-card__content">
                      <h3 className="team-card__name">{member.name}</h3>
                      <p className="team-card__role">{member.role}</p>
                      <p className="team-card__exp">{member.experience} kinh nghiệm</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="about-cta">
              <h2>Bạn đã sẵn sàng đặt lịch?</h2>
              <p>Hãy để chúng tôi chăm sóc bé cưng của bạn</p>
              <div style={{display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px'}}>
                <Link to="/booking" className="btn btn--primary">Đặt lịch ngay</Link>
                <Link to="/contact" className="btn btn--outline">Liên hệ</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default About

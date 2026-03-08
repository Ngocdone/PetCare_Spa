import { Link } from 'react-router-dom'

function Home() {
  return (
    <>
      {/* Hero Modern */}
      <section className="hero-modern">
        <div className="hero-modern__slider">
          <div className="hero-modern__slide active" style={{backgroundImage: "url('https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1920&q=80')"}}>
            <div className="hero-modern__overlay"></div>
          </div>
          <div className="hero-modern__slide" style={{backgroundImage: "url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1920&q=80')"}}>
            <div className="hero-modern__overlay"></div>
          </div>
          <div className="hero-modern__slide" style={{backgroundImage: "url('https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1920&q=80')"}}>
            <div className="hero-modern__overlay"></div>
          </div>
        </div>
        <div className="hero-modern__content">
          <div className="container">
            <div className="hero-modern__text">
              <h1 className="hero-modern__title" data-aos="fade-up">
                Spa & Chăm Sóc<br/>
                <span className="hero-modern__title-highlight">Thú Cưng Chuyên Nghiệp</span>
              </h1>
              <p className="hero-modern__subtitle" data-aos="fade-up" data-aos-delay="100">
                Dịch vụ spa cao cấp, sản phẩm organic an toàn, đội ngũ giàu kinh nghiệm.<br/>
                Thú cưng của bạn xứng đáng được chăm sóc tốt nhất!
              </p>
              <div className="hero-modern__cta" data-aos="fade-up" data-aos-delay="200">
                <Link to="/booking" className="btn-modern btn-modern--primary">
                  <i className="fas fa-calendar-check"></i>
                  <span>Đặt lịch ngay</span>
                </Link>
                <Link to="/shop" className="btn-modern btn-modern--outline">
                  <i className="fas fa-shopping-bag"></i>
                  <span>Xem cửa hàng</span>
                </Link>
              </div>
              <div className="hero-modern__stats" data-aos="fade-up" data-aos-delay="300">
                <div className="hero-stat">
                  <span className="hero-stat__number">5000+</span>
                  <span className="hero-stat__label">Khách hàng</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat__number">4.9★</span>
                  <span className="hero-stat__label">Đánh giá</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat__number">10+</span>
                  <span className="hero-stat__label">Năm kinh nghiệm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-modern__controls">
          <button className="hero-modern__arrow hero-modern__arrow--prev" aria-label="Trước">
            <i className="fas fa-chevron-left"></i>
          </button>
          <button className="hero-modern__arrow hero-modern__arrow--next" aria-label="Sau">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
        <div className="hero-modern__dots">
          <button className="hero-modern__dot active" data-slide="0"></button>
          <button className="hero-modern__dot" data-slide="1"></button>
          <button className="hero-modern__dot" data-slide="2"></button>
        </div>
      </section>

      {/* About Modern + Before/After */}
      <section className="section section--about-modern" id="about">
        <div className="container">
          <div className="about-modern">
            <div className="about-modern__content" data-aos="fade-right">
              <span className="about-modern__badge">Về chúng tôi</span>
              <h2 className="about-modern__title">Chuyên Gia Chăm Sóc<br/>Thú Cưng Hàng Đầu</h2>
              <p className="about-modern__text">
                Pet Spa & Shop tự hào là đơn vị tiên phong trong lĩnh vực chăm sóc thú cưng tại Việt Nam. 
                Với hơn 10 năm kinh nghiệm, chúng tôi cam kết mang đến dịch vụ spa cao cấp, sản phẩm organic 
                an toàn và đội ngũ chuyên gia giàu kinh nghiệm.
              </p>
              <div className="about-modern__features">
                <div className="about-feature">
                  <div className="about-feature__icon">
                    <i className="fas fa-award"></i>
                  </div>
                  <div className="about-feature__content">
                    <h4>Chứng nhận quốc tế</h4>
                    <p>Đội ngũ groomer được đào tạo bài bản</p>
                  </div>
                </div>
                <div className="about-feature">
                  <div className="about-feature__icon">
                    <i className="fas fa-leaf"></i>
                  </div>
                  <div className="about-feature__content">
                    <h4>100% Organic</h4>
                    <p>Sản phẩm an toàn, thân thiện môi trường</p>
                  </div>
                </div>
                <div className="about-feature">
                  <div className="about-feature__icon">
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <div className="about-feature__content">
                    <h4>Bảo hiểm toàn diện</h4>
                    <p>An tâm tuyệt đối cho thú cưng</p>
                  </div>
                </div>
              </div>
              <Link to="/about" className="btn-modern btn-modern--primary">Tìm hiểu thêm</Link>
            </div>
            <div className="about-modern__media" data-aos="fade-left">
              <div className="before-after-slider">
                <div className="before-after-slider__container">
                  <img src="img/sau-spa.jpg" alt="Sau spa" className="before-after-slider__after"/>
                  <img src="img/truoc-spa.jpg" alt="Trước spa" className="before-after-slider__before"/>
                  <input type="range" min="0" max="100" value="50" className="before-after-slider__range" id="beforeAfterRange"/>
                  <div className="before-after-slider__divider" id="beforeAfterDivider">
                    <div className="before-after-slider__handle"></div>
                  </div>
                </div>
                <div className="before-after-slider__labels">
                  <span className="before-after-slider__label before-after-slider__label--before">Trước</span>
                  <span className="before-after-slider__label before-after-slider__label--after">Sau</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Modern */}
      <section className="section section--why-modern">
        <div className="container">
          <div className="section-header-modern" data-aos="fade-up">
            <h2 className="section-title-modern">Tại Sao Chọn Pet Spa & Shop?</h2>
            <p className="section-subtitle-modern">Chúng tôi cam kết mang đến trải nghiệm chăm sóc thú cưng tốt nhất với những giá trị cốt lõi</p>
          </div>
          <div className="why-grid-modern">
            <div className="why-card-modern" data-aos="fade-up" data-aos-delay="0">
              <div className="why-card-modern__image">
                <img src="img/oganic.jpg" alt="Sản phẩm Organic"/>
                <div className="why-card-modern__overlay"></div>
              </div>
              <div className="why-card-modern__content">
                <div className="why-card-modern__icon">
                  <i className="fas fa-leaf"></i>
                </div>
                <h3 className="why-card-modern__title">100% Organic</h3>
                <p className="why-card-modern__desc">Sản phẩm chăm sóc từ thiên nhiên, không hóa chất độc hại, an toàn tuyệt đối cho da lông thú cưng.</p>
              </div>
            </div>
            <div className="why-card-modern" data-aos="fade-up" data-aos-delay="100">
              <div className="why-card-modern__image">
                <img src="img/chuyen-gia-lanh-nghe.jpg" alt="Chuyên gia"/>
                <div className="why-card-modern__overlay"></div>
              </div>
              <div className="why-card-modern__content">
                <div className="why-card-modern__icon">
                  <i className="fas fa-user-md"></i>
                </div>
                <h3 className="why-card-modern__title">Chuyên Gia Lành Nghề</h3>
                <p className="why-card-modern__desc">Đội ngũ Groomer được đào tạo chuyên nghiệp, chứng chỉ quốc tế, hơn 10 năm kinh nghiệm.</p>
              </div>
            </div>
            <div className="why-card-modern" data-aos="fade-up" data-aos-delay="200">
              <div className="why-card-modern__image">
                <img src="img/giam-sat.png" alt="Camera giám sát"/>
                <div className="why-card-modern__overlay"></div>
              </div>
              <div className="why-card-modern__content">
                <div className="why-card-modern__icon">
                  <i className="fas fa-video"></i>
                </div>
                <h3 className="why-card-modern__title">Giám Sát 24/7</h3>
                <p className="why-card-modern__desc">Hệ thống camera HD, theo dõi trực tiếp qua app, yên tâm tuyệt đối cho thú cưng của bạn.</p>
              </div>
            </div>
            <div className="why-card-modern" data-aos="fade-up" data-aos-delay="300">
              <div className="why-card-modern__image">
                <img src="img/dua-don.jpg" alt="Đưa đón"/>
                <div className="why-card-modern__overlay"></div>
              </div>
              <div className="why-card-modern__content">
                <div className="why-card-modern__icon">
                  <i className="fas fa-car"></i>
                </div>
                <h3 className="why-card-modern__title">Đưa Đón Miễn Phí</h3>
                <p className="why-card-modern__desc">Dịch vụ đưa đón tận nơi trong bán kính 5km, tiện lợi và tiết kiệm thời gian cho bạn.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services Carousel */}
      <section className="section section--services">
        <div className="container">
          <h2 className="section__title">Dịch vụ nổi bật</h2>
          <p className="section__subtitle">Cắt tỉa, Tắm, Spa toàn diện, Khách sạn thú cưng.</p>
          <div className="carousel carousel--services" data-carousel>
            <div className="carousel__track" id="servicesTrack">
              {/* Filled by JS from DATA.services */}
            </div>
            <button type="button" className="carousel__arrow carousel__arrow--prev" aria-label="Trước"><i className="fas fa-chevron-left"></i></button>
            <button type="button" className="carousel__arrow carousel__arrow--next" aria-label="Sau"><i className="fas fa-chevron-right"></i></button>
            <div className="carousel__nav" id="servicesNav"></div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section--process">
        <div className="container">
          <h2 className="section__title">Quy trình đơn giản</h2>
          <p className="section__subtitle">4 bước từ đặt lịch đến bàn giao thú cưng.</p>
          <div className="process-grid">
            <div className="process-step">
              <div className="process-step__num">1</div>
              <h3 className="process-step__title">Đặt lịch</h3>
              <p className="process-step__desc">Chọn dịch vụ và ngày giờ phù hợp trên website hoặc hotline.</p>
            </div>
            <div className="process-step">
              <div className="process-step__num">2</div>
              <h3 className="process-step__title">Đưa đón</h3>
              <p className="process-step__desc">Chúng tôi đón thú cưng tại nhà hoặc bạn đưa đến spa.</p>
            </div>
            <div className="process-step">
              <div className="process-step__num">3</div>
              <h3 className="process-step__title">Spa</h3>
              <p className="process-step__desc">Tắm, cắt tỉa, chăm sóc theo gói đã chọn. Bạn xem camera trực tiếp.</p>
            </div>
            <div className="process-step">
              <div className="process-step__num">4</div>
              <h3 className="process-step__title">Bàn giao</h3>
              <p className="process-step__desc">Giao thú cưng tận nhà hoặc đón tại spa, thanh toán.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promo Banner + Countdown */}
      <section className="section section--promo">
        <div className="container">
          <div className="promo-banner">
            <div className="promo-banner__content">
              <h2 className="promo-banner__title">Giảm 20% gói Spa toàn diện</h2>
              <p className="promo-banner__subtitle">Áp dụng đến hết tháng. Đặt lịch ngay!</p>
              <div className="countdown" id="countdown">
                <div className="countdown__item">
                  <span className="countdown__value" id="cdDays">00</span>
                  <span className="countdown__label">Ngày</span>
                </div>
                <div className="countdown__item">
                  <span className="countdown__value" id="cdHours">00</span>
                  <span className="countdown__label">Giờ</span>
                </div>
                <div className="countdown__item">
                  <span className="countdown__value" id="cdMins">00</span>
                  <span className="countdown__label">Phút</span>
                </div>
                <div className="countdown__item">
                  <span className="countdown__value" id="cdSecs">00</span>
                  <span className="countdown__label">Giây</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="section section--products">
        <div className="container">
          <h2 className="section__title">Sản phẩm bán chạy</h2>
          <p className="section__subtitle">Thức ăn, phụ kiện, đồ chơi chất lượng cao.</p>
          <div className="products-grid" id="bestSellersGrid">
            {/* Filled by JS */}
          </div>
          <div className="text-center" style={{marginTop: '1.5rem'}}>
            <Link to="/shop" className="btn btn--primary">Xem tất cả sản phẩm</Link>
          </div>
        </div>
      </section>

      {/* Gallery Modern */}
      <section className="section section--gallery-modern">
        <div className="container">
          <div className="section-header-modern" data-aos="fade-up">
            <h2 className="section-title-modern">Khoảnh Khắc Đáng Yêu</h2>
            <p className="section-subtitle-modern">Những hình ảnh chân thật về thú cưng sau khi được chăm sóc tại Pet Spa & Shop</p>
          </div>
          <div className="gallery-modern" id="galleryModern">
            {/* Filled by JS */}
          </div>
        </div>
      </section>

      {/* Meet The Team */}
      <section className="section section--team">
        <div className="container">
          <h2 className="section__title">Đội ngũ Groomer</h2>
          <p className="section__subtitle">Chuyên nghiệp, tận tâm với từng bé.</p>
          <div className="team-grid" id="teamGrid">
            {/* Filled by JS */}
          </div>
        </div>
      </section>

      {/* Testimonials Modern */}
      <section className="section section--testimonials-modern">
        <div className="container">
          <div className="section-header-modern section-header-modern--compact" data-aos="fade-up">
            <h2 className="section-title-modern">Khách Hàng Nói Gì Về Chúng Tôi</h2>
          </div>
          <div className="testimonials-modern" data-aos="fade-up" data-aos-delay="100">
            <div className="testimonials-modern__track" id="testimonialsModernTrack"></div>
            <div className="testimonials-modern__nav">
              <button className="testimonials-modern__arrow testimonials-modern__arrow--prev">
                <i className="fas fa-chevron-left"></i>
              </button>
              <button className="testimonials-modern__arrow testimonials-modern__arrow--next">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="section section--faq">
        <div className="container">
          <h2 className="section__title">Câu hỏi thường gặp</h2>
          <div className="accordion" id="faqAccordion">
            {/* Filled by JS */}
          </div>
        </div>
      </section>

      {/* Brands Marquee */}
      <section className="section section--brands">
        <div className="brands">
          <div className="brands__track" id="brandsTrack">
            {/* Filled by JS, duplicated for infinite scroll */}
          </div>
        </div>
      </section>
    </>
  )
}

export default Home

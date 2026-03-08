/**
 * Pet Spa & Shop - Home Page
 * Typing effect, Services carousel, Best Sellers, Gallery, Team, Testimonials, FAQ, Countdown, Brands
 */

(function () {
  'use strict';

  const DATA = window.DATA || {};
  const services = DATA.services || [];
  const PRODUCTS_KEY = 'petspa_products';
  function getProducts() {
    try {
      const saved = localStorage.getItem(PRODUCTS_KEY);
      if (saved) return JSON.parse(saved);
      return DATA.products || [];
    } catch (e) {
      return DATA.products || [];
    }
  }
  const products = getProducts();
  const team = DATA.team || [];
  const testimonials = DATA.testimonials || [];
  const faqs = DATA.faqs || [];
  const brands = DATA.brands || [];
  const gallery = DATA.gallery || [];

  // ---------- Typing effect ----------
  function initTyping() {
    const el = document.getElementById('typingText');
    if (!el) return;
    const words = ['chuyên nghiệp', 'tận tâm', 'an toàn', 'thơm mát'];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
      const current = words[wordIndex];
      if (isDeleting) {
        el.textContent = current.substring(0, charIndex - 1);
        charIndex--;
      } else {
        el.textContent = current.substring(0, charIndex + 1);
        charIndex++;
      }
      if (!isDeleting && charIndex === current.length) {
        isDeleting = true;
        setTimeout(type, 2000);
        return;
      }
      if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(type, 300);
        return;
      }
      setTimeout(type, isDeleting ? 80 : 150);
    }
    setTimeout(type, 500);
  }

  // ---------- Format price ----------
  function formatPrice(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  }

  // ---------- Render 5 fixed stars ----------
  function renderStars(rating) {
    const r = Math.min(5, Math.max(0, parseFloat(rating) || 0));
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (r >= i) html += '<i class="fas fa-star card__star card__star--full"></i>';
      else if (r >= i - 0.5) html += '<i class="fas fa-star-half-alt card__star card__star--half"></i>';
      else html += '<i class="far fa-star card__star card__star--empty"></i>';
    }
    return html;
  }

  // ---------- Services Carousel ----------
  function renderServicesCarousel() {
    const track = document.getElementById('servicesTrack');
    const nav = document.getElementById('servicesNav');
    if (!track || !nav) return;

    const featured = services.filter(s => s.featured);
    track.innerHTML = featured.map(s => {
      const dog = s.priceDog ?? s.price;
      const cat = s.priceCat ?? s.price;
      const priceText = (dog != null && cat != null && dog !== cat)
        ? `Từ ${formatPrice(Math.min(dog, cat))}`
        : formatPrice(dog ?? cat ?? s.price ?? 0);
      return `
      <div class="carousel__slide">
        <div class="card card--service">
          <img class="card__image" src="${s.image}" alt="${s.name}">
          <div class="card__body">
            <h3 class="card__title">${s.name}</h3>
            <p class="card__text">${s.description}</p>
            <div class="card__footer">
              <span class="card__price">${priceText}</span>
              <a href="booking.html?service=${s.id}" class="btn btn--primary btn--sm">Đặt lịch</a>
            </div>
          </div>
        </div>
      </div>
    `}).join('');

    let current = 0;
    const total = featured.length;
    const slidesPerView = window.innerWidth >= 992 ? 3 : window.innerWidth >= 576 ? 2 : 1;
    const maxIndex = Math.max(0, total - slidesPerView);

    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      nav.appendChild(dot);
    }

    function goTo(index) {
      current = Math.max(0, Math.min(index, maxIndex));
      const slidesPerViewNow = window.innerWidth >= 992 ? 3 : window.innerWidth >= 576 ? 2 : 1;
      const offset = current * (100 / slidesPerViewNow);
      track.style.transform = `translateX(-${offset}%)`;
      nav.querySelectorAll('.carousel__dot').forEach((d, i) => d.classList.toggle('active', i === current));
    }

    nav.querySelectorAll('.carousel__dot').forEach((dot, i) => {
      dot.addEventListener('click', () => goTo(i));
    });

    const prev = track.closest('.carousel').querySelector('.carousel__arrow--prev');
    const next = track.closest('.carousel').querySelector('.carousel__arrow--next');
    if (prev) prev.addEventListener('click', () => goTo(current - 1));
    if (next) next.addEventListener('click', () => goTo(current + 1));

    // Responsive: recalc on resize
    window.addEventListener('resize', () => {
      const slidesPerViewNew = window.innerWidth >= 992 ? 3 : window.innerWidth >= 576 ? 2 : 1;
      const maxIndexNew = Math.max(0, total - slidesPerViewNew);
      goTo(Math.min(current, maxIndexNew));
    });
  }

  function isOutOfStock(p) {
    if (p.stock === undefined) return false;
    const n = parseInt(p.stock, 10);
    return isNaN(n) || n <= 0;
  }

  function addToCart(item, product) {
    // Check if user is logged in
    const currentUser = window.getCurrentUser ? window.getCurrentUser() : null;
    if (!currentUser) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      window.location.href = 'login.html?return=' + encodeURIComponent(window.location.href);
      return;
    }
    if (product && isOutOfStock(product)) {
      alert('Sản phẩm đã hết hàng.');
      return;
    }
    const cart = window.getCart ? window.getCart() : [];
    const existing = cart.find(i => i.id === item.id);
    const addQty = item.quantity || 1;
    if (product && product.stock !== undefined) {
      const stockNum = parseInt(product.stock, 10);
      if (!isNaN(stockNum)) {
        const inCart = existing ? existing.quantity : 0;
        if (inCart + addQty > stockNum) {
          alert('Chỉ còn ' + stockNum + ' sản phẩm. Trong giỏ: ' + inCart);
          return;
        }
      }
    }
    if (existing) existing.quantity += addQty;
    else cart.push({ ...item, quantity: addQty });
    try {
      localStorage.setItem(window.CART_KEY || 'petspa_cart', JSON.stringify(cart));
      if (window.updateCartBadge) window.updateCartBadge();
      alert('Đã thêm vào giỏ hàng!');
    } catch (e) {
      console.error(e);
    }
  }

  // ---------- Best Sellers ----------
  function renderBestSellers() {
    const grid = document.getElementById('bestSellersGrid');
    if (!grid) return;

    const best = products.filter(p => p.bestSeller).slice(0, 8);
    grid.innerHTML = best.map(p => {
      const discount = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
      const outOfStock = isOutOfStock(p);
      const imgSrc = window.getProductImageSrc ? window.getProductImageSrc(p.image) : (p.image || '');
      const btnHtml = outOfStock
        ? '<span class="btn btn--sm btn--out-of-stock" disabled><i class="fas fa-times-circle"></i> Hết hàng</span>'
        : '<button type="button" class="btn btn--primary btn--sm add-to-cart" data-id="' + p.id + '" data-name="' + p.name + '" data-price="' + p.price + '" data-image="' + (imgSrc || '') + '"><i class="fas fa-cart-plus"></i></button>';
      return `
      <div class="card card--product" ${discount ? `data-discount="${discount}"` : ''}>
        <a href="product-detail.html?id=${p.id}">
          <img class="card__image" src="${imgSrc}" alt="${p.name}">
        </a>
        <div class="card__body">
          <h3 class="card__title"><a href="product-detail.html?id=${p.id}">${p.name}</a></h3>
          <div class="card__rating" title="${p.rating}">${renderStars(p.rating)}</div>
          <div class="card__footer">
            <div class="card__price-wrap">
              <div class="card__price-line">
                <span class="card__price">${formatPrice(p.price)}</span>
                ${p.oldPrice && p.oldPrice > p.price ? `<span class="card__price-old">${formatPrice(p.oldPrice)}</span>` : ''}
              </div>
            </div>
            ${btnHtml}
          </div>
        </div>
      </div>
    `;
    }).join('');

    grid.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', function () {
        const pid = this.dataset.id;
        const product = products.find(x => x.id === pid);
        addToCart({ id: this.dataset.id, name: this.dataset.name, price: parseInt(this.dataset.price, 10), image: this.dataset.image, quantity: 1 }, product);
      });
    });
  }

  // ---------- Gallery Modern ----------
  function renderGallery() {
    const grid = document.getElementById('galleryModern') || document.getElementById('galleryGrid');
    if (!grid) {
      console.log('Gallery grid not found');
      return;
    }

    // Dùng DATA.gallery (đã đồng bộ từ localStorage/admin) hoặc mặc định
    const gallery = (DATA.gallery && DATA.gallery.length) ? DATA.gallery : [
      { id: 'g1', src: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80', title: 'Chó Poodle sau spa', category: 'grooming' },
      { id: 'g2', src: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80', title: 'Chó Golden vui vẻ', category: 'happy' },
      { id: 'g3', src: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80', title: 'Mèo Ba Tư', category: 'cat' },
      { id: 'g4', src: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80', title: 'Chó Corgi đáng yêu', category: 'grooming' },
      { id: 'g5', src: 'https://images.unsplash.com/photo-1581888227599-779811939961?w=800&q=80', title: 'Chăm sóc chuyên nghiệp', category: 'care' },
      { id: 'g6', src: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80', title: 'Mèo sau tắm', category: 'cat' }
    ];

    if (grid.id === 'galleryModern') {
      grid.innerHTML = gallery.map((g, i) => `
        <div class="gallery-modern__item aos-animate" style="animation-delay: ${i * 50}ms">
          <div class="gallery-modern__image">
            <img src="${g.src || ''}" alt="${g.title || ''}" loading="lazy" onerror="this.src='https://via.placeholder.com/800x800?text=Pet+Image'">
            <div class="gallery-modern__overlay">
              <div class="gallery-modern__content">
                <span class="gallery-modern__category">${g.category || ''}</span>
                <h4 class="gallery-modern__title">${g.title || ''}</h4>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    } else if (grid.id === 'galleryGrid') {
      grid.innerHTML = gallery.map(g => `
        <div class="gallery__item">
          <img src="${g.src}" alt="${g.title}" onerror="this.src='https://via.placeholder.com/400x400?text=Pet'">
          <div class="gallery__item-overlay">
            <span class="gallery__item-title">${g.title}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // ---------- Team ----------
  function renderTeam() {
    const grid = document.getElementById('teamGrid');
    if (!grid) return;

    grid.innerHTML = team.map(t => `
      <div class="team-card">
        <img class="team-card__avatar" src="${t.image}" alt="${t.name}">
        <h3 class="team-card__name">${t.name}</h3>
        <p class="team-card__role">${t.role}</p>
        <p class="team-card__exp">${t.experience} kinh nghiệm</p>
      </div>
    `).join('');
  }

  // ---------- Testimonials Modern ----------
  function renderTestimonials() {
    const trackModern = document.getElementById('testimonialsModernTrack');
    const track = document.getElementById('testimonialsTrack');
    const nav = document.getElementById('testimonialsNav');
    
    if (trackModern) {
      // Modern testimonials with real images
      const modernTestimonials = [
        { author: 'Chị Mai Anh', pet: 'Bé Cún - Poodle', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', text: 'Spa xong bé thơm, lông mượt. Nhân viên nhiệt tình, mình rất hài lòng!', rating: 5 },
        { author: 'Anh Hoàng', pet: 'Mèo Tôm - Munchkin', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', text: 'Lần đầu đưa Tôm đi spa, bé hợp tác tốt. Có camera xem trực tiếp, rất yên tâm!', rating: 5 }
      ];
      
      trackModern.innerHTML = modernTestimonials.map(r => `
        <div class="testimonial-modern">
          <div class="testimonial-modern__header">
            <img src="${r.avatar}" alt="${r.author}" class="testimonial-modern__avatar">
            <div class="testimonial-modern__info">
              <h4 class="testimonial-modern__author">${r.author}</h4>
              <p class="testimonial-modern__pet">${r.pet}</p>
            </div>
            <div class="testimonial-modern__stars">${'★'.repeat(r.rating)}</div>
          </div>
          <p class="testimonial-modern__text">"${r.text}"</p>
        </div>
      `).join('');
      
      // Simple slider for modern testimonials
      const prevBtn = document.querySelector('.testimonials-modern__arrow--prev');
      const nextBtn = document.querySelector('.testimonials-modern__arrow--next');
      let currentIndex = 0;
      const items = trackModern.querySelectorAll('.testimonial-modern');
      
      function updateSlider() {
        trackModern.style.transform = `translateX(-${currentIndex * 100}%)`;
      }
      
      if (prevBtn) prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        updateSlider();
      });
      
      if (nextBtn) nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % items.length;
        updateSlider();
      });
      
      return;
    }
    
    if (!track || !nav) return;

    track.innerHTML = testimonials.map(r => `
      <div class="carousel__slide">
        <div class="testimonial-card">
          <img class="testimonial-card__avatar" src="${r.petImage}" alt="${r.pet}">
          <div class="testimonial-card__stars">${'★'.repeat(r.rating)}</div>
          <p class="testimonial-card__text">"${r.text}"</p>
          <p class="testimonial-card__author">${r.author}</p>
          <p class="testimonial-card__pet">Thú cưng: ${r.pet}</p>
        </div>
      </div>
    `).join('');

    let current = 0;
    const total = testimonials.length;
    const perView = window.innerWidth >= 768 ? 2 : 1;
    const maxIndex = Math.max(0, total - perView);

    nav.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot' + (i === 0 ? ' active' : '');
      nav.appendChild(dot);
    }

    function goTo(index) {
      current = Math.max(0, Math.min(index, maxIndex));
      track.style.transform = `translateX(-${(current / total) * 100}%)`;
      nav.querySelectorAll('.carousel__dot').forEach((d, i) => d.classList.toggle('active', i === current));
    }

    nav.querySelectorAll('.carousel__dot').forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

    let interval = setInterval(() => {
      goTo(current + 1);
      if (current >= maxIndex) current = -1;
    }, 4000);
  }

  // ---------- FAQ Accordion ----------
  function renderFAQ() {
    const container = document.getElementById('faqAccordion');
    if (!container) return;

    container.innerHTML = faqs.map((f, i) => `
      <div class="accordion__item ${i === 0 ? 'open' : ''}" data-accordion-item>
        <button type="button" class="accordion__header">
          <span>${f.q}</span>
          <i class="fas fa-chevron-down accordion__icon"></i>
        </button>
        <div class="accordion__body">
          <div class="accordion__content">${f.a}</div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.accordion__item').forEach(item => {
      const header = item.querySelector('.accordion__header');
      const body = item.querySelector('.accordion__body');
      const content = item.querySelector('.accordion__content');
      if (!header || !body) return;
      header.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        container.querySelectorAll('.accordion__item').forEach(el => {
          el.classList.remove('open');
          el.querySelector('.accordion__body').style.maxHeight = '';
        });
        if (!isOpen) {
          item.classList.add('open');
          body.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    });

    const first = container.querySelector('.accordion__item.open');
    if (first) {
      const body = first.querySelector('.accordion__body');
      const content = first.querySelector('.accordion__content');
      if (body && content) body.style.maxHeight = content.scrollHeight + 'px';
    }
  }

  // ---------- Countdown (end of month) ----------
  function initCountdown() {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    function update() {
      const diff = end - new Date();
      if (diff <= 0) {
        document.getElementById('cdDays').textContent = '00';
        document.getElementById('cdHours').textContent = '00';
        document.getElementById('cdMins').textContent = '00';
        document.getElementById('cdSecs').textContent = '00';
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      const d = document.getElementById('cdDays');
      const h = document.getElementById('cdHours');
      const m = document.getElementById('cdMins');
      const s = document.getElementById('cdSecs');
      if (d) d.textContent = String(days).padStart(2, '0');
      if (h) h.textContent = String(hours).padStart(2, '0');
      if (m) m.textContent = String(mins).padStart(2, '0');
      if (s) s.textContent = String(secs).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  // ---------- Brands Marquee ----------
  function renderBrands() {
    const track = document.getElementById('brandsTrack');
    if (!track) return;

    const items = brands.map(b => `<span class="brands__item">${b}</span>`).join('');
    track.innerHTML = items + items;
  }

  // ---------- Newsletter ----------
  function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = form.querySelector('input[name="email"]').value;
      if (email) {
        alert('Cảm ơn bạn đã đăng ký nhận tin! Chúng tôi sẽ gửi tin khuyến mãi đến ' + email);
        form.reset();
      }
    });
  }

  // ---------- Hero Modern Slider ----------
  function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-modern__slide');
    const dots = document.querySelectorAll('.hero-modern__dot');
    const prevBtn = document.querySelector('.hero-modern__arrow--prev');
    const nextBtn = document.querySelector('.hero-modern__arrow--next');
    
    if (!slides || slides.length === 0) return;
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    function goToSlide(index) {
      slides.forEach(s => s.classList.remove('active'));
      if (dots && dots.length) {
        dots.forEach(d => d.classList.remove('active'));
      }
      
      currentSlide = (index + totalSlides) % totalSlides;
      if (slides[currentSlide]) slides[currentSlide].classList.add('active');
      if (dots && dots[currentSlide]) dots[currentSlide].classList.add('active');
    }
    
    function nextSlide() {
      goToSlide(currentSlide + 1);
    }
    
    function prevSlide() {
      goToSlide(currentSlide - 1);
    }
    
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    
    if (dots && dots.length) {
      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
      });
    }
    
    // Auto slide
    if (totalSlides > 1) {
      setInterval(nextSlide, 5000);
    }
  }

  // ---------- Before/After Slider ----------
  function initBeforeAfterSlider() {
    const range = document.getElementById('beforeAfterRange');
    const beforeImg = document.querySelector('.before-after-slider__before');
    const divider = document.getElementById('beforeAfterDivider');
    
    if (!range || !beforeImg || !divider) return;
    
    range.addEventListener('input', function() {
      const value = this.value;
      beforeImg.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
      divider.style.left = value + '%';
    });
  }

  // ---------- AOS Animation ----------
  function initAOS() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
        }
      });
    }, observerOptions);
    
    document.querySelectorAll('[data-aos]').forEach(el => {
      observer.observe(el);
    });
  }

  // ---------- Init ----------
  function init() {
    try { initHeroSlider(); } catch(e) { console.error('initHeroSlider error:', e); }
    try { initBeforeAfterSlider(); } catch(e) { console.error('initBeforeAfterSlider error:', e); }
    try { initAOS(); } catch(e) { console.error('initAOS error:', e); }
    try { initTyping(); } catch(e) { console.error('initTyping error:', e); }
    try { renderServicesCarousel(); } catch(e) { console.error('renderServicesCarousel error:', e); }
    try { renderBestSellers(); } catch(e) { console.error('renderBestSellers error:', e); }
    try { renderGallery(); } catch(e) { console.error('renderGallery error:', e); }
    try { renderTeam(); } catch(e) { console.error('renderTeam error:', e); }
    try { renderTestimonials(); } catch(e) { console.error('renderTestimonials error:', e); }
    try { renderFAQ(); } catch(e) { console.error('renderFAQ error:', e); }
    try { initCountdown(); } catch(e) { console.error('initCountdown error:', e); }
    try { renderBrands(); } catch(e) { console.error('renderBrands error:', e); }
    try { initNewsletter(); } catch(e) { console.error('initNewsletter error:', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

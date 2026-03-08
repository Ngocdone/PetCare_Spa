/**
 * Pet Spa & Shop - Services Page (Modern)
 * Phân loại Chó/Mèo, giá khác nhau theo từng loại
 */
(function () {
  'use strict';
  const DATA = window.DATA || {};
  let services = DATA.services || [];

  const categoryIcons = {
    grooming: 'fa-scissors',
    bath: 'fa-shower',
    spa: 'fa-spa',
    hotel: 'fa-hotel',
    care: 'fa-tooth',
    default: 'fa-paw'
  };

  function formatPrice(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  }

  function getIcon(category) {
    return categoryIcons[category] || categoryIcons.default;
  }

  function getPrice(s, petType) {
    if (petType === 'dog' && (s.priceDog != null)) return s.priceDog;
    if (petType === 'cat' && (s.priceCat != null)) return s.priceCat;
    if (s.price != null) return s.price;
    return s.priceDog || s.priceCat || 0;
  }

  function filterByPet(list, pet) {
    if (pet === 'all') return list;
    return list.filter(s => {
      const pt = s.petType || 'both';
      if (pet === 'dog') return pt === 'both' || pt === 'cho' || pt === 'dog';
      if (pet === 'cat') return pt === 'both' || pt === 'meo' || pt === 'cat';
      return pt === pet || pt === 'both';
    });
  }

  function renderPrice(s, petFilter) {
    const hasDog = s.priceDog != null || s.price != null;
    const hasCat = s.priceCat != null || s.price != null;
    if (petFilter === 'dog' && hasDog) {
      return formatPrice(s.priceDog ?? s.price);
    }
    if (petFilter === 'cat' && hasCat) {
      return formatPrice(s.priceCat ?? s.price);
    }
    if (hasDog && hasCat && (s.priceDog !== s.priceCat)) {
      return `<span class="service-card__price-row">
        <span><i class="fas fa-dog"></i> ${formatPrice(s.priceDog ?? s.price)}</span>
        <span><i class="fas fa-cat"></i> ${formatPrice(s.priceCat ?? s.price)}</span>
      </span>`;
    }
    return formatPrice(s.price ?? s.priceDog ?? s.priceCat);
  }

  function render(petFilter) {
    const list = document.getElementById('servicesList');
    if (!list) return;
    petFilter = petFilter || 'all';
    services = DATA.services || [];
    const filtered = filterByPet(services, petFilter);
    list.innerHTML = filtered.map(s => {
      const duration = s.unit ? `${s.duration} ${s.unit}` : `${s.duration} phút`;
      const icon = getIcon(s.category);
      const featured = s.featured ? ' data-featured="true"' : '';
      const priceHtml = renderPrice(s, petFilter);
      const petParam = petFilter !== 'all' ? '&pet=' + petFilter : '';
      return `
        <article class="service-card" id="${s.category}"${featured} data-pet-type="${s.petType || 'both'}">
          <div class="service-card__image-wrap">
            <img class="service-card__image" src="${s.image}" alt="${s.name}" loading="lazy">
            <span class="service-card__duration"><i class="fas fa-clock"></i> ${duration}</span>
            <span class="service-card__icon"><i class="fas ${icon}"></i></span>
          </div>
          <div class="service-card__body">
            <h2 class="service-card__title">${s.name}</h2>
            <p class="service-card__desc">${s.description}</p>
            <div class="service-card__price">${priceHtml}</div>
            <a href="booking.html?service=${s.id}${petParam}" class="btn btn--primary service-card__cta"><i class="fas fa-calendar-check"></i> Đặt lịch</a>
          </div>
        </article>
      `;
    }).join('');
  }

  function initFilter() {
    const filter = document.getElementById('servicesFilter');
    if (!filter) return;
    filter.querySelectorAll('.services-filter__btn').forEach(btn => {
      btn.addEventListener('click', function () {
        filter.querySelectorAll('.services-filter__btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        render(this.dataset.pet);
      });
    });
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const petParam = params.get('pet');
    const petFilter = (petParam === 'dog' || petParam === 'cat') ? petParam : 'all';
    if (petFilter !== 'all') {
      document.querySelectorAll('.services-filter__btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.pet === petFilter);
      });
    }
    render(petFilter);
    initFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

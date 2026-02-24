/**
 * Pet Spa & Shop - Shop Page
 * Filter by category, price; search; add to cart
 */

(function () {
  'use strict';

  const DATA = window.DATA || {};
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
  
  let products = getProducts();
  const categories = DATA.productCategories || [{ id: 'all', name: 'Tất cả' }];
  const PER_PAGE = 9;
  let currentPage = 1;
  let filteredResult = [];

  function formatPrice(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  }

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

  function isOutOfStock(p) {
    if (p.stock === undefined) return false;
    const n = parseInt(p.stock, 10);
    return isNaN(n) || n <= 0;
  }

  function addToCart(item, product) {
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

  function renderProducts(list) {
    const grid = document.getElementById('shopGrid');
    const empty = document.getElementById('shopEmpty');
    const resultsEl = document.getElementById('shopResults');
    if (!grid) return;

    if (!list.length) {
      grid.innerHTML = '';
      if (empty) empty.classList.add('is-visible');
      if (resultsEl) resultsEl.textContent = '';
      const paginationEl = document.getElementById('shopPagination');
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }
    if (empty) empty.classList.remove('is-visible');

    grid.innerHTML = list.map(p => {
      const discount = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
      const outOfStock = isOutOfStock(p);
      const btnHtml = outOfStock
        ? '<span class="btn btn--sm btn--out-of-stock" disabled><i class="fas fa-times-circle"></i> Hết hàng</span>'
        : '<button type="button" class="btn btn--primary btn--sm add-to-cart" data-id="' + p.id + '" data-name="' + p.name + '" data-price="' + p.price + '" data-image="' + (p.image || '') + '"><i class="fas fa-cart-plus"></i></button>';
      return `
      <div class="card card--product" ${discount ? `data-discount="${discount}"` : ''}>
        <a href="product-detail.html?id=${p.id}">
          <img class="card__image" src="${p.image}" alt="${p.name}">
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
        const product = products.find(function (x) { return x.id === pid; }) || list.find(function (x) { return x.id === pid; });
        addToCart({
          id: this.dataset.id,
          name: this.dataset.name,
          price: parseInt(this.dataset.price, 10),
          image: this.dataset.image,
          quantity: 1
        }, product);
      });
    });
  }

  /** Loại thú cưng đang chọn: all | cho | meo (multi: cho + meo) */
  function getSelectedPetTypes() {
    const links = document.querySelectorAll('#sidebarPetType .shop-sidebar__link.active');
    const ids = [];
    links.forEach(function (el) {
      const id = el.getAttribute('data-pet');
      if (id) ids.push(id);
    });
    if (ids.length === 0) return ['all'];
    return ids;
  }

  /** Danh mục sản phẩm đang chọn: all | thuc-an | cham-soc | phu-kien | do-choi (multi) */
  function getSelectedProductCategories() {
    const links = document.querySelectorAll('#sidebarProductCat .shop-sidebar__link.active');
    const ids = [];
    links.forEach(function (el) {
      const id = el.getAttribute('data-category');
      if (id) ids.push(id);
    });
    if (ids.length === 0) return ['all'];
    return ids;
  }

  /** Khoảng giá đang chọn (multi) */
  function getSelectedPriceRanges() {
    const links = document.querySelectorAll('#sidebarPrice .shop-sidebar__link.active');
    const ids = [];
    links.forEach(function (el) {
      const id = el.getAttribute('data-price');
      if (id) ids.push(id);
    });
    if (ids.length === 0) return ['all'];
    return ids;
  }

  /** Sản phẩm p có thuộc loại thú cưng (cho/meo) đã chọn không */
  function productMatchesPetTypes(p, selectedPetTypes) {
    if (selectedPetTypes.indexOf('all') >= 0 || selectedPetTypes.length === 0) return true;
    const pt = p.petType || 'both';
    if (pt === 'both') return true;
    return selectedPetTypes.indexOf(pt) >= 0;
  }

  /** Sản phẩm p có thuộc danh mục sản phẩm đã chọn không */
  function productMatchesProductCategories(p, selectedCats) {
    if (selectedCats.indexOf('all') >= 0 || selectedCats.length === 0) return true;
    const pc = p.category || '';
    return selectedCats.indexOf(pc) >= 0;
  }

  function productMatchesPriceRange(p, rangeId) {
    if (rangeId === 'all') return true;
    const parts = rangeId.split('-');
    const min = parts[0] ? parseInt(parts[0].replace(/\D/g, ''), 10) : null;
    const max = parts[1] ? parseInt(parts[1].replace(/\D/g, ''), 10) : null;
    if (min != null && p.price < min) return false;
    if (max != null && max > 0 && p.price > max) return false;
    return true;
  }

  function getSortOrder() {
    return (document.getElementById('shopSort')?.value) || 'default';
  }

  function renderPagination(totalPages, totalItems) {
    const paginationEl = document.getElementById('shopPagination');
    const resultsEl = document.getElementById('shopResults');
    if (!paginationEl) return;

    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      if (resultsEl) resultsEl.textContent = totalItems + ' sản phẩm';
      return;
    }

    if (resultsEl) resultsEl.textContent = totalItems + ' sản phẩm (trang ' + currentPage + '/' + totalPages + ')';

    let html = '<div class="shop-pagination__inner">';
    html += '<button type="button" class="shop-pagination__btn shop-pagination__prev" ' + (currentPage === 1 ? 'disabled' : '') + ' aria-label="Trang trước"><i class="fas fa-chevron-left"></i></button>';
    html += '<div class="shop-pagination__pages">';
    for (let i = 1; i <= totalPages; i++) {
      const active = i === currentPage ? ' shop-pagination__page--active' : '';
      html += '<button type="button" class="shop-pagination__page' + active + '" data-page="' + i + '">' + i + '</button>';
    }
    html += '</div>';
    html += '<button type="button" class="shop-pagination__btn shop-pagination__next" ' + (currentPage === totalPages ? 'disabled' : '') + ' aria-label="Trang sau"><i class="fas fa-chevron-right"></i></button>';
    html += '</div>';
    paginationEl.innerHTML = html;

    paginationEl.querySelectorAll('.shop-pagination__page').forEach(btn => {
      btn.addEventListener('click', function () {
        currentPage = parseInt(this.dataset.page, 10);
        renderPage();
      });
    });
    paginationEl.querySelector('.shop-pagination__prev')?.addEventListener('click', function () {
      if (currentPage > 1) {
        currentPage--;
        renderPage();
      }
    });
    paginationEl.querySelector('.shop-pagination__next')?.addEventListener('click', function () {
      if (currentPage < totalPages) {
        currentPage++;
        renderPage();
      }
    });
  }

  function renderPage() {
    const totalPages = Math.ceil(filteredResult.length / PER_PAGE);
    const start = (currentPage - 1) * PER_PAGE;
    const slice = filteredResult.slice(start, start + PER_PAGE);
    renderProducts(slice);
    renderPagination(totalPages, filteredResult.length);
  }

  function filterProducts() {
    products = getProducts();
    const search = (document.getElementById('shopSearch')?.value || '').toLowerCase().trim();
    const selectedPets = getSelectedPetTypes();
    const selectedCats = getSelectedProductCategories();
    const selectedPrices = getSelectedPriceRanges();
    const sortOrder = getSortOrder();
    let result = products.filter(function (p) {
      const matchSearch = !search || p.name.toLowerCase().includes(search) || (p.description && p.description.toLowerCase().includes(search));
      const matchPet = productMatchesPetTypes(p, selectedPets);
      const matchCat = productMatchesProductCategories(p, selectedCats);
      const matchPrice = selectedPrices.indexOf('all') >= 0 || selectedPrices.some(function (id) { return productMatchesPriceRange(p, id); });
      return matchSearch && matchPet && matchCat && matchPrice;
    });

    if (sortOrder === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortOrder === 'price-desc') result.sort((a, b) => b.price - a.price);

    filteredResult = result;
    currentPage = 1;
    renderPage();
  }

  function countForPet(petId) {
    if (petId === 'all') return products.length;
    return products.filter(function (p) {
      const pt = p.petType || 'both';
      return pt === petId || pt === 'both';
    }).length;
  }

  function countForProductCategory(catId, selectedPetTypes) {
    if (catId === 'all') {
      if (selectedPetTypes.indexOf('all') >= 0 || selectedPetTypes.length === 0) return products.length;
      return products.filter(function (p) { return productMatchesPetTypes(p, selectedPetTypes); }).length;
    }
    return products.filter(function (p) {
      if (p.category !== catId) return false;
      return productMatchesPetTypes(p, selectedPetTypes);
    }).length;
  }

  function getProductCategoryList() {
    var cats = DATA.productCategories || [];
    var seen = {};
    var list = [{ id: 'all', name: 'Tất cả', icon: 'fa-layer-group' }];
    cats.forEach(function (c) {
      if (c.category && !seen[c.category]) {
        seen[c.category] = true;
        list.push({ id: c.category, name: c.name, icon: c.icon || 'fa-tag' });
      }
    });
    return list;
  }

  function fillSidebarPetTypes() {
    var ul = document.getElementById('sidebarPetType');
    if (!ul) return;
    products = getProducts();
    var petOptions = [{ id: 'all', name: 'Tất cả', icon: 'fa-layer-group' }, { id: 'cho', name: 'Chó', icon: 'fa-dog' }, { id: 'meo', name: 'Mèo', icon: 'fa-cat' }];
    ul.innerHTML = '';
    petOptions.forEach(function (opt) {
      var count = countForPet(opt.id);
      var icon = opt.icon ? '<i class="fas ' + opt.icon + ' shop-sidebar__icon"></i>' : '';
      var countBadge = count > 0 ? '<span class="shop-sidebar__count">' + count + '</span>' : '';
      var activeClass = opt.id === 'all' ? ' active' : '';
      var li = document.createElement('li');
      li.innerHTML = '<a href="#" class="shop-sidebar__link' + activeClass + '" data-pet="' + opt.id + '" title="Loại thú cưng">' +
        '<span class="shop-sidebar__check"><i class="fas fa-check"></i></span>' + icon +
        '<span class="shop-sidebar__link-inner"><span class="shop-sidebar__link-text">' + opt.name + '</span></span>' + countBadge + '</a>';
      ul.appendChild(li);
    });
  }

  function fillSidebarProductCategories() {
    var ul = document.getElementById('sidebarProductCat');
    if (!ul) return;
    products = getProducts();
    var selectedPets = getSelectedPetTypes();
    var list = getProductCategoryList();
    ul.innerHTML = '';
    list.forEach(function (opt) {
      var count = countForProductCategory(opt.id, selectedPets);
      var icon = opt.icon ? '<i class="fas ' + opt.icon + ' shop-sidebar__icon"></i>' : '';
      var countBadge = count > 0 ? '<span class="shop-sidebar__count">' + count + '</span>' : '';
      var activeClass = opt.id === 'all' ? ' active' : '';
      var li = document.createElement('li');
      li.innerHTML = '<a href="#" class="shop-sidebar__link' + activeClass + '" data-category="' + opt.id + '" title="Danh mục">' +
        '<span class="shop-sidebar__check"><i class="fas fa-check"></i></span>' + icon +
        '<span class="shop-sidebar__link-inner"><span class="shop-sidebar__link-text">' + opt.name + '</span></span>' + countBadge + '</a>';
      ul.appendChild(li);
    });
  }

  function fillMobileChips() {
    var container = document.getElementById('shopMobileChips');
    if (!container || !window.matchMedia('(max-width: 991px)').matches) return;
    var mainCats = [{ id: 'all', name: 'Tất cả' }, { id: 'cho', name: 'Chó' }, { id: 'meo', name: 'Mèo' }];
    container.innerHTML = mainCats.map(function (c) {
      return '<button type="button" class="shop-chip' + (c.id === 'all' ? ' active' : '') + '" data-pet="' + c.id + '">' + c.name + '</button>';
    }).join('');
    container.querySelectorAll('.shop-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.dataset.pet;
        var petLinks = document.querySelectorAll('#sidebarPetType .shop-sidebar__link');
        if (id === 'all') {
          petLinks.forEach(function (l) { l.classList.remove('active'); });
          var allLink = document.querySelector('#sidebarPetType .shop-sidebar__link[data-pet="all"]');
          if (allLink) allLink.classList.add('active');
        } else {
          document.querySelectorAll('#sidebarPetType .shop-sidebar__link[data-pet="all"]').forEach(function (l) { l.classList.remove('active'); });
          var link = document.querySelector('#sidebarPetType .shop-sidebar__link[data-pet="' + id + '"]');
          if (link) link.classList.toggle('active');
        }
        fillSidebarProductCategories();
        syncMobileChipsFromSidebar();
        filterProducts();
        updateFilterCount();
      });
    });
  }

  function fillFilterSheet() {
    var petEl = document.getElementById('sheetPetType');
    var catEl = document.getElementById('sheetProductCat');
    var priceEl = document.getElementById('sheetPrice');
    if (!petEl || !catEl || !priceEl) return;
    var petOptions = [{ id: 'all', name: 'Tất cả' }, { id: 'cho', name: 'Chó' }, { id: 'meo', name: 'Mèo' }];
    petEl.innerHTML = petOptions.map(function (o) {
      return '<button type="button" class="shop-sheet-chip" data-pet="' + o.id + '"><span class="shop-sheet-chip__check"><i class="fas fa-check"></i></span>' + o.name + '</button>';
    }).join('');
    var productList = getProductCategoryList();
    catEl.innerHTML = productList.map(function (o) {
      return '<button type="button" class="shop-sheet-chip" data-category="' + o.id + '"><span class="shop-sheet-chip__check"><i class="fas fa-check"></i></span>' + o.name + '</button>';
    }).join('');
    var priceOptions = [
      { id: 'all', label: 'Tất cả giá' },
      { id: '0-100000', label: 'Dưới 100.000₫' },
      { id: '100000-200000', label: '100.000 - 200.000₫' },
      { id: '200000-500000', label: '200.000 - 500.000₫' },
      { id: '500000-', label: 'Trên 500.000₫' }
    ];
    priceEl.innerHTML = priceOptions.map(function (p) {
      return '<button type="button" class="shop-sheet-chip" data-price="' + p.id + '"><span class="shop-sheet-chip__check"><i class="fas fa-check"></i></span>' + p.label + '</button>';
    }).join('');
  }

  function syncSheetFromSidebar() {
    var petIds = getSelectedPetTypes();
    var catIds = getSelectedProductCategories();
    var priceIds = getSelectedPriceRanges();
    document.querySelectorAll('#sheetPetType .shop-sheet-chip[data-pet]').forEach(function (b) {
      b.classList.toggle('active', petIds.indexOf(b.dataset.pet) >= 0);
    });
    document.querySelectorAll('#sheetProductCat .shop-sheet-chip[data-category]').forEach(function (b) {
      b.classList.toggle('active', catIds.indexOf(b.dataset.category) >= 0);
    });
    document.querySelectorAll('#sheetPrice .shop-sheet-chip[data-price]').forEach(function (b) {
      b.classList.toggle('active', priceIds.indexOf(b.dataset.price) >= 0);
    });
  }

  function openFilterSheet() {
    var sheet = document.getElementById('shopFilterSheet');
    var overlay = document.getElementById('shopFilterOverlay');
    if (!sheet || !overlay) return;
    syncSheetFromSidebar();
    sheet.classList.add('is-open');
    overlay.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    document.getElementById('shopFilterBtn').setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeFilterSheet() {
    var sheet = document.getElementById('shopFilterSheet');
    var overlay = document.getElementById('shopFilterOverlay');
    if (!sheet || !overlay) return;
    sheet.classList.remove('is-open');
    overlay.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    document.getElementById('shopFilterBtn').setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function initFilterSheet() {
    fillFilterSheet();
    fillMobileChips();
    var btn = document.getElementById('shopFilterBtn');
    var overlay = document.getElementById('shopFilterOverlay');
    var closeBtn = document.getElementById('shopFilterClose');
    var applyBtn = document.getElementById('shopFilterApply');
    var priceEl = document.getElementById('sheetPrice');

    if (btn) btn.addEventListener('click', function () {
      if (window.matchMedia('(max-width: 991px)').matches) openFilterSheet();
    });
    if (overlay) overlay.addEventListener('click', closeFilterSheet);
    if (closeBtn) closeBtn.addEventListener('click', closeFilterSheet);
    if (applyBtn) applyBtn.addEventListener('click', function () {
        document.querySelectorAll('#sidebarPetType .shop-sidebar__link').forEach(function (l) { l.classList.remove('active'); });
        document.querySelectorAll('#sidebarProductCat .shop-sidebar__link').forEach(function (l) { l.classList.remove('active'); });
        document.querySelectorAll('#sidebarPrice .shop-sidebar__link').forEach(function (l) { l.classList.remove('active'); });
        document.querySelectorAll('#sheetPetType .shop-sheet-chip.active[data-pet]').forEach(function (chip) {
          var link = document.querySelector('#sidebarPetType .shop-sidebar__link[data-pet="' + chip.dataset.pet + '"]');
          if (link) link.classList.add('active');
        });
        document.querySelectorAll('#sheetProductCat .shop-sheet-chip.active[data-category]').forEach(function (chip) {
          var link = document.querySelector('#sidebarProductCat .shop-sidebar__link[data-category="' + chip.dataset.category + '"]');
          if (link) link.classList.add('active');
        });
        document.querySelectorAll('#sheetPrice .shop-sheet-chip.active[data-price]').forEach(function (chip) {
          var plink = document.querySelector('#sidebarPrice .shop-sidebar__link[data-price="' + chip.dataset.price + '"]');
          if (plink) plink.classList.add('active');
        });
        fillSidebarProductCategories();
        syncMobileChipsFromSidebar();
        filterProducts();
        updateFilterCount();
        closeFilterSheet();
      });
    var petEl = document.getElementById('sheetPetType');
    var catEl = document.getElementById('sheetProductCat');
    if (petEl) petEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.shop-sheet-chip[data-pet]');
      if (!chip) return;
      if (chip.dataset.pet === 'all') {
        petEl.querySelectorAll('.shop-sheet-chip[data-pet]').forEach(function (b) { b.classList.remove('active'); });
        chip.classList.add('active');
      } else {
        petEl.querySelectorAll('.shop-sheet-chip[data-pet="all"]').forEach(function (b) { b.classList.remove('active'); });
        chip.classList.toggle('active');
      }
    });
    if (catEl) catEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.shop-sheet-chip[data-category]');
      if (!chip) return;
      if (chip.dataset.category === 'all') {
        catEl.querySelectorAll('.shop-sheet-chip[data-category]').forEach(function (b) { b.classList.remove('active'); });
        chip.classList.add('active');
      } else {
        catEl.querySelectorAll('.shop-sheet-chip[data-category="all"]').forEach(function (b) { b.classList.remove('active'); });
        chip.classList.toggle('active');
      }
    });
    if (priceEl) priceEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.shop-sheet-chip[data-price]');
      if (!chip) return;
      if (chip.dataset.price === 'all') {
        priceEl.querySelectorAll('.shop-sheet-chip[data-price]').forEach(function (b) { b.classList.remove('active'); });
        chip.classList.add('active');
      } else {
        priceEl.querySelectorAll('.shop-sheet-chip[data-price="all"]').forEach(function (b) { b.classList.remove('active'); });
        chip.classList.toggle('active');
      }
    });
  }

  function updateFilterCount() {
    var petIds = getSelectedPetTypes();
    var catIds = getSelectedProductCategories();
    var priceIds = getSelectedPriceRanges();
    var count = 0;
    if (petIds.length && petIds.indexOf('all') < 0) count += petIds.length;
    if (catIds.length && catIds.indexOf('all') < 0) count += catIds.length;
    if (priceIds.length && priceIds.indexOf('all') < 0) count += priceIds.length;
    var el = document.getElementById('shopFilterCount');
    if (el) {
      el.textContent = count || '';
      el.style.display = count ? 'flex' : 'none';
    }
  }

  function syncMobileChipsFromSidebar() {
    var petIds = getSelectedPetTypes();
    var container = document.getElementById('shopMobileChips');
    if (!container) return;
    var allChip = container.querySelector('.shop-chip[data-pet="all"]');
    var choChip = container.querySelector('.shop-chip[data-pet="cho"]');
    var meoChip = container.querySelector('.shop-chip[data-pet="meo"]');
    if (petIds.indexOf('all') >= 0 || petIds.length === 0) {
      if (allChip) allChip.classList.add('active');
      if (choChip) choChip.classList.remove('active');
      if (meoChip) meoChip.classList.remove('active');
    } else {
      if (allChip) allChip.classList.remove('active');
      if (choChip) choChip.classList.toggle('active', petIds.indexOf('cho') >= 0);
      if (meoChip) meoChip.classList.toggle('active', petIds.indexOf('meo') >= 0);
    }
  }

  function init() {
    fillSidebarPetTypes();
    fillSidebarProductCategories();
    initFilterSheet();

    var sidebar = document.getElementById('shopSidebar');
    if (window.matchMedia('(min-width: 992px)').matches) {
      if (sidebar) sidebar.classList.add('is-open');
    } else {
      if (sidebar) sidebar.classList.remove('is-open');
    }

    var params = new URLSearchParams(window.location.search);
    var urlPet = params.get('petType');
    var urlCat = params.get('category');
    if (urlPet === 'cho' || urlPet === 'meo') {
      document.querySelectorAll('#sidebarPetType .shop-sidebar__link').forEach(function (l) { l.classList.remove('active'); });
      var petLink = document.querySelector('#sidebarPetType .shop-sidebar__link[data-pet="' + urlPet + '"]');
      if (petLink) petLink.classList.add('active');
    }
    if (urlCat && ['thuc-an', 'cham-soc', 'phu-kien', 'do-choi'].indexOf(urlCat) >= 0) {
      document.querySelectorAll('#sidebarProductCat .shop-sidebar__link').forEach(function (l) { l.classList.remove('active'); });
      var catLink = document.querySelector('#sidebarProductCat .shop-sidebar__link[data-category="' + urlCat + '"]');
      if (catLink) catLink.classList.add('active');
    }
    fillSidebarProductCategories();
    syncMobileChipsFromSidebar();
    updateFilterCount();
    filterProducts();

    document.getElementById('shopSearch')?.addEventListener('input', filterProducts);
    document.getElementById('shopSearch')?.addEventListener('search', filterProducts);
    document.getElementById('shopSort')?.addEventListener('change', filterProducts);

    document.querySelectorAll('#sidebarPetType .shop-sidebar__link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var petId = this.dataset.pet;
        if (petId === 'all') {
          document.querySelectorAll('#sidebarPetType .shop-sidebar__link').forEach(function (l) { l.classList.remove('active'); });
          this.classList.add('active');
        } else {
          document.querySelectorAll('#sidebarPetType .shop-sidebar__link[data-pet="all"]').forEach(function (l) { l.classList.remove('active'); });
          this.classList.toggle('active');
        }
        fillSidebarProductCategories();
        syncMobileChipsFromSidebar();
        filterProducts();
        updateFilterCount();
      });
    });

    /* Event delegation - links bị thay thế khi fillSidebarProductCategories() chạy lại */
    var productCatUl = document.getElementById('sidebarProductCat');
    if (productCatUl) {
      productCatUl.addEventListener('click', function (e) {
        var link = e.target.closest('.shop-sidebar__link[data-category]');
        if (!link) return;
        e.preventDefault();
        var catId = link.dataset.category;
        if (catId === 'all') {
          productCatUl.querySelectorAll('.shop-sidebar__link').forEach(function (l) { l.classList.remove('active'); });
          link.classList.add('active');
        } else {
          productCatUl.querySelectorAll('.shop-sidebar__link[data-category="all"]').forEach(function (l) { l.classList.remove('active'); });
          link.classList.toggle('active');
        }
        filterProducts();
        updateFilterCount();
      });
    }

    document.querySelectorAll('#sidebarPrice .shop-sidebar__link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var priceId = this.dataset.price;
        if (priceId === 'all') {
          document.querySelectorAll('#sidebarPrice .shop-sidebar__link').forEach(function (l) { l.classList.remove('active'); });
          this.classList.add('active');
        } else {
          document.querySelectorAll('#sidebarPrice .shop-sidebar__link[data-price="all"]').forEach(function (l) { l.classList.remove('active'); });
          this.classList.toggle('active');
        }
        filterProducts();
        updateFilterCount();
      });
    });

    updateFilterCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

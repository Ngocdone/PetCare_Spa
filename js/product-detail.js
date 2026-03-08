/**
 * Pet Spa & Shop - Product Detail Page
 * Breadcrumb, gallery, info, tabs (Mô tả, Thông tin, Đánh giá), related products
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
  const products = getProducts();

  var categoryLabels = {
    'cham-soc': 'Chăm sóc',
    'thuc-an': 'Thức ăn',
    'phu-kien': 'Phụ kiện',
    'do-choi': 'Đồ chơi'
  };

  function formatPrice(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  }

  function renderStars(rating) {
    var r = Math.min(5, Math.max(0, parseFloat(rating) || 0));
    var html = '';
    for (var i = 1; i <= 5; i++) {
      if (r >= i) html += '<i class="fas fa-star card__star card__star--full"></i>';
      else if (r >= i - 0.5) html += '<i class="fas fa-star-half-alt card__star card__star--half"></i>';
      else html += '<i class="far fa-star card__star card__star--empty"></i>';
    }
    return html;
  }

  function getProductId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id') || '';
  }

  function getProduct(id) {
    return products.find(function (p) { return p.id === id; });
  }

  function isOutOfStock(p) {
    if (!p || p.stock === undefined) return false;
    var n = parseInt(p.stock, 10);
    return isNaN(n) || n <= 0;
  }

  function addToCart(item, product) {
<<<<<<< HEAD
    // Check if user is logged in
    var currentUser = window.getCurrentUser ? window.getCurrentUser() : null;
    if (!currentUser) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      window.location.href = 'login.html?return=' + encodeURIComponent(window.location.href);
      return;
    }
=======
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    if (product && isOutOfStock(product)) {
      alert('Sản phẩm đã hết hàng.');
      return;
    }
    var cart = window.getCart ? window.getCart() : [];
    var existing = cart.find(function (i) { return i.id === item.id; });
    var addQty = item.quantity || 1;
    if (product && product.stock !== undefined) {
      var stockNum = parseInt(product.stock, 10);
      if (!isNaN(stockNum)) {
        var inCart = existing ? existing.quantity : 0;
        if (inCart + addQty > stockNum) {
          alert('Chỉ còn ' + stockNum + ' sản phẩm. Trong giỏ: ' + inCart);
          return;
        }
      }
    }
    if (existing) existing.quantity += addQty;
    else cart.push({ id: item.id, name: item.name, price: item.price, image: item.image, quantity: addQty });
    try {
      localStorage.setItem(window.CART_KEY || 'petspa_cart', JSON.stringify(cart));
      if (window.updateCartBadge) window.updateCartBadge();
      alert('Đã thêm vào giỏ hàng!');
    } catch (e) {
      console.error(e);
    }
  }

  function renderBreadcrumb(product) {
    var breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;
    var catLabel = categoryLabels[product.category] || product.category || 'Sản phẩm';
    breadcrumb.innerHTML = '<ol class="breadcrumb__list">' +
      '<li class="breadcrumb__item"><a href="index.html" class="breadcrumb__link">Trang chủ</a></li>' +
      '<li class="breadcrumb__item"><a href="shop.html" class="breadcrumb__link">Cửa hàng</a></li>' +
      '<li class="breadcrumb__item"><a href="shop.html?category=' + (product.category || '') + '" class="breadcrumb__link">' + catLabel + '</a></li>' +
      '<li class="breadcrumb__item"><span class="breadcrumb__current">' + product.name + '</span></li>' +
      '</ol>';
  }

  function renderTabs(product) {
    var wrap = document.getElementById('productTabsWrap');
    var descContent = document.getElementById('tabDescContent');
    var infoContent = document.getElementById('tabInfoContent');
    var reviewsContent = document.getElementById('tabReviewsContent');
    if (!wrap || !descContent) return;

    var fullDesc = product.description || 'Sản phẩm chất lượng cao, an toàn cho thú cưng.';
    fullDesc += ' Sản phẩm được chọn lọc kỹ, phù hợp với từng loại thú cưng và nhu cầu sử dụng. Chúng tôi cam kết mang đến trải nghiệm mua sắm tin cậy.';

    descContent.innerHTML = '<p>' + fullDesc + '</p>';

    infoContent.innerHTML = '<h4>Thông tin sản phẩm</h4>' +
      '<p>Mã sản phẩm: ' + (product.id || '') + '</p>' +
      '<p>Danh mục: ' + (categoryLabels[product.category] || product.category || '—') + '</p>' +
      '<h4>Bảo quản</h4>' +
      '<p>Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp. Để xa tầm với thú cưng khi chưa sử dụng.</p>';

    reviewsContent.innerHTML = '<div class="product-detail__reviews-empty"><i class="fas fa-comments"></i> Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</div>';

    wrap.style.display = 'block';

    var tabs = wrap.querySelectorAll('.product-detail__tab');
    var panels = wrap.querySelectorAll('.product-detail__tab-panel');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var panelId = this.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.remove('active'); });
        panels.forEach(function (p) { p.classList.remove('active'); });
        this.classList.add('active');
        var panel = wrap.querySelector('[data-panel="' + panelId + '"]');
        if (panel) panel.classList.add('active');
      });
    });
  }

  function render() {
    var id = getProductId();
    var product = getProduct(id);
    var content = document.getElementById('productDetailContent');
    var loading = document.getElementById('productLoading');
    var relatedEl = document.getElementById('relatedProducts');

    if (!content) return;

    if (!product) {
      if (loading) loading.textContent = 'Không tìm thấy sản phẩm.';
      content.innerHTML = '<div class="product-detail__loading">Không tìm thấy sản phẩm. <a href="shop.html">Quay lại cửa hàng</a></div>';
      return;
    }

    renderBreadcrumb(product);
    if (loading) loading.remove();

    var discount = product.oldPrice && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
<<<<<<< HEAD
    var rawImages = Array.isArray(product.images) && product.images.length
      ? product.images
      : [product.image || ''];
    var getSrc = window.getProductImageSrc || function (s) { return s || ''; };
    var images = rawImages.map(getSrc);
=======
    var images = [product.image];
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

    content.innerHTML =
      '<div class="product-detail__gallery">' +
        (product.bestSeller ? '<span class="product-detail__badge">Bán chạy</span>' : '') +
        (discount ? '<span class="product-detail__badge product-detail__badge--discount">Giảm ' + discount + '%</span>' : '') +
<<<<<<< HEAD
        '<img class="product-detail__main-image" id="mainImage" src="' + (images[0] || product.image || '') + '" alt="' + product.name + '">' +
=======
        '<img class="product-detail__main-image" id="mainImage" src="' + product.image + '" alt="' + product.name + '">' +
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
        (images.length > 1 ? '<div class="product-detail__thumbs" id="productThumbs"></div>' : '') +
      '</div>' +
      '<div class="product-detail__info">' +
        '<a href="shop.html?category=' + (product.category || '') + '" class="product-detail__category">' + (categoryLabels[product.category] || product.category || 'Sản phẩm') + '</a>' +
        '<h1 class="product-detail__title">' + product.name + '</h1>' +
        '<div class="product-detail__rating-wrap">' +
          '<div class="product-detail__rating" title="' + product.rating + '">' + renderStars(product.rating) + '</div>' +
          '<span class="product-detail__rating-count">' + product.rating + ' · Đánh giá</span>' +
        '</div>' +
        '<div class="product-detail__price-wrap">' +
          '<span class="product-detail__price">' + formatPrice(product.price) + '</span>' +
          (product.oldPrice && product.oldPrice > product.price ? '<span class="product-detail__price-old">' + formatPrice(product.oldPrice) + '</span>' : '') +
          (discount ? '<span class="product-detail__price-badge">−' + discount + '%</span>' : '') +
        '</div>' +
        '<p class="product-detail__short-desc">' + (product.description || 'Sản phẩm chất lượng cao, an toàn cho thú cưng.') + '</p>' +
        '<div class="product-detail__quantity">' +
          '<label>Số lượng:</label>' +
          '<div class="product-detail__qty-input">' +
            '<button type="button" id="qtyMinus" aria-label="Giảm">−</button>' +
            '<input type="number" id="productQty" value="1" min="1" max="' + (product.stock !== undefined && !isNaN(parseInt(product.stock, 10)) ? Math.max(1, parseInt(product.stock, 10)) : 99) + '" readonly>' +
            '<button type="button" id="qtyPlus" aria-label="Tăng">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="product-detail__actions">' +
          (isOutOfStock(product)
            ? '<span class="btn-modern btn-modern--secondary btn-modern--lg" disabled><i class="fas fa-times-circle"></i> Hết hàng</span>'
            : '<button type="button" class="btn-modern btn-modern--primary btn-modern--lg" id="addToCartBtn"><i class="fas fa-cart-plus"></i> Thêm vào giỏ</button>') +
          '<a href="shop.html" class="btn-modern btn-modern--secondary">Mua ngay</a>' +
        '</div>' +
      '</div>';

    var qtyInput = document.getElementById('productQty');
    var qtyMinus = document.getElementById('qtyMinus');
    var qtyPlus = document.getElementById('qtyPlus');
    var addBtn = document.getElementById('addToCartBtn');

    var maxQty = product.stock !== undefined && !isNaN(parseInt(product.stock, 10)) ? Math.max(1, parseInt(product.stock, 10)) : 99;
    if (qtyMinus) qtyMinus.addEventListener('click', function () {
      var v = Math.max(1, parseInt(qtyInput.value, 10) - 1);
      qtyInput.value = v;
    });
    if (qtyPlus) qtyPlus.addEventListener('click', function () {
      var v = Math.min(maxQty, parseInt(qtyInput.value, 10) + 1);
      qtyInput.value = v;
    });

    if (addBtn) addBtn.addEventListener('click', function () {
      var qty = parseInt(qtyInput.value, 10) || 1;
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: qty
      }, product);
    });

<<<<<<< HEAD
    if (images.length > 1) {
      var thumbsEl = document.getElementById('productThumbs');
      var mainImgEl = document.getElementById('mainImage');
      if (thumbsEl && mainImgEl) {
        thumbsEl.innerHTML = images.map(function (src, i) {
          return '<button type="button" class="product-detail__thumb' + (i === 0 ? ' active' : '') + '" data-src="' + (src || '').replace(/"/g, '&quot;') + '"><img src="' + (src || '') + '" alt=""></button>';
        }).join('');
        thumbsEl.querySelectorAll('.product-detail__thumb').forEach(function (thumb) {
          thumb.addEventListener('click', function () {
            var s = this.getAttribute('data-src');
            if (s) mainImgEl.src = s;
            thumbsEl.querySelectorAll('.product-detail__thumb').forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');
          });
        });
      }
    }

=======
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    renderTabs(product);

    var related = products.filter(function (p) { return p.category === product.category && p.id !== product.id; }).slice(0, 4);
    if (relatedEl && related.length) {
      relatedEl.innerHTML = related.map(function (p) {
        var d = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
        var outOfStock = isOutOfStock(p);
        var btnHtml = outOfStock
          ? '<span class="btn btn--sm btn--out-of-stock" disabled><i class="fas fa-times-circle"></i> Hết hàng</span>'
<<<<<<< HEAD
          : '<button type="button" class="btn btn--primary btn--sm add-to-cart" data-id="' + p.id + '" data-name="' + p.name + '" data-price="' + p.price + '" data-image="' + (getSrc(p.image) || '') + '"><i class="fas fa-cart-plus"></i></button>';
        var relImg = getSrc(p.image);
        return '<div class="card card--product"' + (d ? ' data-discount="' + d + '"' : '') + '>' +
          '<a href="product-detail.html?id=' + p.id + '"><img class="card__image" src="' + relImg + '" alt="' + p.name + '"></a>' +
=======
          : '<button type="button" class="btn btn--primary btn--sm add-to-cart" data-id="' + p.id + '" data-name="' + p.name + '" data-price="' + p.price + '" data-image="' + (p.image || '') + '"><i class="fas fa-cart-plus"></i></button>';
        return '<div class="card card--product"' + (d ? ' data-discount="' + d + '"' : '') + '>' +
          '<a href="product-detail.html?id=' + p.id + '"><img class="card__image" src="' + p.image + '" alt="' + p.name + '"></a>' +
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
          '<div class="card__body">' +
            '<h3 class="card__title"><a href="product-detail.html?id=' + p.id + '">' + p.name + '</a></h3>' +
            '<div class="card__rating" title="' + p.rating + '">' + renderStars(p.rating) + '</div>' +
            '<div class="card__footer">' +
              '<div class="card__price-wrap"><div class="card__price-line">' +
                '<span class="card__price">' + formatPrice(p.price) + '</span>' +
                (p.oldPrice && p.oldPrice > p.price ? '<span class="card__price-old">' + formatPrice(p.oldPrice) + '</span>' : '') +
              '</div></div>' +
              btnHtml +
            '</div></div></div>';
      }).join('');
      relatedEl.querySelectorAll('.add-to-cart').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var pid = this.dataset.id;
          var prod = products.find(function (x) { return x.id === pid; });
          addToCart({
            id: this.dataset.id,
            name: this.dataset.name,
            price: parseInt(this.dataset.price, 10),
            image: this.dataset.image,
            quantity: 1
          }, prod);
        });
      });
    } else if (relatedEl) {
      relatedEl.innerHTML = '<p class="shop-empty">Chưa có sản phẩm liên quan.</p>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();

/**
 * Pet Spa & Shop - Cart Page
 * List cart, update quantity, remove, subtotal, link to checkout
 */

(function () {
  'use strict';

  const PRODUCTS_KEY = 'petspa_products';

  function formatPrice(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  }

  function getCart() {
    return window.getCart ? window.getCart() : [];
  }

  function getProducts() {
    try {
      const saved = localStorage.getItem(PRODUCTS_KEY);
      if (saved) return JSON.parse(saved);
      return (window.DATA && window.DATA.products) || [];
    } catch (e) {
      return [];
    }
  }

  function getProductStock(productId) {
    const p = getProducts().find(function (x) { return x.id === productId; });
    if (!p || p.stock === undefined) return null;
    const n = parseInt(p.stock, 10);
    return isNaN(n) ? null : n;
  }

  function setCart(cart) {
    try {
      localStorage.setItem(window.CART_KEY || 'petspa_cart', JSON.stringify(cart));
      if (window.updateCartBadge) window.updateCartBadge();
    } catch (e) {
      console.error(e);
    }
  }

  function render() {
    const cart = getCart();
    const listEl = document.getElementById('cartList');
    const emptyEl = document.getElementById('cartEmpty');
    const wrapEl = document.getElementById('cartWrap');
    const subtotalEl = document.getElementById('cartSubtotal');
    const totalEl = document.getElementById('cartTotal');

    if (!cart.length) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (wrapEl) wrapEl.style.display = 'none';
      const mobileSticky = document.getElementById('cartMobileSticky');
      if (mobileSticky) mobileSticky.setAttribute('aria-hidden', 'true');
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (wrapEl) wrapEl.style.display = 'grid';

    let total = 0;
    const productUrl = (id) => (id ? `product-detail.html?id=${encodeURIComponent(id)}` : 'shop.html');
    listEl.innerHTML = cart.map((item, index) => {
      const subtotal = item.price * (item.quantity || 1);
      total += subtotal;
      const link = productUrl(item.id);
      const imgSrc = window.getProductImageSrc ? window.getProductImageSrc(item.image) : (item.image || '');
      const imgEl = `<img class="cart-item__image" src="${imgSrc}" alt="${item.name}">`;
      const titleEl = item.id
        ? `<a href="${link}">${item.name}</a>`
        : item.name;
      const qty = item.quantity || 1;
      return `
        <div class="cart-item" data-index="${index}">
          <a class="cart-item__image-wrap" href="${link}">${imgEl}</a>
          <div class="cart-item__body">
            <div class="cart-item__head">
              <h3 class="cart-item__title">${titleEl}</h3>
              <button type="button" class="cart-item__remove cart-remove" data-index="${index}" aria-label="Xóa"><i class="fas fa-trash-alt"></i></button>
            </div>
            <p class="cart-item__price">${formatPrice(item.price)}<span class="cart-item__unit"> / sp</span></p>
            <div class="cart-item__footer">
              <div class="cart-item__qty">
                <button type="button" class="cart-qty-minus" data-index="${index}" aria-label="Giảm">−</button>
                <input type="number" value="${qty}" min="1" max="99" readonly class="cart-qty-input">
                <button type="button" class="cart-qty-plus" data-index="${index}" aria-label="Tăng">+</button>
              </div>
              <span class="cart-item__subtotal cart-item-subtotal">${formatPrice(subtotal)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (subtotalEl) subtotalEl.textContent = formatPrice(total);
    if (totalEl) totalEl.textContent = formatPrice(total);

    const mobileSticky = document.getElementById('cartMobileSticky');
    const mobileTotal = document.getElementById('cartMobileTotal');
    if (mobileSticky) mobileSticky.setAttribute('aria-hidden', 'false');
    if (mobileTotal) mobileTotal.textContent = formatPrice(total);

    listEl.querySelectorAll('.cart-qty-minus').forEach(btn => {
      btn.addEventListener('click', function () {
        const i = parseInt(this.dataset.index, 10);
        const c = getCart();
        if (c[i].quantity <= 1) return;
        c[i].quantity--;
        setCart(c);
        render();
      });
    });
    listEl.querySelectorAll('.cart-qty-plus').forEach(btn => {
      btn.addEventListener('click', function () {
        const i = parseInt(this.dataset.index, 10);
        const c = getCart();
        const item = c[i];
        const stock = getProductStock(item.id);
        const maxQty = stock === null ? 99 : stock;
        const currentQty = item.quantity || 1;
        const wantQty = currentQty + 1;
        const newQty = Math.min(wantQty, maxQty);
        if (stock !== null && wantQty > maxQty) {
          alert('Sản phẩm "' + (item.name || '') + '" chỉ còn ' + maxQty + ' sản phẩm.');
        }
        c[i].quantity = newQty;
        setCart(c);
        render();
      });
    });
    listEl.querySelectorAll('.cart-remove').forEach(btn => {
      btn.addEventListener('click', function () {
        const i = parseInt(this.dataset.index, 10);
        const c = getCart().filter((_, idx) => idx !== i);
        setCart(c);
        render();
      });
    });
  }

  function init() {
    // Check if user is logged in, if not clear cart
    const currentUser = window.getCurrentUser ? window.getCurrentUser() : null;
    if (!currentUser) {
      // Clear cart if not logged in
      try {
        localStorage.setItem(window.CART_KEY || 'petspa_cart', JSON.stringify([]));
        if (window.updateCartBadge) window.updateCartBadge();
      } catch (e) {
        console.error(e);
      }
    }
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

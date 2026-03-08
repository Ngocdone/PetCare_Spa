/**
 * Pet Spa & Shop - Checkout Page
 * Form: address, payment (COD/transfer). Save order to localStorage, clear cart.
 */

(function () {
  'use strict';

  const ORDERS_KEY = 'petspa_orders';
  const PRODUCTS_KEY = 'petspa_products';
  const ONLINE_PAYMENT = ['vnpay', 'momo', 'zalopay', 'card'];
  const PAYMENT_LABELS = {
    vnpay: 'VNPay',
    momo: 'Ví MoMo',
    zalopay: 'ZaloPay',
    card: 'Thẻ tín dụng'
  };
  const USERS_KEY = 'petspa_users';
  const PROMO_CODES = {
    PETSPA10: 10,
    WELCOME5: 5,
    PETVIP15: 15,
    SALE20: 20
  };
  const TIER_DISCOUNT = { bronze: 0, silver: 5, gold: 10, vip: 15 };
  const TIER_LABELS = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', vip: 'VIP' };

  function formatPrice(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  }

  function getCart() {
    return window.getCart ? window.getCart() : [];
  }

  function getCustomerTier(email) {
    if (!email) return 'bronze';
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const u = users.find(function (x) { return (x.email || '').toLowerCase() === email.toLowerCase(); });
      return (u && u.tier) ? u.tier : 'bronze';
    } catch (e) {
      return 'bronze';
    }
  }

  var appliedPromoCode = null;

  function getDiscounts(subtotal, email, isLoggedIn) {
    const tier = isLoggedIn ? getCustomerTier(email) : 'bronze';
    const tierPct = TIER_DISCOUNT[tier] || 0;
    const tierAmount = Math.round(subtotal * tierPct / 100);
    const promoPct = appliedPromoCode ? (PROMO_CODES[appliedPromoCode.toUpperCase()] || 0) : 0;
    const promoAmount = Math.round(subtotal * promoPct / 100);
    const totalDiscount = tierAmount + promoAmount;
    const finalTotal = Math.max(0, subtotal - totalDiscount);
    return {
      subtotal,
      tier,
      tierPct,
      tierAmount,
      promoCode: appliedPromoCode,
      promoPct,
      promoAmount,
      totalDiscount,
      finalTotal
    };
  }

  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    } catch (e) {
      return [];
    }
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

  function setProducts(list) {
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  }

  /** Kiểm tra tồn kho trước khi đặt hàng */
  function validateStock(cart) {
    const products = getProducts();
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const product = products.find(function (p) { return p.id === item.id; });
      if (product && product.stock !== undefined) {
        const stockNum = parseInt(product.stock, 10);
        if (isNaN(stockNum) || stockNum <= 0) {
          return { valid: false, message: 'Sản phẩm "' + (item.name || product.name) + '" đã hết hàng.' };
        }
        const qty = item.quantity || 1;
        if (qty > stockNum) {
          return { valid: false, message: 'Sản phẩm "' + (item.name || product.name) + '" chỉ còn ' + stockNum + ' sản phẩm.' };
        }
      }
    }
    return { valid: true };
  }

  /** Trừ tồn kho sau khi đặt hàng thành công */
  function deductStock(items) {
    const list = getProducts().slice();
    items.forEach(function (orderItem) {
      const idx = list.findIndex(function (p) { return p.id === orderItem.id; });
      if (idx >= 0 && list[idx].stock !== undefined) {
        const stockNum = parseInt(list[idx].stock, 10);
        if (!isNaN(stockNum)) {
          const qty = orderItem.quantity || 1;
          list[idx].stock = Math.max(0, stockNum - qty);
        }
      }
    });
    setProducts(list);
  }

  function saveOrder(order) {
    const list = getOrders();
    order.id = 'ord' + Date.now();
    order.status = 'pending';
    order.createdAt = new Date().toISOString();
    list.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  }

  function clearCart() {
    try {
      localStorage.setItem(window.CART_KEY || 'petspa_cart', JSON.stringify([]));
      if (window.updateCartBadge) window.updateCartBadge();
    } catch (e) {
      console.error(e);
    }
  }

  function renderOrderSummary() {
    const cart = getCart();
    const listEl = document.getElementById('checkoutOrderList');
    const totalEl = document.getElementById('checkoutTotal');
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const tierRowEl = document.getElementById('checkoutTierRow');
    const tierDiscountEl = document.getElementById('checkoutTierDiscount');
    const promoRowEl = document.getElementById('checkoutPromoRow');
    const promoDiscountEl = document.getElementById('checkoutPromoDiscount');
    const emptyEl = document.getElementById('checkoutEmpty');
    const wrapEl = document.getElementById('checkoutWrap');

    if (!cart.length) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (wrapEl) wrapEl.style.display = 'none';
      return { subtotal: 0, finalTotal: 0 };
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (wrapEl) wrapEl.style.display = 'grid';

    const subtotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    const isLoggedIn = !!user;
    const email = (user && user.email) || document.getElementById('checkoutEmail')?.value?.trim() || '';
    const d = getDiscounts(subtotal, email, isLoggedIn);

    listEl.innerHTML = cart.map(item => {
      const st = item.price * (item.quantity || 1);
      return `
        <div class="checkout-summary__item">
          <img src="${window.getProductImageSrc ? window.getProductImageSrc(item.image) : (item.image || '')}" alt="${item.name}" class="checkout-summary__item-img">
          <div class="checkout-summary__item-info">
            <div class="checkout-summary__item-name">${item.name}</div>
            <div class="checkout-summary__item-qty">x${item.quantity || 1}</div>
          </div>
          <span class="checkout-summary__item-price">${formatPrice(st)}</span>
        </div>
      `;
    }).join('');

    if (subtotalEl) subtotalEl.textContent = formatPrice(d.subtotal);
    if (totalEl) totalEl.textContent = formatPrice(d.finalTotal);
    var countEl = document.getElementById('checkoutItemCount');
    if (countEl) countEl.textContent = cart.length + ' sp';

    if (tierRowEl && tierDiscountEl) {
      tierRowEl.style.display = d.tierAmount > 0 ? 'flex' : 'none';
      tierDiscountEl.textContent = d.tierAmount > 0 ? '- ' + formatPrice(d.tierAmount) + ' (' + (TIER_LABELS[d.tier] || d.tier) + ')' : '-0đ';
    }
    if (promoRowEl && promoDiscountEl) {
      promoRowEl.style.display = d.promoAmount > 0 ? 'flex' : 'none';
      promoDiscountEl.textContent = d.promoAmount > 0 ? '- ' + formatPrice(d.promoAmount) + ' (' + (appliedPromoCode || '') + ')' : '-0đ';
    }

    var hintEl = document.getElementById('checkoutPromoHint');
    if (hintEl) {
      if (user && d.tier !== 'bronze') {
        hintEl.innerHTML = '<i class="fas fa-star"></i> Bạn đang được giảm ' + d.tierPct + '% (hạng ' + (TIER_LABELS[d.tier] || d.tier) + ')';
      } else if (user) {
        hintEl.innerHTML = '<i class="fas fa-info-circle"></i> Nâng hạng để nhận ưu đãi: Silver 5%, Gold 10%, VIP 15%';
      } else {
        hintEl.innerHTML = '<i class="fas fa-info-circle"></i> Đăng nhập để nhận giả giá khách quen (Silver 5%, Gold 10%, VIP 15%)';
      }
    }

    return d;
  }

  function validateForm() {
    const name = document.getElementById('checkoutName');
    const phone = document.getElementById('checkoutPhone');
    const email = document.getElementById('checkoutEmail');
    const address = document.getElementById('checkoutAddress');
    let valid = true;

    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    [name, phone, email, address].forEach(el => { if (el) el.classList.remove('error'); });

    if (!name.value.trim()) {
      document.getElementById('errorName').textContent = 'Vui lòng nhập họ tên.';
      name.classList.add('error');
      valid = false;
    }
    const phoneVal = phone.value.replace(/\s/g, '');
    if (!phoneVal || phoneVal.length < 10) {
      document.getElementById('errorPhone').textContent = 'Số điện thoại hợp lệ (ít nhất 10 số).';
      phone.classList.add('error');
      valid = false;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !emailRe.test(email.value)) {
      document.getElementById('errorEmail').textContent = 'Email hợp lệ.';
      email.classList.add('error');
      valid = false;
    }
    if (!address.value.trim()) {
      document.getElementById('errorAddress').textContent = 'Vui lòng nhập địa chỉ giao hàng.';
      address.classList.add('error');
      valid = false;
    }
    return valid;
  }

  function showPaymentModal(title, msg, showSpinner = true) {
    const overlay = document.getElementById('paymentModalOverlay');
    const titleEl = document.getElementById('paymentModalTitle');
    const msgEl = document.getElementById('paymentModalMsg');
    const spinnerEl = document.getElementById('paymentModalSpinner');
    const successEl = document.getElementById('paymentModalSuccess');
    if (overlay && titleEl && msgEl && spinnerEl) {
      titleEl.textContent = title;
      msgEl.textContent = msg;
      spinnerEl.classList.toggle('payment-modal__spinner--hidden', !showSpinner);
      if (successEl) {
        successEl.setAttribute('aria-hidden', String(showSpinner));
        successEl.classList.toggle('payment-modal__success--visible', !showSpinner);
      }
      overlay.setAttribute('aria-hidden', 'false');
      overlay.classList.add('payment-modal-overlay--visible');
    }
  }

  function hidePaymentModal() {
    const overlay = document.getElementById('paymentModalOverlay');
    if (overlay) {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('payment-modal-overlay--visible');
    }
  }

  function completeOrderAndRedirect(order) {
    var stockCheck = validateStock(order.items);
    if (!stockCheck.valid) {
      alert(stockCheck.message);
      return;
    }
    saveOrder(order);
    clearCart();
    alert('Đặt hàng thành công! Mã đơn hàng: ' + order.id + '. Chúng tôi sẽ liên hệ xác nhận.');
    window.location.href = 'index.html';
  }

  function prefillUserInfo() {
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    const profile = window.getUserProfile ? window.getUserProfile() : {};
    if (user) {
      const nameEl = document.getElementById('checkoutName');
      const emailEl = document.getElementById('checkoutEmail');
      const phoneEl = document.getElementById('checkoutPhone');
      const addrEl = document.getElementById('checkoutAddress');
      if (nameEl && !nameEl.value) nameEl.value = profile.name || user.name || '';
      if (emailEl && !emailEl.value) emailEl.value = profile.email || user.email || '';
      if (phoneEl && !phoneEl.value) phoneEl.value = profile.phone || '';
      if (addrEl && !addrEl.value) addrEl.value = profile.address || '';
    }
  }

  function togglePaymentBlocks() {
    const onlineWrap = document.getElementById('checkoutPaymentOnlineWrap');
    const bankInfo = document.getElementById('checkoutBankInfo');
    const transferRadio = document.getElementById('paymentTransfer');
    const anyOnlineChecked = document.querySelector('input[name="payment"][value="vnpay"]:checked, input[name="payment"][value="momo"]:checked, input[name="payment"][value="zalopay"]:checked, input[name="payment"][value="card"]:checked');
    const showOnline = transferRadio?.checked || !!anyOnlineChecked;
    const showBank = transferRadio?.checked && !anyOnlineChecked;
    if (onlineWrap) {
      onlineWrap.classList.toggle('checkout-payment-online-wrap--visible', showOnline);
      onlineWrap.setAttribute('aria-hidden', String(!showOnline));
    }
    if (bankInfo) {
      bankInfo.classList.toggle('checkout-bank-info--visible', showBank);
      bankInfo.setAttribute('aria-hidden', String(!showBank));
    }
  }

  function initCopyBankAccount() {
    document.querySelector('.checkout-bank-info__copy')?.addEventListener('click', function () {
      const num = this.getAttribute('data-copy') || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(num).then(function () {
          const el = document.querySelector('.checkout-bank-info__copy');
          if (el) {
            const icon = el.querySelector('i');
            const orig = icon.className;
            icon.className = 'fas fa-check';
            setTimeout(function () { icon.className = orig; }, 1500);
          }
        });
      }
    });
  }

  function init() {
    renderOrderSummary();
    prefillUserInfo();
    togglePaymentBlocks();
    initCopyBankAccount();

    document.getElementById('checkoutPromoApply')?.addEventListener('click', function () {
      const input = document.getElementById('checkoutPromoCode');
      const msgEl = document.getElementById('checkoutPromoMsg');
      const code = (input?.value || '').trim().toUpperCase();
      if (!code) {
        if (msgEl) { msgEl.textContent = 'Vui lòng nhập mã.'; msgEl.className = 'checkout-summary__promo-msg error'; }
        return;
      }
      if (PROMO_CODES[code] !== undefined) {
        appliedPromoCode = code;
        if (msgEl) { msgEl.textContent = 'Đã áp dụng mã giảm ' + PROMO_CODES[code] + '%'; msgEl.className = 'checkout-summary__promo-msg success'; }
        renderOrderSummary();
      } else {
        appliedPromoCode = null;
        if (msgEl) { msgEl.textContent = 'Mã không hợp lệ.'; msgEl.className = 'checkout-summary__promo-msg error'; }
        renderOrderSummary();
      }
    });

    document.getElementById('checkoutPromoCode')?.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('checkoutPromoApply')?.click(); }
    });

    document.getElementById('checkoutEmail')?.addEventListener('blur', function () { renderOrderSummary(); });

    document.querySelectorAll('input[name="payment"]').forEach(function (radio) {
      radio.addEventListener('change', togglePaymentBlocks);
    });

    document.getElementById('checkoutForm')?.addEventListener('submit', function (e) {
      e.preventDefault();
      const cart = getCart();
      if (!cart.length) {
        alert('Giỏ hàng trống.');
        return;
      }
      if (!validateForm()) return;

      const user = window.getCurrentUser ? window.getCurrentUser() : null;
      const payment = document.querySelector('input[name="payment"]:checked')?.value || 'cod';
      const subtotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
      const email = document.getElementById('checkoutEmail')?.value?.trim() || (user && user.email) || '';
      const d = getDiscounts(subtotal, email, !!user);
      const total = d.finalTotal;

      let orderEmail = document.getElementById('checkoutEmail').value.trim();
      if (user && user.email) {
        orderEmail = user.email.trim().toLowerCase();
      }

      const order = {
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity || 1, image: i.image })),
        total,
        subtotal: d.subtotal,
        discount: { tierAmount: d.tierAmount, tier: d.tier, promoCode: d.promoCode, promoAmount: d.promoAmount },
        name: document.getElementById('checkoutName').value.trim(),
        phone: document.getElementById('checkoutPhone').value.trim(),
        email: orderEmail,
        address: document.getElementById('checkoutAddress').value.trim(),
        payment,
        carrier: 'PetCare Express',
        carrierPhone: '1900 1234'
      };

      if (ONLINE_PAYMENT.includes(payment)) {
        const gatewayName = PAYMENT_LABELS[payment] || payment;
        showPaymentModal('Đang chuyển đến cổng thanh toán...', 'Bạn sẽ được chuyển đến ' + gatewayName + ' để hoàn tất thanh toán.', true);
        setTimeout(function () {
          showPaymentModal('Thanh toán thành công!', 'Giao dịch đã được xử lý. Đơn hàng của bạn đang được xác nhận.', false);
          setTimeout(function () {
            hidePaymentModal();
            completeOrderAndRedirect(order);
          }, 1200);
        }, 2200);
      } else {
        completeOrderAndRedirect(order);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

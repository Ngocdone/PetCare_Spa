/**
 * Pet Spa & Shop - User Dashboard
 * Tabs, Modals, Forms, localStorage (pets, addresses, favorites)
 * Dễ mở rộng cho backend API sau này
 */

(function () {
  'use strict';

  const PETS_KEY = 'petspa_pets';
  const ADDRESSES_KEY = 'petspa_addresses';
  const FAVORITES_KEY = 'petspa_favorites';
  const USER_PROFILE_KEY = 'petspa_user_profile';
  const ORDERS_KEY = 'petspa_orders';
  const BOOKINGS_KEY = window.BOOKINGS_KEY || 'petspa_bookings';

  function formatPrice(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
  }

  function getCurrentUser() {
    return window.getCurrentUser ? window.getCurrentUser() : null;
  }

  function getPets() {
    try {
      return JSON.parse(localStorage.getItem(PETS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function savePets(pets) {
    localStorage.setItem(PETS_KEY, JSON.stringify(pets));
  }

  function getAddresses() {
    try {
      return JSON.parse(localStorage.getItem(ADDRESSES_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveAddresses(addr) {
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addr));
  }

  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveFavorites(arr) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(arr));
  }

  function getUserProfile() {
    try {
      return JSON.parse(localStorage.getItem(USER_PROFILE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveUserProfile(profile) {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  }

  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  // ---------- Tab switching ----------
  function switchTab(tabName) {
    document.querySelectorAll('.user-nav__item[data-tab]').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tabName);
    });
    document.querySelectorAll('.user-panel').forEach(el => {
      el.classList.toggle('active', el.dataset.panel === tabName);
    });
  }

  // ---------- Modal ----------
  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.setAttribute('aria-hidden', 'true');
  }

  // ---------- Render Overview ----------
  function renderOverview() {
    const user = getCurrentUser();
    const pets = getPets();
    const orders = getOrders();
    const bookings = getBookings();
    const userEmail = (user && user.email) ? user.email.toLowerCase() : '';

    const myOrders = userEmail ? orders.filter(o => (o.email || '').toLowerCase() === userEmail) : orders;
    const myBookings = userEmail ? bookings.filter(b => (b.ownerEmail || '').toLowerCase() === userEmail) : bookings;
    const upcomingBookings = myBookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed');
    const points = myOrders.reduce((sum, o) => sum + Math.floor((o.total || 0) / 100000), 0);

    document.getElementById('statPets').textContent = pets.length;
    document.getElementById('statBookings').textContent = upcomingBookings.length;
    document.getElementById('statOrders').textContent = myOrders.length;
    document.getElementById('statPoints').textContent = points;
  }

  // ---------- Render Profile Form ----------
  function renderProfile() {
    const user = getCurrentUser();
    const profile = getUserProfile();
    if (user) {
      document.getElementById('profileName').value = profile.name || user.name || '';
      document.getElementById('profileEmail').value = profile.email || user.email || '';
      document.getElementById('profilePhone').value = profile.phone || '';
      document.getElementById('profileDob').value = profile.dob || '';
      document.getElementById('profileAddress').value = profile.address || '';
      document.getElementById('profileGender').value = profile.gender || '';
      const dispName = profile.name || user.name || user.email || 'Người dùng';
      const dispEmail = profile.email || user.email || '';
      const sidebarName = document.getElementById('profileSidebarName');
      const sidebarEmail = document.getElementById('profileSidebarEmail');
      if (sidebarName) sidebarName.textContent = dispName;
      if (sidebarEmail) sidebarEmail.textContent = dispEmail;
    }
  }

  // ---------- Render Pets ----------
  function renderPets() {
    const pets = getPets();
    const grid = document.getElementById('petsGrid');
    if (!grid) return;

    if (!pets.length) {
      grid.innerHTML = '<p class="user-empty">Chưa có thú cưng. Nhấn "Thêm thú cưng" để thêm.</p>';
      return;
    }

    const defaultImg = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400';
    grid.innerHTML = pets.map(p => `
      <div class="user-pet-card" data-id="${p.id}">
        <div class="user-pet-card__media">
          <img class="user-pet-card__image" src="${p.image || defaultImg}" alt="${p.name}">
          <span class="user-pet-card__badge">${p.type === 'dog' ? 'Chó' : 'Mèo'}</span>
        </div>
        <div class="user-pet-card__body">
          <h3 class="user-pet-card__name">${p.name}</h3>
          <p class="user-pet-card__info">
            <span><i class="fas fa-calendar-alt"></i> ${p.age || '-'} tháng</span>
            <span><i class="fas fa-weight-hanging"></i> ${p.weight || '-'} kg</span>
          </p>
          <div class="user-pet-card__actions">
            <button type="button" class="user-pet-card__btn user-pet-card__btn--edit btn-edit-pet" data-id="${p.id}" aria-label="Sửa">
              <i class="fas fa-pen"></i>
              <span>Sửa</span>
            </button>
            <button type="button" class="user-pet-card__btn user-pet-card__btn--delete btn-delete-pet" data-id="${p.id}" aria-label="Xóa">
              <i class="fas fa-trash-alt"></i>
              <span>Xóa</span>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.btn-edit-pet').forEach(btn => {
      btn.addEventListener('click', () => openPetModal(btn.dataset.id));
    });
    grid.querySelectorAll('.btn-delete-pet').forEach(btn => {
      btn.addEventListener('click', () => deletePet(btn.dataset.id));
    });
  }

  // ---------- Render Bookings ----------
  function renderBookings() {
    const user = getCurrentUser();
    const bookings = getBookings();
    const userEmail = (user && user.email) ? user.email.toLowerCase() : '';
    const myBookings = userEmail ? bookings.filter(b => (b.ownerEmail || '').toLowerCase() === userEmail) : bookings;

    const tbody = document.getElementById('bookingsTableBody');
    const empty = document.getElementById('bookingsEmpty');
    if (!tbody) return;

    if (empty) empty.style.display = myBookings.length ? 'none' : 'block';
    tbody.innerHTML = myBookings.slice().reverse().map(b => {
      const statusLabel = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', completed: 'Hoàn thành', cancelled: 'Đã hủy' }[b.status] || b.status;
      const statusClass = b.status || 'pending';
      return `
        <tr>
          <td>${b.petName || '-'}</td>
          <td>${b.serviceName || '-'}</td>
          <td>${b.date || '-'} ${b.time || ''}</td>
          <td><span class="user-badge user-badge--${statusClass}">${statusLabel}</span></td>
          <td>
            ${b.status === 'pending' ? `<button type="button" class="btn btn--secondary btn--sm btn-cancel-booking" data-id="${b.id}">Hủy lịch</button>` : '-'}
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-cancel-booking').forEach(btn => {
      btn.addEventListener('click', () => cancelBooking(btn.dataset.id));
    });
  }

  // ---------- Render Orders ----------
  function renderOrders() {
    const user = getCurrentUser();
    const orders = getOrders();
    const userEmail = (user && user.email) ? user.email.toLowerCase() : '';
    const myOrders = userEmail ? orders.filter(o => (o.email || '').toLowerCase() === userEmail) : orders;

    const list = document.getElementById('ordersList');
    const empty = document.getElementById('ordersEmpty');
    if (!list) return;

    if (empty) empty.style.display = myOrders.length ? 'none' : 'block';

    const totalSpent = myOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total || 0), 0);
    const countEl = document.getElementById('ordersStatCount');
    const totalEl = document.getElementById('ordersStatTotal');
    if (countEl) countEl.textContent = myOrders.length;
    if (totalEl) totalEl.textContent = formatPrice(totalSpent);

    list.innerHTML = myOrders.slice().reverse().map(o => {
      const statusLabel = { pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', shipping: 'Đang giao', completed: 'Hoàn thành', cancelled: 'Đã hủy' }[o.status] || o.status || 'Chờ xử lý';
      const items = o.items || [];
      const itemCount = items.reduce((s, i) => s + (i.quantity || 1), 0);
      const firstImg = items[0] && items[0].image;
      return `
        <div class="user-order-card">
          <div class="user-order-card__left">
            ${firstImg ? `<img class="user-order-card__thumb" src="${firstImg}" alt="">` : '<div class="user-order-card__thumb user-order-card__thumb--placeholder"><i class="fas fa-shopping-bag"></i></div>'}
            <div class="user-order-card__info">
              <span class="user-order-card__id">${o.id}</span>
              <span class="user-order-card__date"><i class="fas fa-calendar-alt"></i> ${o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '-'}</span>
              <span class="user-order-card__items">${itemCount} sản phẩm</span>
            </div>
          </div>
          <div class="user-order-card__right">
            <span class="user-order-card__total">${formatPrice(o.total)}</span>
            <span class="user-badge user-badge--${o.status || 'pending'}">${statusLabel}</span>
            <button type="button" class="btn btn--secondary btn--sm btn-order-detail" data-id="${o.id}"><i class="fas fa-eye"></i> Chi tiết</button>
            ${o.status === 'cancelled' ? `<button type="button" class="btn btn--danger btn--sm btn-order-delete" data-id="${o.id}"><i class="fas fa-trash"></i> Xóa</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.btn-order-detail').forEach(btn => {
      btn.addEventListener('click', () => openOrderDetail(btn.dataset.id));
    });
    list.querySelectorAll('.btn-order-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteOrder(btn.dataset.id));
    });
  }

  function deleteOrder(orderId) {
    if (!confirm('Bạn có chắc muốn xóa đơn hàng này khỏi danh sách?')) return;
    const orders = getOrders().filter(o => o.id !== orderId);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    renderOrders();
    renderOverview();
    alert('Đã xóa đơn hàng.');
  }

  // ---------- Order Detail Modal ----------
  const STEPS = [
    { key: 'pending', label: 'Đã đặt hàng', icon: 'fa-shopping-cart' },
    { key: 'confirmed', label: 'Đã xác nhận', icon: 'fa-check-circle' },
    { key: 'shipping', label: 'Đang giao hàng', icon: 'fa-truck' },
    { key: 'completed', label: 'Đã giao', icon: 'fa-flag-checkered' }
  ];

  function openOrderDetail(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const status = order.status || 'pending';
    const carrier = order.carrier || 'PetCare Express';
    const carrierPhone = order.carrierPhone || '1900 1234';

    document.getElementById('orderDetailId').textContent = order.id + ' • ' + (order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-');
    document.getElementById('orderDetailTotal').textContent = formatPrice(order.total);
    document.getElementById('orderDetailCarrier').textContent = carrier;
    const phoneEl = document.getElementById('orderDetailCarrierPhone');
    phoneEl.innerHTML = '<i class="fas fa-phone"></i> ' + carrierPhone;
    phoneEl.href = 'tel:' + carrierPhone.replace(/\s/g, '');

    const stepIdx = status === 'cancelled' ? -1 : STEPS.findIndex(s => s.key === status);
    document.getElementById('orderDetailTimeline').innerHTML = status === 'cancelled'
      ? '<div class="order-timeline order-timeline--cancelled"><span class="order-timeline__cancelled-icon"><i class="fas fa-times-circle"></i></span><span>Đơn hàng đã bị hủy</span></div>'
      : STEPS.map((s, i) => {
          const done = i <= stepIdx;
          return `<div class="order-timeline__step ${done ? 'done' : ''}" data-step="${i}"><span class="order-timeline__dot"><i class="fas ${s.icon}"></i></span><span class="order-timeline__label">${s.label}</span></div>`;
        }).join('');

    const items = order.items || [];
    document.getElementById('orderDetailItems').innerHTML = items.length
      ? '<h4 class="order-detail__items-title"><i class="fas fa-box-open"></i> Sản phẩm</h4><div class="order-detail__items-list">' + items.map(i =>
          `<div class="order-detail__item"><div class="order-detail__item-img-wrap"><img src="${i.image || ''}" alt=""></div><div class="order-detail__item-body"><span class="order-detail__item-name">${i.name}</span><span class="order-detail__item-qty">x${i.quantity || 1}</span></div><span class="order-detail__item-price">${formatPrice((i.price || 0) * (i.quantity || 1))}</span></div>`
        ).join('') + '</div>'
      : '';

    const btnCancel = document.getElementById('btnCancelOrder');
    const btnDelete = document.getElementById('btnDeleteOrder');
    btnCancel.style.display = status === 'pending' ? '' : 'none';
    btnDelete.style.display = status === 'cancelled' ? '' : 'none';
    btnCancel.onclick = () => cancelOrder(orderId);
    btnDelete.onclick = () => {
      closeModal('modalOrderDetail');
      deleteOrder(orderId);
    };

    openModal('modalOrderDetail');
  }

  function cancelOrder(orderId) {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0 && orders[idx].status === 'pending') {
      orders[idx].status = 'cancelled';
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      closeModal('modalOrderDetail');
      renderOrders();
      renderOverview();
      alert('Đã hủy đơn hàng.');
    }
  }

  // ---------- Render Favorites ----------
  function renderFavorites() {
    const favIds = getFavorites();
    const products = (window.DATA && window.DATA.products) || [];
    const favProducts = products.filter(p => favIds.includes(p.id));
    const grid = document.getElementById('favoritesGrid');
    const empty = document.getElementById('favoritesEmpty');
    if (!grid) return;

    if (empty) empty.style.display = favProducts.length ? 'none' : 'block';
    if (!favProducts.length) {
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = favProducts.map(p => `
      <div class="user-product-card">
        <img class="user-product-card__image" src="${p.image}" alt="${p.name}">
        <div class="user-product-card__body">
          <h3 class="user-product-card__name">${p.name}</h3>
          <p class="user-product-card__price">${formatPrice(p.price)}</p>
          <div class="user-product-card__actions">
            <button type="button" class="btn btn--primary btn--sm btn-buy-fav" data-id="${p.id}">Mua ngay</button>
            <button type="button" class="btn btn--secondary btn--sm btn-remove-fav" data-id="${p.id}"><i class="fas fa-heart-broken"></i></button>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.btn-buy-fav').forEach(btn => {
      btn.addEventListener('click', () => { window.location.href = 'product-detail.html?id=' + btn.dataset.id; });
    });
    grid.querySelectorAll('.btn-remove-fav').forEach(btn => {
      btn.addEventListener('click', () => removeFavorite(btn.dataset.id));
    });
  }

  // ---------- Render Addresses ----------
  function renderAddresses() {
    const addresses = getAddresses();
    const list = document.getElementById('addressesList');
    const empty = document.getElementById('addressesEmpty');
    if (!list) return;

    if (empty) empty.style.display = addresses.length ? 'none' : 'block';
    list.innerHTML = addresses.map(a => `
      <div class="user-address-card ${a.default ? 'default' : ''}" data-id="${a.id}">
        ${a.default ? '<span class="user-address-card__default">Mặc định</span>' : ''}
        <div class="user-address-card__name">${a.name}</div>
        <div class="user-address-card__phone">${a.phone}</div>
        <div class="user-address-card__detail">${a.detail}</div>
        <div class="user-address-card__actions">
          ${!a.default ? `<button type="button" class="btn btn--secondary btn--sm btn-set-default-addr" data-id="${a.id}">Đặt mặc định</button>` : ''}
          <button type="button" class="btn btn--secondary btn--sm btn-edit-addr" data-id="${a.id}">Sửa</button>
          <button type="button" class="btn btn--secondary btn--sm btn-delete-addr" data-id="${a.id}">Xóa</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.btn-edit-addr').forEach(btn => { btn.addEventListener('click', () => openAddressModal(btn.dataset.id)); });
    list.querySelectorAll('.btn-delete-addr').forEach(btn => { btn.addEventListener('click', () => deleteAddress(btn.dataset.id)); });
    list.querySelectorAll('.btn-set-default-addr').forEach(btn => { btn.addEventListener('click', () => setDefaultAddress(btn.dataset.id)); });
  }

  // ---------- Pet Modal ----------
  function openPetModal(id) {
    const modal = document.getElementById('modalPet');
    const title = document.getElementById('modalPetTitle');
    title.innerHTML = '<i class="fas fa-paw"></i> ' + (id ? 'Sửa thú cưng' : 'Thêm thú cưng');
    document.getElementById('petId').value = id || '';
    document.getElementById('formPet').reset();

    if (id) {
      const pets = getPets();
      const p = pets.find(x => x.id === id);
      if (p) {
        document.getElementById('petName').value = p.name;
        document.getElementById('petType').value = p.type || '';
        document.getElementById('petAge').value = p.age || '';
        document.getElementById('petWeight').value = p.weight || '';
        document.getElementById('petImage').value = p.image || '';
      }
    }
    openModal('modalPet');
  }

  function deletePet(id) {
    if (!confirm('Bạn có chắc muốn xóa thú cưng này?')) return;
    const pets = getPets().filter(p => p.id !== id);
    savePets(pets);
    renderPets();
    renderOverview();
  }

  function cancelBooking(id) {
    if (!confirm('Bạn có chắc muốn hủy lịch hẹn này?')) return;
    const bookings = getBookings();
    const idx = bookings.findIndex(b => b.id === id);
    if (idx >= 0) {
      bookings[idx].status = 'cancelled';
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    }
    renderBookings();
    renderOverview();
  }

  function removeFavorite(id) {
    const fav = getFavorites().filter(x => x !== id);
    saveFavorites(fav);
    renderFavorites();
  }

  // ---------- Address Modal ----------
  function openAddressModal(id) {
    const title = document.getElementById('modalAddressTitle');
    title.innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + (id ? 'Sửa địa chỉ' : 'Thêm địa chỉ');
    document.getElementById('addressId').value = id || '';
    document.getElementById('formAddress').reset();

    if (id) {
      const addr = getAddresses().find(a => a.id === id);
      if (addr) {
        document.getElementById('addressName').value = addr.name;
        document.getElementById('addressPhone').value = addr.phone;
        document.getElementById('addressDetail').value = addr.detail;
        document.getElementById('addressDefault').checked = !!addr.default;
      }
    }
    openModal('modalAddress');
  }

  function deleteAddress(id) {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    saveAddresses(getAddresses().filter(a => a.id !== id));
    renderAddresses();
  }

  function setDefaultAddress(id) {
    const addr = getAddresses();
    addr.forEach(a => { a.default = a.id === id; });
    saveAddresses(addr);
    renderAddresses();
  }

  // ---------- Init ----------
  function init() {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'login.html?return=user.html';
      return;
    }

    // Sidebar user info
    const profile = getUserProfile();
    document.getElementById('userName').textContent = profile.name || user.name || user.email || 'Người dùng';
    document.getElementById('userEmail').textContent = user.email || '';

    // Tab nav
    document.querySelectorAll('.user-nav__item[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Profile form - Cancel button resets to saved data
    document.getElementById('btnCancelProfile')?.addEventListener('click', () => {
      renderProfile();
    });

    document.getElementById('formProfile')?.addEventListener('submit', function (e) {
      e.preventDefault();
      const data = {
        name: document.getElementById('profileName').value.trim(),
        email: document.getElementById('profileEmail').value.trim(),
        phone: document.getElementById('profilePhone').value.trim(),
        dob: document.getElementById('profileDob').value,
        address: document.getElementById('profileAddress').value.trim(),
        gender: document.getElementById('profileGender').value
      };
      saveUserProfile(data);
      document.getElementById('userName').textContent = data.name || user.email;
      const sidebarName = document.getElementById('profileSidebarName');
      const sidebarEmail = document.getElementById('profileSidebarEmail');
      if (sidebarName) sidebarName.textContent = data.name || user.email;
      if (sidebarEmail) sidebarEmail.textContent = data.email || user.email;
      alert('Đã lưu thông tin!');
    });

    // Pet form
    document.getElementById('formPet')?.addEventListener('submit', function (e) {
      e.preventDefault();
      const id = document.getElementById('petId').value;
      const pets = getPets();
      const pet = {
        id: id || 'pet' + Date.now(),
        name: document.getElementById('petName').value.trim(),
        type: document.getElementById('petType').value,
        age: document.getElementById('petAge').value || null,
        weight: document.getElementById('petWeight').value,
        image: document.getElementById('petImage').value || null
      };
      if (id) {
        const idx = pets.findIndex(p => p.id === id);
        if (idx >= 0) pets[idx] = { ...pets[idx], ...pet };
      } else {
        pets.push(pet);
      }
      savePets(pets);
      closeModal('modalPet');
      renderPets();
      renderOverview();
      alert(id ? 'Đã cập nhật!' : 'Đã thêm thú cưng!');
    });

    // Address form
    document.getElementById('formAddress')?.addEventListener('submit', function (e) {
      e.preventDefault();
      const id = document.getElementById('addressId').value;
      const addresses = getAddresses();
      const isDefault = document.getElementById('addressDefault').checked;
      const addr = {
        id: id || 'addr' + Date.now(),
        name: document.getElementById('addressName').value.trim(),
        phone: document.getElementById('addressPhone').value.trim(),
        detail: document.getElementById('addressDetail').value.trim(),
        default: isDefault
      };
      if (isDefault) addresses.forEach(a => { a.default = false; });
      if (id) {
        const idx = addresses.findIndex(a => a.id === id);
        if (idx >= 0) addresses[idx] = addr;
      } else {
        addresses.push(addr);
      }
      saveAddresses(addresses);
      closeModal('modalAddress');
      renderAddresses();
      alert(id ? 'Đã cập nhật!' : 'Đã thêm địa chỉ!');
    });

    // Password show/hide toggle
    document.querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', function () {
        const input = document.getElementById(this.dataset.target);
        if (!input) return;
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        this.querySelector('i').className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
      });
    });

    // Password form
    document.getElementById('formPassword')?.addEventListener('submit', function (e) {
      e.preventDefault();
      const oldP = document.getElementById('passwordOld').value;
      const newP = document.getElementById('passwordNew').value;
      const confirmP = document.getElementById('passwordConfirm').value;

      document.getElementById('errorPasswordOld').textContent = '';
      document.getElementById('errorPasswordNew').textContent = '';
      document.getElementById('errorPasswordConfirm').textContent = '';

      let valid = true;
      if (newP.length < 6) {
        document.getElementById('errorPasswordNew').textContent = 'Mật khẩu ít nhất 6 ký tự.';
        valid = false;
      }
      if (newP !== confirmP) {
        document.getElementById('errorPasswordConfirm').textContent = 'Xác nhận mật khẩu không khớp.';
        valid = false;
      }
      if (!valid) return;

      // Simulate: check old password (would call API)
      const users = JSON.parse(localStorage.getItem('petspa_users') || '[]');
      const u = users.find(x => x.email === user.email);
      if (u && u.password !== oldP) {
        document.getElementById('errorPasswordOld').textContent = 'Mật khẩu hiện tại không đúng.';
        return;
      }
      if (u) {
        u.password = newP;
        localStorage.setItem('petspa_users', JSON.stringify(users));
      }
      document.getElementById('formPassword').reset();
      alert('Đã đổi mật khẩu!');
    });

    // Modals
    document.querySelectorAll('.user-modal__overlay, .user-modal__close, .user-modal__cancel').forEach(el => {
      el.addEventListener('click', function () {
        const modal = this.closest('.user-modal');
        if (modal) closeModal(modal.id);
      });
    });

    document.getElementById('btnAddPet')?.addEventListener('click', () => openPetModal(null));
    document.getElementById('btnAddAddress')?.addEventListener('click', () => openAddressModal(null));

    // Mobile sidebar toggle
    function toggleSidebar() {
      const sidebar = document.getElementById('userSidebar');
      const overlay = document.getElementById('sidebarOverlay');
      sidebar.classList.toggle('open');
      overlay?.setAttribute('aria-hidden', !sidebar.classList.contains('open'));
    }
    function closeSidebar() {
      document.getElementById('userSidebar').classList.remove('open');
      document.getElementById('sidebarOverlay')?.setAttribute('aria-hidden', 'true');
    }
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
    document.getElementById('userSidebar')?.addEventListener('click', function (e) {
      if (window.innerWidth <= 991 && e.target.closest('.user-nav__item')) closeSidebar();
    });

    // Logout
    document.getElementById('btnLogout')?.addEventListener('click', function (e) {
      e.preventDefault();
      if (window.logout) window.logout();
      window.location.href = 'index.html';
    });

    // Initial render
    renderOverview();
    renderProfile();
    renderPets();
    renderBookings();
    renderOrders();
    renderFavorites();
    renderAddresses();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

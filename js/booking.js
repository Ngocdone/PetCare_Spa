/**
 * Pet Spa & Shop - Booking Page
 * Step-by-step form: Service & Pet -> Date & Time -> Owner info -> Confirm
 */

(function () {
  'use strict';

  const DATA = window.DATA || {};
  const services = DATA.services || [];
  const BOOKINGS_KEY = window.BOOKINGS_KEY || 'petspa_bookings';

  function formatPrice(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  }

  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveBooking(booking) {
    const list = getBookings();
    booking.id = 'b' + Date.now();
    booking.status = 'pending';
    booking.createdAt = new Date().toISOString();
    list.push(booking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
    
    // Gửi dữ liệu lên server API
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        serviceId: booking.serviceId,
        serviceName: booking.serviceName,
        servicePrice: booking.servicePrice,
        petType: booking.petType,
        petWeight: booking.petWeight,
        petName: booking.petName,
        bookingDate: booking.date,
        bookingTime: booking.time,
        ownerName: booking.ownerName,
        ownerPhone: booking.ownerPhone,
        ownerEmail: booking.ownerEmail,
        ownerAddress: booking.ownerAddress,
        note: booking.note || ''
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log('Booking saved to server:', data);
    })
    .catch(err => {
      console.error('Error saving booking to server:', err);
    });
  }

  // Time slots 8:00 - 18:00, 30 min
  function getTimeSlots() {
    const slots = [];
    for (let h = 8; h <= 17; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 17 && m === 30) break;
        slots.push(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
      }
    }
    return slots;
  }

  // Min date = today
  function setMinDate() {
    const input = document.getElementById('bookingDate');
    if (!input) return;
    const today = new Date().toISOString().split('T')[0];
    input.setAttribute('min', today);
  }

  function getServicePrice(s, petType) {
    if (petType === 'dog' && (s.priceDog != null)) return s.priceDog;
    if (petType === 'cat' && (s.priceCat != null)) return s.priceCat;
    return s.price ?? s.priceDog ?? s.priceCat ?? 0;
  }

  function fillServiceSelect() {
    const select = document.getElementById('bookingService');
    if (!select) return;
    select.innerHTML = '<option value="">-- Chọn dịch vụ --</option>' +
      services.map(s => {
        const dogPrice = s.priceDog ?? s.price;
        const catPrice = s.priceCat ?? s.price;
        const priceText = (dogPrice !== catPrice)
          ? `Chó: ${formatPrice(dogPrice)} / Mèo: ${formatPrice(catPrice)}`
          : formatPrice(dogPrice);
        return `<option value="${s.id}" data-price-dog="${dogPrice || 0}" data-price-cat="${catPrice || 0}" data-price="${s.price ?? dogPrice ?? catPrice ?? 0}">${s.name} - ${priceText}</option>`;
      }).join('');

    const params = new URLSearchParams(window.location.search);
    const serviceId = params.get('service');
    const petParam = params.get('pet');
    if (serviceId) select.value = serviceId;
    if (petParam === 'dog' || petParam === 'cat') {
      const radio = document.querySelector(`input[name="petType"][value="${petParam}"]`);
      if (radio) radio.checked = true;
    }
  }

  function fillTimeSelect() {
    const select = document.getElementById('bookingTime');
    if (!select) return;
    const slots = getTimeSlots();
    select.innerHTML = '<option value="">-- Chọn giờ --</option>' +
      slots.map(t => `<option value="${t}">${t}</option>`).join('');
  }

  let currentStep = 1;
  const totalSteps = 4;

  function showPanel(step) {
    currentStep = step;
    document.querySelectorAll('.booking-panel').forEach(p => {
      p.classList.toggle('active', parseInt(p.dataset.panel, 10) === step);
    });
    document.querySelectorAll('.booking-step').forEach(s => {
      const n = parseInt(s.dataset.step, 10);
      s.classList.toggle('active', n === step);
      s.classList.toggle('done', n < step);
    });
    var formEl = document.getElementById('bookingForm');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validateStep1() {
    const service = document.getElementById('bookingService');
    const petType = document.querySelector('input[name="petType"]:checked');
    const weight = document.getElementById('petWeight');
    const petName = document.getElementById('petName');
    let valid = true;

    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-group input, .form-group select').forEach(el => el.classList.remove('error'));

    if (!service.value) {
      document.getElementById('errorService').textContent = 'Vui lòng chọn dịch vụ.';
      service.classList.add('error');
      valid = false;
    }
    if (!petType) {
      document.getElementById('errorPetType').textContent = 'Vui lòng chọn loại thú cưng.';
      valid = false;
    }
    if (!weight.value || parseFloat(weight.value) < 0.5) {
      document.getElementById('errorPetWeight').textContent = 'Cân nặng hợp lệ (từ 0.5 kg).';
      weight.classList.add('error');
      valid = false;
    }
    if (!petName.value.trim()) {
      document.getElementById('errorPetName').textContent = 'Vui lòng nhập tên thú cưng.';
      petName.classList.add('error');
      valid = false;
    }
    return valid;
  }

  function validateStep2() {
    const date = document.getElementById('bookingDate');
    const time = document.getElementById('bookingTime');
    let valid = true;

    document.getElementById('errorDate').textContent = '';
    document.getElementById('errorTime').textContent = '';
    date.classList.remove('error');
    time.classList.remove('error');

    if (!date.value) {
      document.getElementById('errorDate').textContent = 'Vui lòng chọn ngày.';
      date.classList.add('error');
      valid = false;
    }
    if (!time.value) {
      document.getElementById('errorTime').textContent = 'Vui lòng chọn giờ.';
      time.classList.add('error');
      valid = false;
    }
    return valid;
  }

  function validateStep3() {
    const ownerName = document.getElementById('ownerName');
    const ownerPhone = document.getElementById('ownerPhone');
    const ownerEmail = document.getElementById('ownerEmail');
    const ownerAddress = document.getElementById('ownerAddress');
    let valid = true;

    document.querySelectorAll('[id^="errorOwner"]').forEach(el => el.textContent = '');
    [ownerName, ownerPhone, ownerEmail, ownerAddress].forEach(el => el && el.classList.remove('error'));

    if (!ownerName.value.trim()) {
      document.getElementById('errorOwnerName').textContent = 'Vui lòng nhập họ tên.';
      ownerName.classList.add('error');
      valid = false;
    }
    const phone = ownerPhone.value.replace(/\s/g, '');
    if (!phone || phone.length < 10) {
      document.getElementById('errorOwnerPhone').textContent = 'Số điện thoại hợp lệ (ít nhất 10 số).';
      ownerPhone.classList.add('error');
      valid = false;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!ownerEmail.value.trim() || !emailRe.test(ownerEmail.value)) {
      document.getElementById('errorOwnerEmail').textContent = 'Email hợp lệ.';
      ownerEmail.classList.add('error');
      valid = false;
    }
    if (!ownerAddress.value.trim()) {
      document.getElementById('errorOwnerAddress').textContent = 'Vui lòng nhập địa chỉ.';
      ownerAddress.classList.add('error');
      valid = false;
    }
    return valid;
  }

  function getFormData() {
    const serviceId = document.getElementById('bookingService').value;
    const service = services.find(s => s.id === serviceId);
    const petType = document.querySelector('input[name="petType"]:checked')?.value || 'dog';
    const servicePrice = service ? getServicePrice(service, petType) : 0;
    return {
      serviceId,
      serviceName: service ? service.name : '',
      servicePrice,
      petType: document.querySelector('input[name="petType"]:checked')?.value || '',
      petWeight: document.getElementById('petWeight').value,
      petName: document.getElementById('petName').value.trim(),
      date: document.getElementById('bookingDate').value,
      time: document.getElementById('bookingTime').value,
      ownerName: document.getElementById('ownerName').value.trim(),
      ownerPhone: document.getElementById('ownerPhone').value.trim(),
      ownerEmail: document.getElementById('ownerEmail').value.trim(),
      ownerAddress: document.getElementById('ownerAddress').value.trim(),
      note: document.getElementById('note').value.trim()
    };
  }

  function renderSummary() {
    const d = getFormData();
    if (!d.serviceName) return;
    const petTypeLabel = d.petType === 'dog' ? 'Chó' : 'Mèo';
    const summary = document.getElementById('bookingSummary');
    if (!summary) return;
    summary.innerHTML = `
      <div class="booking-summary__block">
        <div class="booking-summary__block-title">Dịch vụ</div>
        <div class="booking-summary__row">
          <span class="booking-summary__label">Gói dịch vụ</span>
          <span class="booking-summary__value">${d.serviceName}</span>
        </div>
      </div>
      <div class="booking-summary__block">
        <div class="booking-summary__block-title">Thú cưng</div>
        <div class="booking-summary__row">
          <span class="booking-summary__label">Loại</span>
          <span class="booking-summary__value">${petTypeLabel}</span>
        </div>
        <div class="booking-summary__row">
          <span class="booking-summary__label">Tên</span>
          <span class="booking-summary__value">${d.petName}</span>
        </div>
        <div class="booking-summary__row">
          <span class="booking-summary__label">Cân nặng</span>
          <span class="booking-summary__value">${d.petWeight} kg</span>
        </div>
      </div>
      <div class="booking-summary__block">
        <div class="booking-summary__block-title">Lịch hẹn</div>
        <div class="booking-summary__row">
          <span class="booking-summary__label">Ngày</span>
          <span class="booking-summary__value">${d.date}</span>
        </div>
        <div class="booking-summary__row">
          <span class="booking-summary__label">Giờ</span>
          <span class="booking-summary__value">${d.time}</span>
        </div>
      </div>
      <div class="booking-summary__block">
        <div class="booking-summary__block-title">Liên hệ</div>
        <div class="booking-summary__row">
          <span class="booking-summary__label">Họ tên</span>
          <span class="booking-summary__value">${d.ownerName}</span>
        </div>
        <div class="booking-summary__row">
          <span class="booking-summary__label">Điện thoại</span>
          <span class="booking-summary__value">${d.ownerPhone}</span>
        </div>
        <div class="booking-summary__row">
          <span class="booking-summary__label">Email</span>
          <span class="booking-summary__value">${d.ownerEmail}</span>
        </div>
        <div class="booking-summary__row">
          <span class="booking-summary__label">Địa chỉ</span>
          <span class="booking-summary__value">${d.ownerAddress}</span>
        </div>
        ${d.note ? `<div class="booking-summary__row"><span class="booking-summary__label">Ghi chú</span><span class="booking-summary__value">${d.note}</span></div>` : ''}
      </div>
      <div class="booking-summary__total-block">
        <div class="booking-summary__total-row">
          <span>Tổng thanh toán</span>
          <span>${formatPrice(d.servicePrice)}</span>
        </div>
      </div>
    `;
  }

  function prefillUserInfo() {
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    const profile = window.getUserProfile ? window.getUserProfile() : {};
    if (user) {
      const nameEl = document.getElementById('ownerName');
      const emailEl = document.getElementById('ownerEmail');
      const phoneEl = document.getElementById('ownerPhone');
      const addrEl = document.getElementById('ownerAddress');
      if (nameEl && !nameEl.value) nameEl.value = profile.name || user.name || '';
      if (emailEl && !emailEl.value) emailEl.value = profile.email || user.email || '';
      if (phoneEl && !phoneEl.value) phoneEl.value = profile.phone || '';
      if (addrEl && !addrEl.value) addrEl.value = profile.address || '';
    }
  }

  function init() {
    setMinDate();
    fillServiceSelect();
    fillTimeSelect();
    prefillUserInfo();
    showPanel(1);

    document.getElementById('bookingForm').addEventListener('click', function (e) {
      const nextBtn = e.target.closest('[data-next]');
      const prevBtn = e.target.closest('[data-prev]');
      if (nextBtn) {
        const step = parseInt(nextBtn.dataset.next, 10);
        if (step === 2 && !validateStep1()) return;
        if (step === 3 && !validateStep2()) return;
        if (step === 4) {
          if (!validateStep3()) return;
          renderSummary();
        }
        showPanel(step);
      }
      if (prevBtn) {
        showPanel(parseInt(prevBtn.dataset.prev, 10));
      }
    });

    document.getElementById('bookingForm').addEventListener('submit', function (e) {
      e.preventDefault();
      const data = getFormData();
      const user = window.getCurrentUser ? window.getCurrentUser() : null;
      if (user && user.email) {
        data.ownerEmail = user.email.trim().toLowerCase();
      }
      saveBooking(data);
      alert('Đặt lịch thành công! Chúng tôi sẽ gọi xác nhận qua số ' + data.ownerPhone + '.');
      window.location.href = 'index.html';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

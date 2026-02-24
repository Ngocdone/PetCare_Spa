/**
 * Pet Spa & Shop - Contact Page
 * Form submit: show success message (no backend)
 */

(function () {
  'use strict';

  document.getElementById('contactForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    document.querySelectorAll('.contact-form .form-error').forEach(el => el.textContent = '');

    if (!name) {
      document.getElementById('errorContactName').textContent = 'Vui lòng nhập họ tên.';
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRe.test(email)) {
      document.getElementById('errorContactEmail').textContent = 'Email hợp lệ.';
      return;
    }
    if (!message) {
      document.getElementById('errorContactMessage').textContent = 'Vui lòng nhập nội dung.';
      return;
    }

    alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi qua email ' + email + ' trong thời gian sớm nhất.');
    this.reset();
  });
})();

/**
 * Pet Spa & Shop - Auth (Login / Register)
 * Simulate auth with localStorage. Admin: admin@petspa.vn / admin123 -> redirect to admin/index.html
 */

(function () {
  'use strict';

  const USERS_KEY = window.USERS_KEY || 'petspa_users';
  const CURRENT_USER_KEY = window.CURRENT_USER_KEY || 'petspa_current_user';
  const DATA = window.DATA || {};
  const adminUser = DATA.adminUser || { email: 'admin@petspa.vn', password: 'admin123', role: 'admin' };

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveUser(user) {
    const list = getUsers();
    if (list.find(u => u.email === user.email)) return false;
    list.push({
      id: 'u' + Date.now(),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: user.password,
      role: 'user',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
    return true;
  }

  function setCurrentUser(user) {
    try {
      const toSave = { id: user.id, name: user.name, email: user.email, role: user.role };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error(e);
    }
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null;
    } catch (e) {
      return null;
    }
  }

  function logout() {
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch (e) {
      console.error(e);
    }
  }

  window.getCurrentUser = getCurrentUser;
  window.logout = logout;

  function switchTab(tabName) {
    const tab = document.querySelector('.auth-tab[data-tab="' + tabName + '"]');
    const panel = tabName === 'login' ? document.getElementById('panelLogin') : document.getElementById('panelRegister');
    var tabsContainer = document.querySelector('.auth-tabs');
    document.querySelectorAll('.auth-tab').forEach(function (x) { x.classList.remove('active'); });
    document.querySelectorAll('.auth-panel').forEach(function (x) { x.classList.remove('active'); });
    if (tab) tab.classList.add('active');
    if (panel) panel.classList.add('active');
    if (tabsContainer) tabsContainer.setAttribute('data-active', tabName);
  }

  function initTabs() {
    document.querySelectorAll('.auth-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchTab(this.dataset.tab);
      });
    });
    document.querySelectorAll('.auth-switch__link').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(this.getAttribute('data-tab'));
      });
    });
  }

  function clearLoginErrors() {
    var emailEl = document.getElementById('loginEmail');
    var passEl = document.getElementById('loginPassword');
    var errEmail = document.getElementById('errorLoginEmail');
    var errPass = document.getElementById('errorLoginPassword');
    if (emailEl) emailEl.classList.remove('error');
    if (passEl) passEl.classList.remove('error');
    if (errEmail) errEmail.textContent = '';
    if (errPass) errPass.textContent = '';
  }

  function setLoginError(field, msg) {
    clearLoginErrors();
    if (field === 'email') {
      document.getElementById('loginEmail').classList.add('error');
      document.getElementById('errorLoginEmail').textContent = msg;
    } else {
      document.getElementById('loginPassword').classList.add('error');
      document.getElementById('errorLoginPassword').textContent = msg;
    }
  }

  function setLoginCredentialError() {
    clearLoginErrors();
    document.getElementById('loginEmail').classList.add('error');
    document.getElementById('loginPassword').classList.add('error');
    document.getElementById('errorLoginPassword').textContent = 'Email hoặc mật khẩu không đúng.';
  }

  document.getElementById('loginEmail')?.addEventListener('input', clearLoginErrors);
  document.getElementById('loginPassword')?.addEventListener('input', clearLoginErrors);

  /* Password show/hide toggle */
  document.querySelectorAll('.auth-field__toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = this.getAttribute('data-target');
      var input = document.getElementById(targetId);
      var icon = this.querySelector('i');
      if (!input || !icon) return;
      var isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      icon.className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
    });
  });

  document.getElementById('loginForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    clearLoginErrors();

    if (!email) {
      setLoginError('email', 'Vui lòng nhập email.');
      return;
    }
    if (!password) {
      setLoginError('password', 'Vui lòng nhập mật khẩu.');
      return;
    }

    if (email === adminUser.email && password === adminUser.password) {
      setCurrentUser({ id: 'admin', name: 'Admin', email: adminUser.email, role: 'admin' });
      window.location.href = 'admin/index.html';
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser({ id: user.id, name: user.name, email: user.email, role: user.role || 'user' });
      alert('Đăng nhập thành công!');
      const returnUrl = new URLSearchParams(window.location.search).get('return') || 'index.html';
      window.location.href = returnUrl;
      return;
    }

    setLoginCredentialError();
  });

  function clearRegisterErrors() {
    document.querySelectorAll('#panelRegister .auth-field input').forEach(function (inp) { inp.classList.remove('error'); });
    document.querySelectorAll('#panelRegister .auth-field__error').forEach(function (el) { el.textContent = ''; });
  }

  document.querySelectorAll('#panelRegister .auth-field input').forEach(function (inp) {
    inp.addEventListener('input', clearRegisterErrors);
  });

  document.getElementById('registerForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    clearRegisterErrors();

    if (!name) {
      document.getElementById('regName').classList.add('error');
      document.getElementById('errorRegName').textContent = 'Vui lòng nhập họ tên.';
      return;
    }
    if (!email) {
      document.getElementById('regEmail').classList.add('error');
      document.getElementById('errorRegEmail').textContent = 'Vui lòng nhập email.';
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      document.getElementById('regEmail').classList.add('error');
      document.getElementById('errorRegEmail').textContent = 'Email không hợp lệ.';
      return;
    }
    if (password.length < 6) {
      document.getElementById('regPassword').classList.add('error');
      document.getElementById('errorRegPassword').textContent = 'Mật khẩu ít nhất 6 ký tự.';
      return;
    }
    if (password !== passwordConfirm) {
      document.getElementById('regPasswordConfirm').classList.add('error');
      document.getElementById('errorRegPasswordConfirm').textContent = 'Xác nhận mật khẩu không khớp.';
      return;
    }

    if (getUsers().some(u => u.email === email)) {
      document.getElementById('regEmail').classList.add('error');
      document.getElementById('errorRegEmail').textContent = 'Email đã được đăng ký.';
      return;
    }

    const saved = saveUser({ name, email, phone, password });
    if (saved) {
      setCurrentUser({ id: 'u' + Date.now(), name, email, role: 'user' });
      alert('Đăng ký thành công! Đang chuyển đến trang chủ.');
      window.location.href = 'index.html';
    } else {
      document.getElementById('regEmail').classList.add('error');
      document.getElementById('errorRegEmail').textContent = 'Email đã được đăng ký.';
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTabs);
  } else {
    initTabs();
  }
})();

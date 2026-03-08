/**
 * Pet Spa & Shop - Common JS
 * Cart badge, mobile menu, sticky header, localStorage helpers
 */

(function () {
  'use strict';

  // ---------- Cart (localStorage) ----------
  const CART_KEY = 'petspa_cart';
  const BOOKINGS_KEY = 'petspa_bookings';
  const USERS_KEY = 'petspa_users';
  const CURRENT_USER_KEY = 'petspa_current_user';

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function getCartCount() {
    return getCart().reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  function updateCartBadge() {
    const badges = document.querySelectorAll('.header__cart-badge, .cart-count');
    const count = getCartCount();
    badges.forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function getUserProfile() {
    try {
      return JSON.parse(localStorage.getItem('petspa_user_profile')) || {};
    } catch (e) {
      return {};
    }
  }

  window.getCart = getCart;
  window.getCartCount = getCartCount;
  window.updateCartBadge = updateCartBadge;
  window.getCurrentUser = getCurrentUser;
  window.getUserProfile = getUserProfile;
  window.CART_KEY = CART_KEY;
  window.BOOKINGS_KEY = BOOKINGS_KEY;
  window.USERS_KEY = USERS_KEY;
  window.CURRENT_USER_KEY = CURRENT_USER_KEY;

  // ---------- User dropdown ----------
  function renderUserDropdown(container) {
    if (!container) return;
    const user = getCurrentUser();
    let html = '';
    if (user) {
      html = '<a href="user.html"><i class="fas fa-user-circle"></i> Tài khoản</a>';
      if (user.role === 'admin') {
        html += '<a href="admin/index.html"><i class="fas fa-cog"></i> Quản trị</a>';
      }
      html += '<div class="header__user-dropdown__divider"></div>';
      html += '<button type="button" class="user-logout-btn"><i class="fas fa-sign-out-alt"></i> Đăng xuất</button>';
    } else {
      html = '<a href="login.html"><i class="fas fa-sign-in-alt"></i> Đăng nhập</a>';
    }
    container.innerHTML = html;
    container.querySelectorAll('.user-logout-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
<<<<<<< HEAD
        // Clear user session
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem('petspa_current_user');
        // Clear cart when logout - use direct key to ensure it works
        localStorage.removeItem('petspa_cart');
        // Also clear any session cart
        sessionStorage.removeItem('petspa_cart');
        // Update badge
        const badges = document.querySelectorAll('.header__cart-badge, .cart-count');
        badges.forEach(el => {
          el.textContent = '0';
          el.style.display = 'none';
        });
=======
        localStorage.removeItem(CURRENT_USER_KEY);
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
        container.innerHTML = '<a href="login.html"><i class="fas fa-sign-in-alt"></i> Đăng nhập</a>';
        window.location.href = 'index.html';
      });
    });
  }

  function initUserDropdown() {
    const wraps = document.querySelectorAll('.header__user-wrap');
    wraps.forEach((wrap) => {
      const btn = wrap.querySelector('.header__user-btn');
      const dropdown = wrap.querySelector('.header__user-dropdown');
      if (!btn || !dropdown) return;
      renderUserDropdown(dropdown);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('is-open');
        document.querySelectorAll('.header__user-dropdown').forEach((d) => d.classList.remove('is-open'));
        document.querySelectorAll('.header__user-btn').forEach((b) => b.setAttribute('aria-expanded', 'false'));
        if (!isOpen) {
          dropdown.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
    document.addEventListener('click', () => {
      document.querySelectorAll('.header__user-dropdown').forEach((d) => d.classList.remove('is-open'));
      document.querySelectorAll('.header__user-btn').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    });
  }

  // ---------- Sticky header ----------
  function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    const onScroll = () => {
      if (window.scrollY > 50) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Mobile menu ----------
  function initMobileMenu() {
    const toggle = document.querySelector('.header__menu-toggle');
    const menu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const closeBtn = document.querySelector('.mobile-menu__close');
    if (!toggle || !menu) return;

    function openMenu() {
      menu.classList.add('open');
      overlay?.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      menu.classList.remove('open');
      overlay?.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', openMenu);
    closeBtn?.addEventListener('click', closeMenu);
    overlay?.addEventListener('click', closeMenu);
    menu.querySelectorAll('.mobile-menu__link').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // ---------- Active nav link ----------
  function setActiveNav() {
    const path = window.location.pathname.replace(/^\//, '') || 'index.html';
    document.querySelectorAll('.nav__link[data-page]').forEach(link => {
      const page = link.getAttribute('data-page');
      if (path === page || (path === '' && page === 'index.html')) {
        link.classList.add('nav__link--active');
      }
    });
  }

  // ---------- Smooth scroll for anchor ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---------- Init on DOM ready ----------
  function init() {
<<<<<<< HEAD
    // Check if user is logged in, if not clear cart
    const currentUser = getCurrentUser();
    if (!currentUser) {
      // Clear cart if not logged in (for security)
      try {
        localStorage.setItem(CART_KEY, JSON.stringify([]));
      } catch (e) {
        console.error(e);
      }
    }
=======
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    initHeader();
    initMobileMenu();
    initUserDropdown();
    setActiveNav();
    updateCartBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

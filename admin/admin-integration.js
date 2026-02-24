/**
 * Admin Integration - Kết nối Admin với Web chính
 * Auth check, dữ liệu dùng chung (localStorage), liên kết
 */
(function () {
  'use strict';

  const ORDERS_KEY = 'petspa_orders';
  const BOOKINGS_KEY = 'petspa_bookings';
  const PRODUCTS_KEY = 'petspa_products';
  const CATEGORIES_KEY = 'petspa_categories';
  const USERS_KEY = 'petspa_users';
  const SERVICES_KEY = 'petspa_services';
  const GALLERY_KEY = 'petspa_gallery';
  const CURRENT_USER_KEY = 'petspa_current_user';

  const DEFAULT_CATEGORIES = [
    { id: 'thuc-an', name: 'Thức ăn', slug: 'thuc-an', order: 1 },
    { id: 'cham-soc', name: 'Chăm sóc', slug: 'cham-soc', order: 2 },
    { id: 'phu-kien', name: 'Phụ kiện', slug: 'phu-kien', order: 3 },
    { id: 'do-choi', name: 'Đồ chơi', slug: 'do-choi', order: 4 },
    { id: 'dich-vu', name: 'Dịch vụ', slug: 'dich-vu', order: 5 }
  ];

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null;
    } catch (e) {
      return null;
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
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
  }

  function getCategories() {
    try {
      const saved = localStorage.getItem(CATEGORIES_KEY);
      if (saved) return JSON.parse(saved);
      return DEFAULT_CATEGORIES.slice();
    } catch (e) {
      return DEFAULT_CATEGORIES.slice();
    }
  }

  function setCategories(list) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(list));
  }

  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function setOrders(list) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  }

  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function setBookings(list) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function setUsers(list) {
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
  }

  function getServices() {
    try {
      const saved = localStorage.getItem(SERVICES_KEY);
      if (saved) return JSON.parse(saved);
      return (window.DATA && window.DATA.services) || [];
    } catch (e) {
      return [];
    }
  }

  function setServices(list) {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(list));
  }

  function getGallery() {
    try {
      const saved = localStorage.getItem(GALLERY_KEY);
      if (saved) return JSON.parse(saved);
      return (window.DATA && window.DATA.gallery) || [];
    } catch (e) {
      return [];
    }
  }

  function setGallery(list) {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(list));
  }

  function formatPrice(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  }

  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    const isInPages = window.location.pathname.indexOf('pages') >= 0;
    const loginPath = isInPages ? '../../login.html' : '../login.html';
    window.location.href = loginPath + '?return=' + encodeURIComponent('admin/index.html');
  }

  window.AdminData = {
    getProducts,
    setProducts,
    getCategories,
    setCategories,
    DEFAULT_CATEGORIES,
    getOrders,
    setOrders,
    getBookings,
    setBookings,
    getUsers,
    setUsers,
    getServices,
    setServices,
    getGallery,
    setGallery,
    formatPrice,
    PRODUCTS_KEY,
    CATEGORIES_KEY,
    SERVICES_KEY,
    GALLERY_KEY,
    ORDERS_KEY,
    BOOKINGS_KEY,
    USERS_KEY
  };
})();

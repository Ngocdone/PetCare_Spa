/**
<<<<<<< HEAD
 * Admin Integration - Kết nối Admin với Database (MySQL)
 * Auth check, dữ liệu từ API server
=======
 * Admin Integration - Kết nối Admin với Web chính
 * Auth check, dữ liệu dùng chung (localStorage), liên kết
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
 */
(function () {
  'use strict';

<<<<<<< HEAD
  const API_BASE = 'http://localhost:3000/api';
  const CURRENT_USER_KEY = 'petspa_current_user';
  const TOKEN_KEY = 'petspa_token';

  // Cache for data
  let cache = {
    products: null,
    categories: null,
    services: null,
    bookings: null,
    orders: null,
    users: null,
    gallery: null,
    team: null,
    testimonials: null,
    faqs: null,
    brands: null
  };

  // Loading state
  let loading = {
    products: false,
    categories: false,
    services: false,
    bookings: false,
    orders: false,
    users: false,
    gallery: false,
    team: false,
    testimonials: false,
    faqs: false,
    brands: false
  };

  // Default categories
  const DEFAULT_CATEGORIES = [
    { id: 'thuc-an', name: 'Thức ăn', slug: 'thuc-an', category_order: 1 },
    { id: 'cham-soc', name: 'Chăm sóc', slug: 'cham-soc', category_order: 2 },
    { id: 'phu-kien', name: 'Phụ kiện', slug: 'phu-kien', category_order: 3 },
    { id: 'do-choi', name: 'Đồ chơi', slug: 'do-choi', category_order: 4 },
    { id: 'dich-vu', name: 'Dịch vụ', slug: 'dich-vu', category_order: 5 }
  ];

  // Get token from localStorage
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
  }

  // Get current user
=======
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

>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null;
    } catch (e) {
      return null;
    }
  }

<<<<<<< HEAD
  // API helper with auth
  async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };
    
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API Error');
    }
    return data;
  }

  // Products - async function that returns data
  async function getProducts() {
    if (cache.products && cache.products.length > 0) {
      return cache.products;
    }
    
    if (loading.products) {
      // Wait for existing request to complete
      while (loading.products) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return cache.products || [];
    }
    
    loading.products = true;
    try {
      const data = await apiFetch(`${API_BASE}/products`);
      cache.products = data;
      return data;
    } catch (e) {
      console.error('API Error fetching products, trying localStorage:', e);
      // Try to get from localStorage as fallback
      try {
        const saved = localStorage.getItem('petspa_products');
        if (saved) {
          cache.products = JSON.parse(saved);
          return cache.products;
        }
      } catch (localErr) {
        console.error('Error reading from localStorage:', localErr);
      }
      // Also try window.DATA as fallback
      if (typeof window.DATA !== 'undefined' && window.DATA && window.DATA.products) {
        cache.products = window.DATA.products;
        return cache.products;
      }
      return cache.products || [];
    } finally {
      loading.products = false;
    }
  }

  // Synchronous version for immediate display (may return stale data)
  function getProductsSync() {
    return cache.products || [];
  }

  async function setProducts(list) {
    // Update cache immediately with new products
    cache.products = list;
    
    // Try to sync with database first
    try {
      for (const product of list) {
        if (!product.id || product.id.startsWith('p')) {
          // New product - create
          await apiFetch(`${API_BASE}/products`, {
            method: 'POST',
            body: JSON.stringify(product)
          });
        }
      }
      // Refresh cache from server
      const data = await apiFetch(`${API_BASE}/products`);
      cache.products = data;
      return true;
    } catch (e) {
      console.error('API Error saving products, falling back to localStorage:', e);
      // Fallback to localStorage when API fails
      try {
        localStorage.setItem('petspa_products', JSON.stringify(list));
        return true;
      } catch (localErr) {
        console.error('Error saving to localStorage:', localErr);
        return false;
      }
    }
  }

  // Categories - async function
  async function getCategories() {
    if (cache.categories && cache.categories.length > 0) {
      return cache.categories;
    }
    
    if (loading.categories) {
      while (loading.categories) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return cache.categories || DEFAULT_CATEGORIES;
    }
    
    loading.categories = true;
    try {
      const data = await apiFetch(`${API_BASE}/categories`);
      cache.categories = data.length > 0 ? data : DEFAULT_CATEGORIES;
      return cache.categories;
    } catch (e) {
      console.error('API Error fetching categories, trying localStorage:', e);
      // Try to get from localStorage as fallback
      try {
        const saved = localStorage.getItem('petspa_categories');
        if (saved) {
          cache.categories = JSON.parse(saved);
          return cache.categories;
        }
      } catch (localErr) {
        console.error('Error reading from localStorage:', localErr);
      }
      // Also try window.DATA as fallback
      if (typeof window.DATA !== 'undefined' && window.DATA && window.DATA.categories) {
        cache.categories = window.DATA.categories;
        return cache.categories;
      }
      return cache.categories || DEFAULT_CATEGORIES;
    } finally {
      loading.categories = false;
    }
  }

  // Sync version
  function getCategoriesSync() {
    return cache.categories || DEFAULT_CATEGORIES;
  }

  async function setCategories(list) {
    cache.categories = list;
    
    try {
      for (const cat of list) {
        if (!cat.id || cat.id.startsWith('c')) {
          await apiFetch(`${API_BASE}/categories`, {
            method: 'POST',
            body: JSON.stringify(cat)
          });
        }
      }
      const data = await apiFetch(`${API_BASE}/categories`);
      cache.categories = data.length > 0 ? data : DEFAULT_CATEGORIES;
      return true;
    } catch (e) {
      console.error('API Error saving categories, falling back to localStorage:', e);
      // Fallback to localStorage when API fails
      try {
        localStorage.setItem('petspa_categories', JSON.stringify(list));
        return true;
      } catch (localErr) {
        console.error('Error saving to localStorage:', localErr);
        return false;
      }
    }
  }

  // Services - async function
  async function getServices() {
    if (cache.services && cache.services.length > 0) {
      return cache.services;
    }
    
    if (loading.services) {
      while (loading.services) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return cache.services || [];
    }
    
    loading.services = true;
    try {
      const data = await apiFetch(`${API_BASE}/services`);
      cache.services = data;
      return data;
    } catch (e) {
      console.error('API Error fetching services, trying localStorage:', e);
      // Try to get from localStorage as fallback
      try {
        const saved = localStorage.getItem('petspa_services');
        if (saved) {
          cache.services = JSON.parse(saved);
          return cache.services;
        }
      } catch (localErr) {
        console.error('Error reading from localStorage:', localErr);
      }
      // Also try window.DATA as fallback
      if (typeof window.DATA !== 'undefined' && window.DATA && window.DATA.services) {
        cache.services = window.DATA.services;
        return cache.services;
      }
      return cache.services || [];
    } finally {
      loading.services = false;
    }
  }

  function getServicesSync() {
    return cache.services || [];
  }

  async function setServices(list) {
    cache.services = list;
    
    try {
      for (const service of list) {
        if (!service.id || typeof service.id === 'string') {
          await apiFetch(`${API_BASE}/services`, {
            method: 'POST',
            body: JSON.stringify(service)
          });
        }
      }
      const data = await apiFetch(`${API_BASE}/services`);
      cache.services = data;
      return true;
    } catch (e) {
      console.error('API Error saving services, falling back to localStorage:', e);
      // Fallback to localStorage when API fails
      try {
        localStorage.setItem('petspa_services', JSON.stringify(list));
        return true;
      } catch (localErr) {
        console.error('Error saving to localStorage:', localErr);
        return false;
      }
    }
  }

  // Bookings - async function
  async function getBookings() {
    if (cache.bookings && cache.bookings.length > 0) {
      return cache.bookings;
    }
    
    if (loading.bookings) {
      while (loading.bookings) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return cache.bookings || [];
    }
    
    loading.bookings = true;
    try {
      const data = await apiFetch(`${API_BASE}/bookings/all`);
      const transformed = data.map(b => ({
        id: b.id,
        serviceName: b.service_name,
        servicePrice: b.service_price,
        petType: b.pet_type,
        petName: b.pet_name,
        date: b.booking_date ? b.booking_date.split('T')[0] : '',
        time: b.booking_time ? b.booking_time.substring(0, 5) : '',
        ownerName: b.owner_name,
        ownerPhone: b.owner_phone,
        ownerEmail: b.owner_email,
        ownerAddress: b.owner_address,
        note: b.note,
        status: b.status,
        userId: b.user_id,
        createdAt: b.created_at
      }));
      cache.bookings = transformed;
      return transformed;
    } catch (e) {
      console.error('Error fetching bookings:', e);
      return cache.bookings || [];
    } finally {
      loading.bookings = false;
    }
  }

  function getBookingsSync() {
    return cache.bookings || [];
  }

  async function setBookings(list) {
    cache.bookings = list;
    
    try {
      // Get current bookings from server to compare
      const serverBookings = await apiFetch(`${API_BASE}/bookings/all`);
      const serverBookingIds = new Set(serverBookings.map(b => b.id));
      
      for (const booking of list) {
        if (!booking.id || typeof booking.id === 'string') {
          // New booking (string ID like 'b123...') - create it
          await apiFetch(`${API_BASE}/bookings`, {
            method: 'POST',
            body: JSON.stringify(booking)
          });
        } else if (serverBookingIds.has(booking.id)) {
          // Existing booking - update status using PUT
          await apiFetch(`${API_BASE}/bookings/${booking.id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: booking.status })
          });
        }
      }
      
      // Refresh cache from server
      const data = await apiFetch(`${API_BASE}/bookings/all`);
      const transformed = data.map(b => ({
        id: b.id,
        serviceName: b.service_name,
        servicePrice: b.service_price,
        petType: b.pet_type,
        petName: b.pet_name,
        date: b.booking_date ? b.booking_date.split('T')[0] : '',
        time: b.booking_time ? b.booking_time.substring(0, 5) : '',
        ownerName: b.owner_name,
        ownerPhone: b.owner_phone,
        ownerEmail: b.owner_email,
        ownerAddress: b.owner_address,
        note: b.note,
        status: b.status,
        userId: b.user_id,
        createdAt: b.created_at
      }));
      cache.bookings = transformed;
      return true;
    } catch (e) {
      console.error('Error saving bookings:', e);
      return false;
    }
  }

  // Orders - async function
  async function getOrders() {
    if (cache.orders && cache.orders.length > 0) {
      return cache.orders;
    }
    
    if (loading.orders) {
      while (loading.orders) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return cache.orders || [];
    }
    
    loading.orders = true;
    try {
      const data = await apiFetch(`${API_BASE}/orders`);
      cache.orders = data;
      return data;
    } catch (e) {
      console.error('Error fetching orders:', e);
      return cache.orders || [];
    } finally {
      loading.orders = false;
    }
  }

  function getOrdersSync() {
    return cache.orders || [];
  }

  async function setOrders(list) {
    cache.orders = list;
    
    try {
      for (const order of list) {
        if (!order.id || typeof order.id === 'string') {
          await apiFetch(`${API_BASE}/orders`, {
            method: 'POST',
            body: JSON.stringify(order)
          });
        }
      }
      const data = await apiFetch(`${API_BASE}/orders`);
      cache.orders = data;
      return true;
    } catch (e) {
      console.error('Error saving orders:', e);
      return false;
    }
  }

  // Users - async function
  async function getUsers() {
    if (cache.users && cache.users.length > 0) {
      return cache.users;
    }
    
    if (loading.users) {
      while (loading.users) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return cache.users || [];
    }
    
    loading.users = true;
    try {
      const data = await apiFetch(`${API_BASE}/users`);
      cache.users = data;
      return data;
    } catch (e) {
      console.error('Error fetching users:', e);
      return cache.users || [];
    } finally {
      loading.users = false;
    }
  }

  function getUsersSync() {
    return cache.users || [];
  }

  async function setUsers(list) {
    cache.users = list;
    
    try {
      for (const user of list) {
        if (!user.id || typeof user.id === 'string') {
          await apiFetch(`${API_BASE}/users`, {
            method: 'POST',
            body: JSON.stringify(user)
          });
        }
      }
      const data = await apiFetch(`${API_BASE}/users`);
      cache.users = data;
      return true;
    } catch (e) {
      console.error('Error saving users:', e);
      return false;
    }
  }

  // Gallery - async function
  async function getGallery() {
    if (cache.gallery && cache.gallery.length > 0) {
      return cache.gallery;
    }
    
    if (loading.gallery) {
      while (loading.gallery) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return cache.gallery || [];
    }
    
    loading.gallery = true;
    try {
      const data = await apiFetch(`${API_BASE}/gallery`);
      cache.gallery = data;
      return data;
    } catch (e) {
      console.error('Error fetching gallery:', e);
      return cache.gallery || [];
    } finally {
      loading.gallery = false;
    }
  }

  function getGallerySync() {
    return cache.gallery || [];
  }

  async function setGallery(list) {
    cache.gallery = list;
    
    try {
      for (const item of list) {
        if (!item.id || typeof item.id === 'string') {
          await apiFetch(`${API_BASE}/gallery`, {
            method: 'POST',
            body: JSON.stringify(item)
          });
        }
      }
      const data = await apiFetch(`${API_BASE}/gallery`);
      cache.gallery = data;
      return true;
    } catch (e) {
      console.error('Error saving gallery:', e);
      return false;
    }
  }

  // Team - async function
  async function getTeam() {
    if (cache.team && cache.team.length > 0) {
      return cache.team;
    }
    
    if (loading.team) {
      while (loading.team) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return cache.team || [];
    }
    
    loading.team = true;
    try {
      const data = await apiFetch(`${API_BASE}/content/team`);
      cache.team = data;
      return data;
    } catch (e) {
      console.error('Error fetching team:', e);
      return cache.team || [];
    } finally {
      loading.team = false;
    }
  }

  function getTeamSync() {
    return cache.team || [];
  }

  // Testimonials - async function
  async function getTestimonials() {
    if (cache.testimonials && cache.testimonials.length > 0) {
      return cache.testimonials;
    }
    
    if (loading.testimonials) {
      while (loading.testimonials) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return cache.testimonials || [];
    }
    
    loading.testimonials = true;
    try {
      const data = await apiFetch(`${API_BASE}/content/testimonials`);
      cache.testimonials = data;
      return data;
    } catch (e) {
      console.error('Error fetching testimonials:', e);
      return cache.testimonials || [];
    } finally {
      loading.testimonials = false;
    }
  }

  function getTestimonialsSync() {
    return cache.testimonials || [];
  }

  // FAQs - async function
  async function getFaqs() {
    if (cache.faqs && cache.faqs.length > 0) {
      return cache.faqs;
    }
    
    if (loading.faqs) {
      while (loading.faqs) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return cache.faqs || [];
    }
    
    loading.faqs = true;
    try {
      const data = await apiFetch(`${API_BASE}/content/faqs`);
      cache.faqs = data;
      return data;
    } catch (e) {
      console.error('Error fetching faqs:', e);
      return cache.faqs || [];
    } finally {
      loading.faqs = false;
    }
  }

  function getFaqsSync() {
    return cache.faqs || [];
  }

  // Brands - async function
  async function getBrands() {
    if (cache.brands && cache.brands.length > 0) {
      return cache.brands;
    }
    
    if (loading.brands) {
      while (loading.brands) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return cache.brands || [];
    }
    
    loading.brands = true;
    try {
      const data = await apiFetch(`${API_BASE}/content/brands`);
      cache.brands = data;
      return data;
    } catch (e) {
      console.error('Error fetching brands:', e);
      return cache.brands || [];
    } finally {
      loading.brands = false;
    }
  }

  function getBrandsSync() {
    return cache.brands || [];
  }

  // Format price
=======
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

>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  function formatPrice(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  }

<<<<<<< HEAD
  // Check auth - chỉ warn nếu không có user, không redirect
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    console.warn('Admin warning: Not logged in as admin. Data may still load from API.');
  }

  // Expose to window
  window.AdminData = {
    // Products - async
    getProducts,
    getProductsSync,
    setProducts,
    
    // Categories - async
    getCategories,
    getCategoriesSync,
    setCategories,
    DEFAULT_CATEGORIES,
    
    // Services - async
    getServices,
    getServicesSync,
    setServices,
    
    // Bookings - async
    getBookings,
    getBookingsSync,
    setBookings,
    
    // Orders - async
    getOrders,
    getOrdersSync,
    setOrders,
    
    // Users - async
    getUsers,
    getUsersSync,
    setUsers,
    
    // Gallery - async
    getGallery,
    getGallerySync,
    setGallery,
    
    // Content - async
    getTeam,
    getTeamSync,
    getTestimonials,
    getTestimonialsSync,
    getFaqs,
    getFaqsSync,
    getBrands,
    getBrandsSync,
    
    // Utils
    formatPrice,
    API_BASE,
    
    // Keys
    PRODUCTS_KEY: 'petspa_products',
    CATEGORIES_KEY: 'petspa_categories',
    SERVICES_KEY: 'petspa_services',
    GALLERY_KEY: 'petspa_gallery',
    ORDERS_KEY: 'petspa_orders',
    BOOKINGS_KEY: 'petspa_bookings',
    USERS_KEY: 'petspa_users'
  };

  // Auto-load data when admin page loads
  console.log('Admin Data Integration: Connecting to database...');
  
  // Initial load - fire all requests but don't wait
  getProducts();
  getCategories();
  getServices();
  getBookings();
  getOrders();
  getUsers();
  getGallery();
  getTeam();
  getTestimonials();
  getFaqs();
  getBrands();
})();


// Utility function: Convert file to base64 data URL
window.fileToBase64 = function(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Utility function: Handle image file input and return base64 URL
window.handleImageUpload = async function(fileInput, callback) {
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return;
  }
  const file = fileInput.files[0];
  // Validate file type
  if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
    alert('Vui lòng chọn file ảnh (JPEG, PNG, GIF, hoặc WebP)');
    fileInput.value = '';
    return;
  }
  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('Kích thước ảnh tối đa 2MB');
    fileInput.value = '';
    return;
  }
  try {
    const base64 = await window.fileToBase64(file);
    if (callback && typeof callback === 'function') {
      callback(base64);
    }
  } catch (err) {
    console.error('Lỗi upload ảnh:', err);
    alert('Lỗi khi upload ảnh. Vui lòng thử lại.');
  }
};

// Toggle sidebar on mobile
(function () {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("mobile-toggle");
  const backdrop = document.getElementById("modal-backdrop");

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("sidebar--open");
    });
  }

  // Close sidebar when clicking outside on small screens (optional improvement)
  window.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 720 &&
      sidebar &&
      sidebar.classList.contains("sidebar--open")
    ) {
      const clickInsideSidebar = sidebar.contains(e.target);
      const clickOnToggle = toggleBtn && toggleBtn.contains(e.target);
      if (!clickInsideSidebar && !clickOnToggle) {
        sidebar.classList.remove("sidebar--open");
      }
    }
  });

  // Modal helpers
  const openButtons = document.querySelectorAll("[data-open-modal]");
  const closeButtons = document.querySelectorAll("[data-close-modal]");

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    // Hiển thị modal bằng style, tránh phụ thuộc vào thuộc tính hidden
    modal.style.display = "flex";
    modal.setAttribute("data-open", "true");
    if (backdrop) {
      backdrop.style.display = "block";
    }
  }

  function closeModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.style.display = "none";
      modal.removeAttribute("data-open");
    });
    if (backdrop) {
      backdrop.style.display = "none";
    }
  }

  openButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-open-modal");
      if (!id) return;
      const modal = document.getElementById(id);
      const isOpen = modal && modal.getAttribute("data-open") === "true";

      if (isOpen) {
        // Nếu đang mở rồi thì bấm lại sẽ tắt
        closeModals();
      } else {
        closeModals();
        openModal(id);
      }
    });
  });

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModals();
    });
  });

  if (backdrop) {
    backdrop.addEventListener("click", () => {
      closeModals();
    });
  }

  // Đóng modal khi bấm phím Escape
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModals();
    }
  });

  // Modal helpers - removed duplicate product form handler (now handled in products.html inline script)
  
  // Thêm link ảnh (nhiều URL)
  document.getElementById("btn-add-image-url")?.addEventListener("click", function () {
    const wrap = document.getElementById("quick-product-images-wrap");
    if (!wrap) return;
    const row = document.createElement("div");
    row.className = "image-url-row";
    row.innerHTML = '<input type="text" class="quick-product-image-url" placeholder="https://... hoặc đường dẫn ảnh" /><button type="button" class="btn btn--ghost btn--sm btn-remove-image" title="Xóa">✕</button>';
    wrap.appendChild(row);
  });
  document.getElementById("quick-product-images-wrap")?.addEventListener("click", function (e) {
    if (e.target.classList.contains("btn-remove-image")) {
      const row = e.target.closest(".image-url-row");
      const wrap = document.getElementById("quick-product-images-wrap");
      if (row && wrap && wrap.querySelectorAll(".image-url-row").length > 1) row.remove();
    }
  });

  // Reset product modal when opening for Add (tránh dữ liệu cũ khi bấm Thêm)
  document.querySelectorAll("[data-open-modal='product-modal']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idInput = document.getElementById("product-id");
      if (idInput) idInput.value = "";
      const wrap = document.getElementById("quick-product-images-wrap");
      if (wrap) {
        wrap.innerHTML = '<div class="image-url-row"><input type="text" class="quick-product-image-url" placeholder="https://... hoặc đường dẫn ảnh" /><button type="button" class="btn btn--ghost btn--sm btn-remove-image" title="Xóa">✕</button></div>';
      }
      const titleEl = document.getElementById("product-modal-title");
      const submitBtn = document.getElementById("product-submit-btn");
      if (titleEl) titleEl.textContent = "Thêm sản phẩm mới";
      if (submitBtn) submitBtn.textContent = "Thêm sản phẩm";
      // Reset uploaded file
      window.uploadedProductImageBase64 = null;
      var fileInput = document.getElementById('quick-product-image-file');
      if (fileInput) fileInput.value = '';
      var fileNameSpan = document.getElementById('quick-product-file-name');
      if (fileNameSpan) fileNameSpan.textContent = '';
    });
  });

  // Tạo lịch hẹn - lưu vào database
  document.querySelectorAll('#appointment-modal form, .modal[id="appointment-modal"] form').forEach(function (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var customer = document.getElementById("quick-customer-name");
      var pet = document.getElementById("quick-pet-type");
      var timeInput = document.getElementById("quick-time");
      var dateInput = document.getElementById("quick-date");
      var serviceSelect = document.getElementById("quick-service");
      if (!customer || !pet || !timeInput) return;
      var ownerName = customer.value.trim();
      var petName = pet.value.trim();
      var time = timeInput.value;
      var date = dateInput ? dateInput.value : new Date().toISOString().split("T")[0];
      var serviceName = serviceSelect ? serviceSelect.value : "Dịch vụ spa";
      if (!ownerName || !petName || !time) return;
      if (window.AdminData) {
        // Get current bookings list - use await since getBookings is async
        var bookings = await window.AdminData.getBookings();
        var list = bookings.slice();
        list.push({
          id: "b" + Date.now(),
          ownerName: ownerName,
          petName: petName,
          date: date,
          time: time,
          serviceName: serviceName,
          status: "pending"
        });
        await window.AdminData.setBookings(list);
      }
      form.reset();
      closeModals();
      if (window.adminRenderAppointments) window.adminRenderAppointments();
      if (typeof alert === "function") alert("Đã tạo lịch hẹn. Xem tại trang Lịch hẹn hoặc booking.html.");
    });
  });

  // Search filter for products page - xử lý trong products inline script
})();

=======
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
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

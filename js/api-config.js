/**
 * Pet Spa & Shop - API Config
 * Base URL cho API Node.js + MongoDB
 */
(function () {
  'use strict';
  const API_BASE = window.location.origin + '/api';
  const AUTH_KEY = 'petspa_token';
  const USER_KEY = 'petspa_current_user';

  function getToken() {
    return localStorage.getItem(AUTH_KEY) || '';
  }

  function setToken(token) {
    if (token) localStorage.setItem(AUTH_KEY, token);
    else localStorage.removeItem(AUTH_KEY);
  }

  function getStoredUser() {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (e) { return null; }
  }

  function setStoredUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }

  async function fetchApi(path, options = {}) {
    const url = API_BASE + path;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Lỗi API');
    return data;
  }

  window.API = {
    BASE: API_BASE,
    AUTH_KEY,
    USER_KEY,
    getToken,
    setToken,
    getStoredUser,
    setStoredUser,
    fetch: fetchApi
  };
})();

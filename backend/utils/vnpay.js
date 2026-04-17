/**
 * VNPay thanh toán — ký & kiểm tra chữ ký HMAC SHA512 (cổng 2.1.0).
 * Chuỗi ký: cùng quy ước package `vnpay` (npm) — HMAC trên query string do URLSearchParams
 * (đã encode), không phải chuỗi qs.stringify encode:false.
 *
 * Luồng thanh toán: ensureAwaitingPaymentStatus (ENUM DB) → buildPaymentUrl (sort key + HMAC) →
 * khách redirect VNPay → return/ipn gọi verifyReturnQuery (bỏ vnp_SecureHash, so sánh hash).
 */
const crypto = require('crypto');
const { pool } = require('../config/db');

let awaitingStatusEnsured = false;

async function ensureAwaitingPaymentStatus() {
  if (awaitingStatusEnsured) return;
  try {
    const [rows] = await pool.query(`SHOW COLUMNS FROM don_hang LIKE 'trang_thai'`);
    const type = rows[0]?.Type || '';
    if (String(type).includes('cho_thanh_toan')) {
      awaitingStatusEnsured = true;
      return;
    }
    await pool.query(`
      ALTER TABLE don_hang MODIFY COLUMN trang_thai
      ENUM('cho_xu_ly','cho_thanh_toan','da_xac_nhan','dang_giao','hoan_thanh','da_huy')
      NOT NULL DEFAULT 'cho_xu_ly'
    `);
  } catch (_e) {
    /* bảng cũ / không quyền ALTER — vẫn chạy COD */
  }
  awaitingStatusEnsured = true;
}

function isVnpayConfigured() {
  const code = String(process.env.VNP_TMN_CODE || '').trim();
  const secret = String(process.env.VNP_HASH_SECRET || '').trim();
  const payUrl = String(process.env.VNP_URL || '').trim();
  return !!(code && secret && payUrl);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatVnpDate(d) {
  return (
    `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}` +
    `${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`
  );
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  const rip = req.socket?.remoteAddress || req.connection?.remoteAddress;
  if (rip && rip.startsWith('::ffff:')) return rip.slice(7);
  return rip || '127.0.0.1';
}

function getReturnUrl() {
  const u = String(process.env.VNP_RETURN_URL || '').trim();
  if (u) return u;
  const port = process.env.PORT || 3001;
  return `http://127.0.0.1:${port}/api/payment/vnpay/return`;
}

/** Giống `buildPaymentUrlSearchParams` trong package `vnpay`: sort key, bỏ rỗng, String(value). */
function buildPaymentUrlSearchParams(data) {
  const params = new URLSearchParams();
  const sortedKeys = Object.keys(data).sort();
  for (const key of sortedKeys) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      params.append(key, String(data[key]));
    }
  }
  return params;
}

function signVnpParams(data, secretKey) {
  const searchParams = buildPaymentUrlSearchParams(data);
  const signData = searchParams.toString();
  return crypto.createHmac('sha512', String(secretKey)).update(Buffer.from(signData, 'utf-8')).digest('hex');
}

/**
 * @param {object} opts
 * @param {number} opts.orderId
 * @param {number} opts.amountVnd - tổng tiền VND (đã là số nguyên)
 * @param {string} opts.orderInfo - mô tả ASCII/ngắn
 * @param {string} opts.ipAddr
 */
function buildPaymentUrl(opts) {
  const tmn = String(process.env.VNP_TMN_CODE || '').trim();
  const secret = String(process.env.VNP_HASH_SECRET || '').trim();
  const base = String(process.env.VNP_URL || '').trim();
  if (!tmn || !secret || !base) {
    throw new Error('Thiếu cấu hình VNPay (VNP_TMN_CODE, VNP_HASH_SECRET, VNP_URL).');
  }

  const orderId = Number(opts.orderId);
  const amountVnd = Math.max(0, Math.round(Number(opts.amountVnd) || 0));
  /* Tránh ký tự hay làm lệch query/chữ ký (#, &, =, …); giữ được tiếng Việt có dấu */
  const orderInfo = String(opts.orderInfo || `Thanh toan don hang ${orderId}`)
    .replace(/[#&=%?+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 255);
  const ipAddr = String(opts.ipAddr || '127.0.0.1').slice(0, 45);
  const returnUrl = getReturnUrl();

  const now = new Date();

  const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmn,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: String(orderId),
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: String(Math.round(amountVnd * 100)),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: formatVnpDate(now),
  };

  const searchParams = buildPaymentUrlSearchParams(vnp_Params);
  const secureHash = crypto
    .createHmac('sha512', secret)
    .update(Buffer.from(searchParams.toString(), 'utf-8'))
    .digest('hex');
  searchParams.append('vnp_SecureHash', secureHash);

  const join = base.includes('?') ? '&' : '?';
  return `${base}${join}${searchParams.toString()}`;
}

/**
 * Kiểm tra chữ ký callback / IPN (query object).
 */
function normalizeVnpQuery(query) {
  const out = {};
  for (const [k, v] of Object.entries(query || {})) {
    out[k] = Array.isArray(v) ? v[0] : v;
  }
  return out;
}

function verifyReturnQuery(query) {
  const secret = String(process.env.VNP_HASH_SECRET || '').trim();
  if (!secret) return { ok: false, reason: 'no_secret' };

  const secureHash = String(query.vnp_SecureHash || query.vnp_securehash || '');
  const params = normalizeVnpQuery(query);
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  if (params.vnp_Amount != null && params.vnp_Amount !== '' && /^-?\d+(\.\d+)?$/.test(String(params.vnp_Amount))) {
    params.vnp_Amount = Number(params.vnp_Amount);
  }

  const computed = signVnpParams(params, secret);
  if (!secureHash || computed.toLowerCase() !== String(secureHash).toLowerCase()) {
    return { ok: false, reason: 'bad_hash' };
  }
  return { ok: true, params: normalizeVnpQuery(query) };
}

module.exports = {
  ensureAwaitingPaymentStatus,
  isVnpayConfigured,
  getClientIp,
  buildPaymentUrl,
  verifyReturnQuery,
};

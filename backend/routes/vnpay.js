/**
 * VNPay: tạo lại URL thanh toán, return (browser redirect về SPA), IPN (server-to-server).
 *
 * Luồng thành công: verify chữ ký → vnp_ResponseCode 00 → processSuccessfulVnpay:
 * khóa đơn FOR UPDATE → kiểm tra vnpay + số tiền → nếu đang cho_thanh_toan: trừ kho + đổi trạng thái cho_xu_ly.
 * Redirect luôn về FRONTEND_URL/payment/vnpay-return?status&orderId&msg.
 */
const express = require('express');
const { pool } = require('../config/db');
const { deductInventoryForOrder } = require('../utils/orderInventory');
const {
  ensureAwaitingPaymentStatus,
  buildPaymentUrl,
  getClientIp,
  verifyReturnQuery,
  isVnpayConfigured,
} = require('../utils/vnpay');

const router = express.Router();

function frontendBaseUrl() {
  const u = String(process.env.FRONTEND_URL || '').trim();
  return u.replace(/\/$/, '') || 'http://127.0.0.1:5173';
}

function redirectResult(res, { status, orderId, message }) {
  const base = frontendBaseUrl();
  const path = '/payment/vnpay-return';
  const qs = new URLSearchParams();
  qs.set('status', status);
  if (orderId != null && String(orderId).trim() !== '') qs.set('orderId', String(orderId));
  if (message) qs.set('msg', String(message).slice(0, 240));
  res.redirect(302, `${base}${path}?${qs.toString()}`);
}

// Giao dịch VNPay thất bại/hủy: xóa luôn đơn chờ thanh toán khỏi DB.
async function removeFailedVnpayOrder(orderId) {
  if (!Number.isFinite(Number(orderId)) || Number(orderId) < 1) return;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id FROM don_hang
       WHERE id = ?
         AND hinh_thuc_thanh_toan = 'vnpay'
         AND trang_thai = 'cho_thanh_toan'
       LIMIT 1
       FOR UPDATE`,
      [orderId]
    );
    if (!rows.length) {
      await conn.rollback();
      return;
    }
    await conn.query(`DELETE FROM chi_tiet_don_hang WHERE id_don_hang = ?`, [orderId]);
    await conn.query(`DELETE FROM don_hang WHERE id = ?`, [orderId]);
    await conn.commit();
  } catch (_e) {
    await conn.rollback();
  } finally {
    conn.release();
  }
}

// Xác nhận một lần: đơn VNPay chờ thanh toán → trừ kho (lần đầu) → chuyển sang chờ xử lý.
async function processSuccessfulVnpay(orderId, vnpAmountMinor) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, tong_tien AS total, trang_thai AS st, hinh_thuc_thanh_toan AS pm FROM don_hang WHERE id = ? FOR UPDATE`,
      [orderId]
    );
    if (!rows.length) {
      await conn.rollback();
      return { ok: false, code: '01', message: 'Order not found' };
    }
    const o = rows[0];
    if (String(o.pm) !== 'vnpay') {
      await conn.rollback();
      return { ok: false, code: '04', message: 'Invalid order' };
    }
    const expected = Math.round(Number(o.total) || 0) * 100;
    if (Number(vnpAmountMinor) !== expected) {
      await conn.rollback();
      return { ok: false, code: '04', message: 'Invalid amount' };
    }
    if (String(o.st) === 'cho_xu_ly') {
      await conn.commit();
      return { ok: true, code: '00', message: 'Confirm Success', duplicate: true };
    }
    if (String(o.st) !== 'cho_thanh_toan') {
      await conn.rollback();
      return { ok: false, code: '04', message: 'Invalid status' };
    }
    await deductInventoryForOrder(conn, orderId);
    await conn.query(`UPDATE don_hang SET trang_thai = 'cho_xu_ly' WHERE id = ?`, [orderId]);
    await conn.commit();
    return { ok: true, code: '00', message: 'Confirm Success' };
  } catch (e) {
    await conn.rollback();
    return { ok: false, code: '99', message: e.message || String(e) };
  } finally {
    conn.release();
  }
}

router.get('/api/payment/vnpay/create', async (req, res) => {
  const id = parseInt(String(req.query.orderId || ''), 10);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(400).json({ success: false, error: 'Thiếu orderId.' });
  }
  if (!isVnpayConfigured()) {
    return res.status(503).json({ success: false, error: 'VNPay chưa cấu hình.' });
  }
  try {
    await ensureAwaitingPaymentStatus();
    const [rows] = await pool.query(
      `SELECT id, tong_tien AS total, hinh_thuc_thanh_toan AS pm, trang_thai AS st FROM don_hang WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Không thấy đơn.' });
    const o = rows[0];
    if (String(o.pm) !== 'vnpay' || String(o.st) !== 'cho_thanh_toan') {
      return res.status(400).json({ success: false, error: 'Đơn không chờ thanh toán VNPay.' });
    }
    const url = buildPaymentUrl({
      orderId: id,
      amountVnd: Number(o.total) || 0,
      orderInfo: `PetCare Spa don hang ${id}`,
      ipAddr: getClientIp(req),
    });
    res.json({ success: true, vnpayUrl: url });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || String(e) });
  }
});

router.get('/api/payment/vnpay/return', async (req, res) => {
  try {
    const v = verifyReturnQuery(req.query);
    if (!v.ok) {
      return redirectResult(res, { status: 'fail', message: 'Chữ ký giao dịch không hợp lệ.' });
    }
    const q = v.params;
    const responseCode = String(q.vnp_ResponseCode || '');
    const orderId = parseInt(String(q.vnp_TxnRef || ''), 10);
    const amount = parseInt(String(q.vnp_Amount || ''), 10);

    if (responseCode !== '00') {
      if (Number.isFinite(orderId) && orderId > 0) {
        await removeFailedVnpayOrder(orderId);
      }
      return redirectResult(res, {
        status: 'fail',
        orderId: Number.isFinite(orderId) ? orderId : undefined,
        message: `Giao dịch chưa thành công (mã ${responseCode}).`,
      });
    }
    if (!Number.isFinite(orderId) || orderId < 1) {
      return redirectResult(res, { status: 'fail', message: 'Thiếu mã đơn hàng.' });
    }

    const result = await processSuccessfulVnpay(orderId, amount);
    if (!result.ok) {
      return redirectResult(res, {
        status: 'fail',
        orderId,
        message: result.message || 'Không thể xác nhận thanh toán.',
      });
    }
    return redirectResult(res, { status: 'success', orderId });
  } catch (e) {
    return redirectResult(res, { status: 'fail', message: e.message || 'Lỗi xử lý.' });
  }
});

router.get('/api/payment/vnpay/ipn', async (req, res) => {
  const v = verifyReturnQuery(req.query);
  if (!v.ok) {
    return res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
  }
  const q = v.params;
  const responseCode = String(q.vnp_ResponseCode || '');
  const orderId = parseInt(String(q.vnp_TxnRef || ''), 10);
  const amount = parseInt(String(q.vnp_Amount || ''), 10);

  if (responseCode !== '00') {
    if (Number.isFinite(orderId) && orderId > 0) {
      await removeFailedVnpayOrder(orderId);
    }
    return res.status(200).json({ RspCode: '00', Message: 'Ack' });
  }
  if (!Number.isFinite(orderId) || orderId < 1) {
    return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
  }

  const result = await processSuccessfulVnpay(orderId, amount);
  if (!result.ok) {
    const code = result.code === '04' ? '04' : '99';
    return res.status(200).json({ RspCode: code, Message: result.message || 'Failed' });
  }
  return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
});

module.exports = router;

/**
 * Đánh giá sản phẩm: list theo SP, kiểm tra đủ điều kiện (đơn hoàn thành + chưa đánh giá), POST tạo dòng.
 */
const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

let ensureTablePromise = null;

function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase();
}

async function ensureReviewTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = pool.query(`
      CREATE TABLE IF NOT EXISTS danh_gia_san_pham (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_don_hang INT NOT NULL,
        ma_san_pham VARCHAR(20) NOT NULL,
        id_nguoi_dung INT NULL,
        email VARCHAR(255) NOT NULL,
        ten_nguoi_dung VARCHAR(255) NOT NULL,
        so_sao TINYINT NOT NULL,
        noi_dung TEXT NOT NULL,
        ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
        ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_dgsp_order_product_email (id_don_hang, ma_san_pham, email),
        INDEX idx_dgsp_product (ma_san_pham),
        INDEX idx_dgsp_user_email (id_nguoi_dung, email)
      )
    `);
  }
  await ensureTablePromise;
}

async function findEligibleOrders({ productId, userId, email }) {
  const sql = `
    SELECT DISTINCT d.id
    FROM don_hang d
    INNER JOIN chi_tiet_don_hang ct ON ct.id_don_hang = d.id
    WHERE d.trang_thai = 'hoan_thanh'
      AND ct.ma_san_pham = ?
      AND (
        (? IS NOT NULL AND d.id_nguoi_dung = ?)
        OR (? <> '' AND LOWER(TRIM(d.email)) = ?)
      )
    ORDER BY d.ngay_tao DESC, d.id DESC
  `;
  const [rows] = await pool.query(sql, [
    productId,
    userId,
    userId,
    email,
    email,
  ]);
  return rows.map((r) => Number(r.id)).filter((x) => Number.isFinite(x));
}

router.get('/api/products/:id/reviews', async (req, res) => {
  try {
    await ensureReviewTable();
    const productId = String(req.params.id || '').trim();
    if (!productId) return res.status(400).json({ error: 'Thiếu mã sản phẩm.' });
    const [rows] = await pool.query(
      `
        SELECT
          id,
          ma_san_pham AS product_id,
          ten_nguoi_dung AS reviewer_name,
          so_sao AS rating,
          noi_dung AS content,
          ngay_tao AS created_at
        FROM danh_gia_san_pham
        WHERE ma_san_pham = ?
        ORDER BY ngay_tao DESC, id DESC
      `,
      [productId]
    );
    const list = rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      reviewerName: r.reviewer_name,
      rating: Number(r.rating) || 0,
      content: r.content || '',
      createdAt: r.created_at,
    }));
    const avgRating = list.length
      ? Number(
          (list.reduce((s, x) => s + (Number(x.rating) || 0), 0) / list.length).toFixed(1)
        )
      : null;
    res.json({ reviews: list, avgRating, total: list.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/api/products/:id/review-eligibility', async (req, res) => {
  try {
    await ensureReviewTable();
    const productId = String(req.params.id || '').trim();
    const rawUserId = req.query.user_id;
    const userId =
      rawUserId != null && String(rawUserId).trim() !== ''
        ? parseInt(String(rawUserId), 10)
        : null;
    const email = normalizeEmail(req.query.email);
    if (!productId) return res.status(400).json({ error: 'Thiếu mã sản phẩm.' });
    if ((!userId || userId <= 0) && !email) {
      return res.json({ canReview: false, reason: 'not_logged_in', orderId: null });
    }

    const safeUserId = Number.isFinite(userId) && userId > 0 ? userId : null;
    const eligibleOrderIds = await findEligibleOrders({
      productId,
      userId: safeUserId,
      email,
    });
    if (!eligibleOrderIds.length) {
      return res.json({ canReview: false, reason: 'not_completed_order', orderId: null });
    }

    const [reviewedRows] = await pool.query(
      `
        SELECT id_don_hang AS order_id
        FROM danh_gia_san_pham
        WHERE ma_san_pham = ?
          AND email = ?
      `,
      [productId, email]
    );
    const reviewedOrderIds = new Set(
      reviewedRows
        .map((r) => Number(r.order_id))
        .filter((n) => Number.isFinite(n))
    );
    const availableOrderId = eligibleOrderIds.find((oid) => !reviewedOrderIds.has(oid)) || null;
    if (!availableOrderId) {
      return res.json({ canReview: false, reason: 'already_reviewed', orderId: null });
    }
    return res.json({ canReview: true, reason: 'ok', orderId: availableOrderId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/api/products/:id/reviews', async (req, res) => {
  try {
    await ensureReviewTable();
    const productId = String(req.params.id || '').trim();
    const body = req.body || {};
    const userId =
      body.user_id != null && String(body.user_id).trim() !== ''
        ? parseInt(String(body.user_id), 10)
        : null;
    const email = normalizeEmail(body.email);
    const reviewerName = String(body.reviewer_name || '').trim();
    const content = String(body.content || '').trim();
    const rating = Math.max(1, Math.min(5, parseInt(String(body.rating || 0), 10) || 0));
    const orderId = parseInt(String(body.order_id || 0), 10);
    if (!productId) return res.status(400).json({ error: 'Thiếu mã sản phẩm.' });
    if ((!userId || userId <= 0) && !email) {
      return res.status(400).json({ error: 'Vui lòng đăng nhập để đánh giá.' });
    }
    if (!reviewerName) return res.status(400).json({ error: 'Thiếu tên người đánh giá.' });
    if (!content || content.length < 8) {
      return res.status(400).json({ error: 'Nội dung đánh giá tối thiểu 8 ký tự.' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Số sao không hợp lệ.' });
    }

    const safeUserId = Number.isFinite(userId) && userId > 0 ? userId : null;
    const eligibleOrderIds = await findEligibleOrders({
      productId,
      userId: safeUserId,
      email,
    });
    if (!eligibleOrderIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Chỉ có thể đánh giá sau khi đã mua và nhận hàng.',
      });
    }
    const selectedOrderId = Number.isFinite(orderId) && eligibleOrderIds.includes(orderId)
      ? orderId
      : eligibleOrderIds[0];

    const [dup] = await pool.query(
      `
        SELECT id
        FROM danh_gia_san_pham
        WHERE id_don_hang = ?
          AND ma_san_pham = ?
          AND email = ?
        LIMIT 1
      `,
      [selectedOrderId, productId, email]
    );
    if (dup.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Bạn đã đánh giá sản phẩm này cho đơn hàng đã chọn.',
      });
    }

    const [ins] = await pool.query(
      `
        INSERT INTO danh_gia_san_pham (
          id_don_hang, ma_san_pham, id_nguoi_dung, email, ten_nguoi_dung, so_sao, noi_dung
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [selectedOrderId, productId, safeUserId, email, reviewerName, rating, content]
    );
    res.json({
      success: true,
      id: ins.insertId,
      orderId: selectedOrderId,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;

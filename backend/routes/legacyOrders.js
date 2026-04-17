/**
 * Route tương đương api/order.php (PHP cũ): tạo đơn hàng + chi tiết dòng hàng.
 *
 * Luồng tổng quát:
 * 1. Đọc & chuẩn hóa body → validate thông tin giao hàng và giỏ hàng.
 * 2. Nếu thanh toán VNPay: kiểm tra cấu hình và trạng thái DB (cho_thanh_toan).
 * 3. BEGIN → INSERT don_hang → với mỗi item: khóa hàng (FOR UPDATE), kiểm tra tồn kho, INSERT chi_tiet_don_hang.
 * 4. Nếu không phải VNPay: trừ kho ngay; VNPay thì chưa trừ (trừ sau khi thanh toán thành công ở luồng khác).
 * 5. COMMIT → nếu VNPay thì build URL thanh toán → trả JSON { success, id, vnpayUrl? }.
 * 6. Lỗi: ROLLBACK, chuẩn hóa thông báo (ví dụ lỗi foreign key).
 */
const express = require('express');
const { pool } = require('../config/db');
const { deductInventoryForOrder } = require('../utils/orderInventory');
const {
  ensureAwaitingPaymentStatus,
  isVnpayConfigured,
  getClientIp,
  buildPaymentUrl,
} = require('../utils/vnpay');

const router = express.Router();

async function handleCreateOrder(req, res) {
  const input = req.body || {};
  const conn = await pool.getConnection();
  try {
    // --- Bước 1: Chuẩn hóa dữ liệu từ client (form / JSON) ---
    const name = String(input.name || '').trim();
    const phone = String(input.phone || '').trim();
    const email = String(input.email || '').trim();
    const address = String(input.address || '').trim();
    const total = Math.round(Number(input.total) || 0);
    const payment = String(input.payment || 'cod');
    const items = Array.isArray(input.items) ? input.items : [];
    let userId = input.user_id != null ? parseInt(String(input.user_id), 10) : null;
    if (!userId || userId <= 0) userId = null;

    const tier = String(input.tier || 'bronze');
    const tierAmount = Math.round(Number(input.tierAmount) || 0);
    const promoCode = String(input.promoCode || '').trim();
    const promoAmount = Math.round(Number(input.promoAmount) || 0);
    const note = String(input.note || '').trim();

    // --- Bước 2: Validate bắt buộc: người nhận + đơn có sản phẩm và tổng tiền > 0 ---
    if (!name || !phone || !email || !address) {
      return res.json({ success: false, error: 'Vui lòng điền đầy đủ thông tin giao hàng.' });
    }
    if (total <= 0 || !items.length) {
      return res.json({ success: false, error: 'Đơn hàng trống hoặc tổng tiền không hợp lệ.' });
    }

    // --- Bước 3: VNPay — đảm bảo DB có trạng thái "chờ thanh toán" và biến môi trường đủ ---
    const isVnpay = payment === 'vnpay';
    if (isVnpay) {
      await ensureAwaitingPaymentStatus();
      if (!isVnpayConfigured()) {
        return res.json({
          success: false,
          error:
            'Chưa cấu hình VNPay trên máy chủ (VNP_TMN_CODE, VNP_HASH_SECRET, VNP_URL trong file .env).',
        });
      }
    }

    // Ánh xạ mã thanh toán / hạng thành viên từ API sang cột DB (tiếng Việt không dấu/snake_case)
    const paymentMap = {
      cod: 'cod',
      transfer: 'chuyen_khoan',
      vnpay: 'vnpay',
      momo: 'momo',
      zalopay: 'zalopay',
      card: 'the',
    };
    const paymentDb = paymentMap[payment] || 'cod';
    const tierMap = { bronze: 'dong', silver: 'bac', gold: 'vang', vip: 'kim_cuong' };
    const tierDb = tierMap[tier] || 'dong';
    // Đơn VNPay: chờ thanh toán; COD/chuyển khoản/...: chờ xử lý
    const orderStatusDb = isVnpay ? 'cho_thanh_toan' : 'cho_xu_ly';

    // --- Bước 4: Giao dịch DB — một đơn + nhiều dòng chi tiết, đồng bộ với tồn kho ---
    await conn.beginTransaction();
    const [orderIns] = await conn.query(
      `INSERT INTO don_hang (
        id_nguoi_dung, ten_nguoi_nhan, so_dien_thoai, email, dia_chi_giao, tong_tien,
        hinh_thuc_thanh_toan, trang_thai, hang_thanh_vien, giam_theo_hang, ma_giam_gia, giam_ma, ghi_chu
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        phone,
        email,
        address,
        total,
        paymentDb,
        orderStatusDb,
        tierDb,
        tierAmount,
        promoCode || null,
        promoAmount,
        note || null,
      ]
    );
    const orderId = orderIns.insertId;

    // Mỗi dòng giỏ: khóa dòng sản phẩm (FOR UPDATE), đọc tồn, báo lỗi nếu thiếu hoặc không đủ, rồi insert chi tiết
    for (const item of items) {
      const productId = item.id != null ? String(item.id).trim() : '';
      const productName = item.name != null ? String(item.name).trim() : 'Sản phẩm';
      const price = Math.round(Number(item.price) || 0);
      const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
      const image = item.image != null ? String(item.image).trim() : null;
      if (!productId) continue;
      const [stockRows] = await conn.query(
        `SELECT ten, so_luong_ton FROM san_pham WHERE ma_san_pham = ? FOR UPDATE`,
        [productId]
      );
      if (!stockRows.length) {
        throw new Error(`Sản phẩm "${productName}" không tồn tại.`);
      }
      const stockNum = Number(stockRows[0].so_luong_ton);
      const displayName =
        String(stockRows[0].ten || '').trim() || productName || productId;
      if (!Number.isFinite(stockNum) || stockNum < quantity) {
        throw new Error(
          `Sản phẩm "${displayName}" chỉ còn ${Number.isFinite(stockNum) ? stockNum : 0} trong kho.`
        );
      }
      await conn.query(
        `INSERT INTO chi_tiet_don_hang (id_don_hang, ma_san_pham, ten_san_pham, don_gia, so_luong, anh_san_pham) VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, productId, productName, price, quantity, image]
      );
    }

    // Chỉ trừ kho khi không phải VNPay (thanh toán ngay / COD). VNPay: trừ kho sau khi gateway xác nhận.
    if (!isVnpay) {
      await deductInventoryForOrder(conn, orderId);
    }

    await conn.commit();

    // --- Bước 5: Sau khi lưu đơn — build URL redirect sang VNPay nếu cần ---
    let vnpayUrl = null;
    if (isVnpay && isVnpayConfigured()) {
      try {
        vnpayUrl = buildPaymentUrl({
          orderId,
          amountVnd: total,
          orderInfo: `PetCare Spa don hang ${orderId}`,
          ipAddr: getClientIp(req),
        });
      } catch (_e) {
        vnpayUrl = null;
      }
    }

    // id = mã đơn trong DB; vnpayUrl chỉ có khi thanh toán VNPay và build URL thành công
    res.json({ success: true, id: orderId, vnpayUrl: vnpayUrl || undefined });
  } catch (e) {
    await conn.rollback();
    let msg = e.message || String(e);
    // MySQL 1452 / FK: thường do mã sản phẩm trong giỏ không khớp bảng san_pham
    if (/foreign key|1452/i.test(msg)) {
      msg =
        'Mã sản phẩm trong giỏ không tồn tại trong kho. Vui lòng làm mới trang và thử lại.';
    }
    res.json({ success: false, error: `Lỗi lưu đơn hàng: ${msg}` });
  } finally {
    conn.release(); // trả connection về pool dù thành công hay lỗi
  }
}

// Hai endpoint cùng handler: tương thích URL PHP cũ và REST /api/orders
router.post('/api/order.php', handleCreateOrder);
router.post('/api/orders', handleCreateOrder);

module.exports = router;

/**
 * REST /api/admin/*: dashboard dữ liệu (đơn, lịch, user), đổi trạng thái đơn/lịch, CRUD dịch vụ, khóa/gỡ hạng user.
 *
 * Luồng đổi trạng thái đơn: PATCH .../orders/:id/status — nếu thoát cho_thanh_toan (trừ hủy) mà chưa trừ kho
 * thì gọi deductInventoryForOrder; sau đó recalcTierForOrderId.
 */
const express = require('express');
const { pool } = require('../config/db');
const {
  tierApiFromSpending,
  recalcTierForOrderId,
  recalcTierForAppointmentId,
  recalcUserTierIfUnlocked,
  thresholdSilver,
  thresholdGold,
  thresholdVip,
  TIER_MAP,
} = require('../utils/memberTier');
const { deductInventoryForOrder } = require('../utils/orderInventory');

const router = express.Router();

const CLIENT_TIER_TO_DB = {
  bronze: 'dong',
  silver: 'bac',
  gold: 'vang',
  vip: 'kim_cuong',
};

const ORDER_STATUS_TO_DB = {
  pending: 'cho_xu_ly',
  awaiting_payment: 'cho_thanh_toan',
  confirmed: 'da_xac_nhan',
  shipping: 'dang_giao',
  completed: 'hoan_thanh',
  cancelled: 'da_huy',
};

const ORDER_STATUS_FROM_DB = {
  cho_xu_ly: 'pending',
  cho_thanh_toan: 'awaiting_payment',
  da_xac_nhan: 'confirmed',
  dang_giao: 'shipping',
  hoan_thanh: 'completed',
  da_huy: 'cancelled',
};

const APPT_STATUS_TO_DB = {
  pending: 'cho_xac_nhan',
  confirmed: 'da_xac_nhan',
  completed: 'da_hoan_thanh',
  cancelled: 'da_huy',
};

const APPT_STATUS_FROM_DB = {
  cho_xac_nhan: 'pending',
  da_xac_nhan: 'confirmed',
  da_hoan_thanh: 'completed',
  da_huy: 'cancelled',
};

function servicePetTypeFromDb(v) {
  if (!v || v === 'ca_hai') return 'both';
  if (v === 'cho') return 'cho';
  if (v === 'meo') return 'meo';
  return 'both';
}

function servicePetTypeToDb(v) {
  const s = String(v || '').trim().toLowerCase();
  if (s === 'cho' || s === 'dog') return 'cho';
  if (s === 'meo' || s === 'cat') return 'meo';
  return 'ca_hai';
}

function serviceStatusFromDb(v) {
  const s = String(v || '').toLowerCase();
  return s === 'tam_an' || s === 'ngung_ban' || s === '' ? 'inactive' : 'active';
}

function serviceStatusToDb(v) {
  return String(v || '').toLowerCase() === 'inactive' ? 'tam_an' : 'dang_ban';
}

function normalizeServiceFeatured(raw) {
  if (raw === true || raw === 1) return true;
  if (raw === false || raw === 0 || raw == null) return false;
  if (typeof raw === 'string') {
    const t = raw.trim().toLowerCase();
    if (t === '1' || t === 'true' || t === 'yes') return true;
    if (t === '0' || t === 'false' || t === 'no' || t === '') return false;
    return false;
  }
  return Boolean(raw);
}

function mapServiceRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    slug: row.slug || '',
    description: row.description || '',
    petType: servicePetTypeFromDb(row.pet_type_raw),
    duration: row.duration != null ? Number(row.duration) : null,
    unit: row.unit_raw || 'phut',
    image: row.image || '',
    featured: normalizeServiceFeatured(row.featured),
    orderNo: row.order_no != null ? Number(row.order_no) : 0,
    priceDog: row.price_dog != null ? Number(row.price_dog) : null,
    priceCat: row.price_cat != null ? Number(row.price_cat) : null,
    status: serviceStatusFromDb(row.status_raw),
  };
}

const categoriesRouter = require('./categories');
router.use('/categories', categoriesRouter);

// Gói đơn + dòng hàng + lịch hẹn + user (tier, chi tiêu) cho admin React
router.get('/data', async (req, res) => {
  try {
    const [ordersRaw] = await pool.query(`
      SELECT
        id,
        id_nguoi_dung AS user_id,
        ten_nguoi_nhan AS name,
        so_dien_thoai AS phone,
        email,
        dia_chi_giao AS address,
        tong_tien AS total,
        hinh_thuc_thanh_toan AS payment_method,
        trang_thai AS status_db,
        hang_thanh_vien AS tier,
        ngay_tao AS created_at,
        ngay_cap_nhat AS updated_at
      FROM don_hang
      ORDER BY ngay_tao DESC
    `);

    const [itemsRows] = await pool.query(`
      SELECT id_don_hang, ma_san_pham AS id, ten_san_pham AS name,
        don_gia AS price, so_luong AS quantity, anh_san_pham AS image
      FROM chi_tiet_don_hang
    `);
    const itemsByOrder = new Map();
    for (const row of itemsRows) {
      const oid = row.id_don_hang;
      if (!itemsByOrder.has(oid)) itemsByOrder.set(oid, []);
      const { id_don_hang, ...it } = row;
      itemsByOrder.get(oid).push(it);
    }

    const orders = ordersRaw.map((o) => {
      const payment =
        o.payment_method === 'chuyen_khoan'
          ? 'transfer'
          : o.payment_method === 'the'
            ? 'card'
            : o.payment_method || 'cod';
      return {
        ...o,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        status: ORDER_STATUS_FROM_DB[o.status_db] || 'pending',
        payment,
        items: itemsByOrder.get(o.id) || [],
        status_db: undefined,
        payment_method: undefined,
      };
    });

    const [appointmentsRaw] = await pool.query(`
      SELECT
        a.id,
        a.id_nguoi_dung AS user_id,
        a.ma_dich_vu AS service_id,
        a.ngay_hen AS date,
        a.gio_hen AS time,
        a.ten_chu_nuoi AS owner_name,
        a.so_dien_thoai AS owner_phone,
        a.email AS owner_email,
        a.ten_thu_cung AS pet_name,
        a.loai_thu_cung AS pet_type,
        a.trang_thai AS status_raw,
        a.ngay_tao AS created_at,
        s.ten AS service_name,
        COALESCE(
          NULLIF(ct.sum_lines, 0),
          CASE
            WHEN a.loai_thu_cung = 'dog' THEN COALESCE(s.gia_cho, s.gia_meo, 0)
            ELSE COALESCE(s.gia_meo, s.gia_cho, 0)
          END
        ) AS spa_revenue_vnd
      FROM lich_hen_spa a
      LEFT JOIN dich_vu_spa s ON s.ma_dich_vu = a.ma_dich_vu
      LEFT JOIN (
        SELECT id_lich_hen, SUM(don_gia * COALESCE(so_luong, 1)) AS sum_lines
        FROM chi_tiet_lich_hen
        GROUP BY id_lich_hen
      ) ct ON ct.id_lich_hen = a.id
      ORDER BY a.ngay_hen DESC, a.gio_hen DESC
    `);

    const appointments = appointmentsRaw.map((b) => {
      let timeVal = b.time;
      if (timeVal && String(timeVal).length >= 5) {
        timeVal = String(timeVal).slice(0, 5);
      }
      let dateYmd = b.date;
      if (dateYmd instanceof Date && !Number.isNaN(dateYmd.getTime())) {
        const y = dateYmd.getFullYear();
        const m = String(dateYmd.getMonth() + 1).padStart(2, '0');
        const d = String(dateYmd.getDate()).padStart(2, '0');
        dateYmd = `${y}-${m}-${d}`;
      } else if (typeof dateYmd === 'string') {
        const m = dateYmd.match(/(\d{4}-\d{2}-\d{2})/);
        dateYmd = m ? m[1] : dateYmd.slice(0, 10);
      } else if (dateYmd != null) {
        const s = String(dateYmd);
        const m = s.match(/(\d{4}-\d{2}-\d{2})/);
        dateYmd = m ? m[1] : s.slice(0, 10);
      }
      return {
        ...b,
        date: dateYmd,
        time: timeVal,
        serviceName: b.service_name || b.service_id,
        ownerName: b.owner_name,
        createdAt: b.created_at,
        spaRevenue: Number(b.spa_revenue_vnd) || 0,
        status: APPT_STATUS_FROM_DB[b.status_raw] || 'pending',
        status_raw: undefined,
        service_name: undefined,
        spa_revenue_vnd: undefined,
      };
    });

    let tierLockExpr = '0 AS tier_locked';
    try {
      const [tierLockCols] = await pool.query(
        `SHOW COLUMNS FROM nguoi_dung LIKE 'hang_khoa_boi_admin'`
      );
      if (Array.isArray(tierLockCols) && tierLockCols.length > 0) {
        tierLockExpr = 'COALESCE(u.hang_khoa_boi_admin, 0) AS tier_locked';
      }
    } catch (_e) {
      /* schema cũ: không có cột khóa hạng */
    }

    const [usersRaw] = await pool.query(`
      SELECT u.id, u.ten AS name, u.email, u.so_dien_thoai AS phone,
        u.hang_thanh_vien AS tier_db, u.vai_tro AS role, u.ngay_tao AS created_at,
        ${tierLockExpr},
        (
          (
            SELECT COALESCE(SUM(d.tong_tien), 0) FROM don_hang d
            WHERE d.trang_thai = 'hoan_thanh'
            AND (
              d.id_nguoi_dung = u.id
              OR (
                d.id_nguoi_dung IS NULL
                AND NULLIF(TRIM(u.email), '') IS NOT NULL
                AND LOWER(TRIM(d.email)) = LOWER(TRIM(u.email))
              )
            )
          ) + (
            SELECT COALESCE(SUM(
              COALESCE(
                NULLIF(ct.sum_lines, 0),
                CASE
                  WHEN a.loai_thu_cung IN ('dog', 'cho') THEN COALESCE(s.gia_cho, s.gia_meo, 0)
                  WHEN a.loai_thu_cung IN ('cat', 'meo') THEN COALESCE(s.gia_meo, s.gia_cho, 0)
                  ELSE COALESCE(s.gia_cho, s.gia_meo, 0)
                END
              )
            ), 0)
            FROM lich_hen_spa a
            LEFT JOIN dich_vu_spa s ON s.ma_dich_vu = a.ma_dich_vu
            LEFT JOIN (
              SELECT id_lich_hen, SUM(don_gia * COALESCE(so_luong, 1)) AS sum_lines
              FROM chi_tiet_lich_hen
              GROUP BY id_lich_hen
            ) ct ON ct.id_lich_hen = a.id
            WHERE a.trang_thai = 'da_hoan_thanh'
            AND (
              a.id_nguoi_dung = u.id
              OR (
                a.id_nguoi_dung IS NULL
                AND NULLIF(TRIM(u.email), '') IS NOT NULL
                AND LOWER(TRIM(a.email)) = LOWER(TRIM(u.email))
              )
            )
          )
        ) AS total_spent_vnd
      FROM nguoi_dung u
      ORDER BY u.id
    `);

    const users = usersRaw.map((u) => {
      const totalSpent = Number(u.total_spent_vnd) || 0;
      const suggestedTier = tierApiFromSpending(totalSpent);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        created_at: u.created_at,
        createdAt: u.created_at,
        tier: TIER_MAP[u.tier_db] || 'bronze',
        totalSpent,
        tierLocked: Boolean(u.tier_locked),
        suggestedTier,
      };
    });

    res.json({ orders, appointments, users });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Đổi trạng thái đơn + trừ kho khi rời trạng thái chờ thanh toán VNPay (xem leaveAwaiting)
router.patch('/orders/:id/status', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const status = String(req.body?.status || '');
  const dbStatus = ORDER_STATUS_TO_DB[status];
  if (!dbStatus || !Number.isFinite(id) || id < 1) {
    return res.status(400).json({ error: 'Thiếu id hoặc trạng thái không hợp lệ.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT trang_thai FROM don_hang WHERE id = ? FOR UPDATE', [
      id,
    ]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
    }
    const prev = String(rows[0].trang_thai || '');
    const currentOrderSt = ORDER_STATUS_FROM_DB[prev] || 'pending';
    if (status === 'cancelled' && currentOrderSt === 'completed') {
      await conn.rollback();
      return res.status(400).json({ error: 'Không thể hủy đơn đã hoàn thành.' });
    }
    const leaveAwaiting =
      prev === 'cho_thanh_toan' && dbStatus !== 'cho_thanh_toan' && dbStatus !== 'da_huy';
    if (leaveAwaiting) {
      await deductInventoryForOrder(conn, id);
    }
    const [r] = await conn.query('UPDATE don_hang SET trang_thai = ? WHERE id = ?', [
      dbStatus,
      id,
    ]);
    if (r.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    return res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
  try {
    await recalcTierForOrderId(id);
  } catch (_e) {
    /* bỏ qua nếu chưa chạy migration hang_khoa_boi_admin */
  }
  res.json({ success: true, id, status });
});

// Cập nhật trạng thái lịch hẹn spa (map APPT_STATUS_TO_DB)
router.patch('/appointments/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const status = String(req.body?.status || '');
    const dbStatus = APPT_STATUS_TO_DB[status];
    if (!dbStatus || !Number.isFinite(id) || id < 1) {
      return res.status(400).json({ error: 'Thiếu id hoặc trạng thái không hợp lệ.' });
    }
    const [[apptRow]] = await pool.query('SELECT trang_thai FROM lich_hen_spa WHERE id = ?', [
      id,
    ]);
    if (!apptRow) {
      return res.status(404).json({ error: 'Không tìm thấy lịch hẹn.' });
    }
    const currentApptSt = APPT_STATUS_FROM_DB[String(apptRow.trang_thai || '')] || 'pending';
    if (status === 'cancelled' && currentApptSt === 'completed') {
      return res.status(400).json({ error: 'Không thể hủy lịch đã hoàn thành.' });
    }
    const [r] = await pool.query('UPDATE lich_hen_spa SET trang_thai = ? WHERE id = ?', [
      dbStatus,
      id,
    ]);
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy lịch hẹn.' });
    }
    try {
      await recalcTierForAppointmentId(id);
    } catch (_e) {
      /* bỏ qua nếu schema cũ */
    }
    res.json({ success: true, id, status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CRUD dịch vụ admin (khác GET công khai /api/services — ở đây đủ trạng thái)
router.get('/services', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        ma_dich_vu AS id,
        ten AS name,
        duong_dan AS slug,
        mo_ta AS description,
        doi_tuong AS pet_type_raw,
        thoi_luong AS duration,
        don_vi AS unit_raw,
        anh AS image,
        noi_bat AS featured,
        thu_tu_hien_thi AS order_no,
        gia_cho AS price_dog,
        gia_meo AS price_cat,
        trang_thai AS status_raw
      FROM dich_vu_spa
      ORDER BY thu_tu_hien_thi ASC, ma_dich_vu ASC
    `);
    res.json((rows || []).map(mapServiceRow));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/services', async (req, res) => {
  try {
    const b = req.body || {};
    const id = String(b.id || '').trim();
    const name = String(b.name || '').trim();
    const slug = String(b.slug || '').trim();
    const description = String(b.description || '').trim();
    const image = String(b.image || '').trim();
    const petType = servicePetTypeToDb(b.petType);
    const duration = Number.isFinite(Number(b.duration)) ? Number(b.duration) : 60;
    const unit = String(b.unit || 'phut').trim().toLowerCase() === 'ngay' ? 'ngay' : 'phut';
    const featured = normalizeServiceFeatured(b.featured) ? 1 : 0;
    const orderNo = Number.isFinite(Number(b.orderNo)) ? Number(b.orderNo) : 0;
    const priceDog = Number.isFinite(Number(b.priceDog)) ? Number(b.priceDog) : null;
    const priceCat = Number.isFinite(Number(b.priceCat)) ? Number(b.priceCat) : null;
    const status = serviceStatusToDb(b.status);
    if (!id || !name) {
      return res.status(400).json({ error: 'Thiếu mã dịch vụ hoặc tên dịch vụ.' });
    }
    const [dup] = await pool.query('SELECT ma_dich_vu FROM dich_vu_spa WHERE ma_dich_vu = ? LIMIT 1', [
      id,
    ]);
    if (dup.length) {
      return res.status(409).json({ error: 'Mã dịch vụ đã tồn tại.' });
    }
    await pool.query(
      `INSERT INTO dich_vu_spa (
        ma_dich_vu, ten, duong_dan, mo_ta, doi_tuong, thoi_luong, don_vi, anh,
        noi_bat, thu_tu_hien_thi, gia_cho, gia_meo, trang_thai
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        slug || null,
        description || null,
        petType,
        duration,
        unit,
        image || null,
        featured,
        orderNo,
        priceDog,
        priceCat,
        status,
      ]
    );
    const [[row]] = await pool.query(
      `SELECT ma_dich_vu AS id, ten AS name, duong_dan AS slug, mo_ta AS description,
        doi_tuong AS pet_type_raw, thoi_luong AS duration, don_vi AS unit_raw,
        anh AS image, noi_bat AS featured, thu_tu_hien_thi AS order_no,
        gia_cho AS price_dog, gia_meo AS price_cat, trang_thai AS status_raw
       FROM dich_vu_spa WHERE ma_dich_vu = ? LIMIT 1`,
      [id]
    );
    res.json({ success: true, service: mapServiceRow(row) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/services/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const slug = String(b.slug || '').trim();
    const description = String(b.description || '').trim();
    const image = String(b.image || '').trim();
    const petType = servicePetTypeToDb(b.petType);
    const duration = Number.isFinite(Number(b.duration)) ? Number(b.duration) : 60;
    const unit = String(b.unit || 'phut').trim().toLowerCase() === 'ngay' ? 'ngay' : 'phut';
    const featured = normalizeServiceFeatured(b.featured) ? 1 : 0;
    const orderNo = Number.isFinite(Number(b.orderNo)) ? Number(b.orderNo) : 0;
    const priceDog = Number.isFinite(Number(b.priceDog)) ? Number(b.priceDog) : null;
    const priceCat = Number.isFinite(Number(b.priceCat)) ? Number(b.priceCat) : null;
    const status = serviceStatusToDb(b.status);
    if (!id || !name) {
      return res.status(400).json({ error: 'Thiếu mã hoặc tên dịch vụ.' });
    }
    const [r] = await pool.query(
      `UPDATE dich_vu_spa
       SET ten = ?, duong_dan = ?, mo_ta = ?, doi_tuong = ?, thoi_luong = ?, don_vi = ?, anh = ?,
           noi_bat = ?, thu_tu_hien_thi = ?, gia_cho = ?, gia_meo = ?, trang_thai = ?
       WHERE ma_dich_vu = ?`,
      [
        name,
        slug || null,
        description || null,
        petType,
        duration,
        unit,
        image || null,
        featured,
        orderNo,
        priceDog,
        priceCat,
        status,
        id,
      ]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dịch vụ.' });
    }
    const [[row]] = await pool.query(
      `SELECT ma_dich_vu AS id, ten AS name, duong_dan AS slug, mo_ta AS description,
        doi_tuong AS pet_type_raw, thoi_luong AS duration, don_vi AS unit_raw,
        anh AS image, noi_bat AS featured, thu_tu_hien_thi AS order_no,
        gia_cho AS price_dog, gia_meo AS price_cat, trang_thai AS status_raw
       FROM dich_vu_spa WHERE ma_dich_vu = ? LIMIT 1`,
      [id]
    );
    res.json({ success: true, service: mapServiceRow(row) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Thiếu mã dịch vụ.' });
    const [r] = await pool.query('DELETE FROM dich_vu_spa WHERE ma_dich_vu = ?', [id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy dịch vụ.' });
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/services/:id/status', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const status = String(req.body?.status || '').trim().toLowerCase();
    if (!id) return res.status(400).json({ error: 'Thiếu mã dịch vụ.' });
    if (status !== 'active' && status !== 'inactive') {
      return res.status(400).json({ error: 'Trạng thái dịch vụ không hợp lệ.' });
    }
    const dbStatus = serviceStatusToDb(status);
    const [r] = await pool.query('UPDATE dich_vu_spa SET trang_thai = ? WHERE ma_dich_vu = ?', [
      dbStatus,
      id,
    ]);
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dịch vụ.' });
    }
    res.json({ success: true, id, status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * PATCH /api/admin/users/:id/tier
 * Body: { tier: 'bronze'|'silver'|'gold'|'vip', lockAutoTier?: true } — đặt hạng tay, mặc định khóa tự động.
 * Hoặc: { lockAutoTier: false } — mở khóa và đồng bộ lại hạng theo tổng chi tiêu (đơn hoàn thành).
 */
router.patch('/users/:id/tier', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id < 1) {
      return res.status(400).json({ error: 'Id người dùng không hợp lệ.' });
    }
    const { tier, lockAutoTier } = req.body || {};

    if (lockAutoTier === false) {
      await pool.query('UPDATE nguoi_dung SET hang_khoa_boi_admin = 0 WHERE id = ?', [id]);
      await recalcUserTierIfUnlocked(id);
      const [[row]] = await pool.query(
        'SELECT hang_thanh_vien AS tier_db FROM nguoi_dung WHERE id = ?',
        [id]
      );
      return res.json({
        success: true,
        id,
        tier: TIER_MAP[row?.tier_db] || 'bronze',
        syncedFromSpending: true,
      });
    }

    const t = String(tier || '').toLowerCase();
    const dbTier = CLIENT_TIER_TO_DB[t];
    if (!dbTier) {
      return res.status(400).json({
        error: 'Thiếu tier hợp lệ: bronze | silver | gold | vip',
      });
    }
    const lock = req.body?.lockAutoTier !== false;
    await pool.query(
      'UPDATE nguoi_dung SET hang_thanh_vien = ?, hang_khoa_boi_admin = ? WHERE id = ?',
      [dbTier, lock ? 1 : 0, id]
    );
    res.json({ success: true, id, tier: t, tierLocked: lock });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Ngưỡng nâng hạng (để admin hiển thị) */
router.get('/tier-thresholds', (_req, res) => {
  res.json({
    currency: 'VND',
    silverMin: thresholdSilver(),
    goldMin: thresholdGold(),
    vipMin: thresholdVip(),
    note:
      'Tổng tong_tien đơn trạng_thai = hoan_thanh; gồm đơn gắn user + đơn khách trùng email',
  });
});

module.exports = router;

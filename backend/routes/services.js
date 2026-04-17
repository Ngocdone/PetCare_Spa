/**
 * REST /api/services: chỉ đọc danh sách dịch vụ đang bán (dich_vu_spa), map đơn vị & đối tượng thú.
 */
const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

/** DB: cho | meo | ca_hai → SPA dùng cho | meo | both */
function mapDoiTuong(v) {
  if (!v || v === 'ca_hai') return 'both';
  return v;
}

function normalizeUnit(u) {
  if (!u || u === 'phut') return 'phút';
  if (u === 'ngay') return 'ngày';
  return u;
}

function normalizeFeatured(raw) {
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

function serviceStatusFromDb(v) {
  const s = String(v || '').toLowerCase();
  return s === 'dang_ban' ? 'active' : 'inactive';
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    priceDog: row.price_dog != null ? Number(row.price_dog) : null,
    priceCat: row.price_cat != null ? Number(row.price_cat) : null,
    duration: row.duration != null ? Number(row.duration) : 60,
    unit: normalizeUnit(row.unit_raw),
    image: row.image || '',
    featured: normalizeFeatured(row.featured),
    orderNo: row.order_no != null ? Number(row.order_no) : 0,
    category: row.category || 'grooming',
    petType: mapDoiTuong(row.pet_type_raw),
    status: serviceStatusFromDb(row.status_raw),
  };
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ma_dich_vu AS id, ten AS name, duong_dan AS slug, mo_ta AS description,
        gia_cho AS price_dog, gia_meo AS price_cat, thoi_luong AS duration,
        don_vi AS unit_raw, anh AS image, noi_bat AS featured,
        thu_tu_hien_thi AS order_no, doi_tuong AS pet_type_raw,
        NULL AS category, trang_thai AS status_raw
       FROM dich_vu_spa
       ORDER BY noi_bat DESC, thu_tu_hien_thi ASC, ma_dich_vu ASC`
    );
    res.json(rows.map(mapRow));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

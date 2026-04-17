/**
 * REST /api/products (và mount trùng /products): CRUD sản phẩm, upload ảnh, map DB ↔ SPA.
 *
 * Luồng: ensureExtraColumns/ensureReviewTable (migration nhẹ) → GET list/detail → POST/PUT với slug/id duy nhất
 * → DELETE có guard FK → POST /upload lưu file vào thư mục img/.
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { pool } = require('../config/db');
const { getProductDeleteBlockReason } = require('../utils/productDeleteGuard');

const router = express.Router();
let ensureExtraColsPromise = null;
let ensureReviewTablePromise = null;

const IMG_DIR = path.join(__dirname, '..', '..', 'img');
const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const upload = multer({
  storage: multer.diskStorage({
    destination(_req, _file, cb) {
      fs.mkdirSync(IMG_DIR, { recursive: true });
      cb(null, IMG_DIR);
    },
    filename(_req, file, cb) {
      const ext = MIME_EXT[file.mimetype] || path.extname(file.originalname) || '.jpg';
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
      const rand = crypto.randomBytes(4).toString('hex');
      cb(null, `sp_${stamp}_${rand}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (MIME_EXT[file.mimetype]) return cb(null, true);
    cb(new Error('Định dạng không hợp lệ. Chỉ JPG, PNG, WebP, GIF.'));
  },
});

function mapDoiTuong(v) {
  if (!v || v === 'ca_hai') return 'both';
  return v;
}

function petTypeToDoiTuong(v) {
  if (!v || v === 'both') return 'ca_hai';
  if (v === 'dog') return 'cho';
  if (v === 'cat') return 'meo';
  return v;
}

function parseSizesJson(raw) {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x, i) => ({
        label: String(x?.label ?? `Tuỳ chọn ${i + 1}`).trim().slice(0, 64),
        price: x?.price != null ? Number(x.price) : 0,
        oldPrice:
          x?.oldPrice != null && x.oldPrice !== '' ? Number(x.oldPrice) : null,
        stock: x?.stock != null && x.stock !== '' ? Number(x.stock) : null,
      }))
      .filter((x) => x.label);
  } catch {
    return [];
  }
}

function stringifySizesForDb(sizes) {
  if (sizes == null) return null;
  if (!Array.isArray(sizes)) return null;
  const norm = sizes
    .map((x, i) => ({
      label: String(x?.label ?? `Tuỳ chọn ${i + 1}`).trim().slice(0, 64),
      price: x?.price != null ? Number(x.price) : 0,
      oldPrice:
        x?.oldPrice != null && x.oldPrice !== '' ? Number(x.oldPrice) : null,
      stock: x?.stock != null && x.stock !== '' ? Number(x.stock) : null,
    }))
    .filter((x) => x.label);
  if (!norm.length) return null;
  return JSON.stringify(norm);
}

function mapRow(row) {
  if (!row) return null;
  const sizes = parseSizesJson(row.sizes_raw);
  const o = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: row.price != null ? Number(row.price) : 0,
    oldPrice: row.oldPrice != null ? Number(row.oldPrice) : null,
    category: row.category,
    petType: mapDoiTuong(row.pet_type_raw),
    image: row.image || '',
    rating: row.rating != null ? Number(row.rating) : 0,
    reviewCount: row.review_count != null ? Number(row.review_count) : 0,
    bestSeller: Boolean(row.best_seller),
    description: row.description || '',
    storageGuide: row.storage_guide || '',
    safetyGuide: row.safety_guide || '',
    stock: row.stock != null ? Number(row.stock) : 0,
    sizes,
  };
  if (row.status_db != null) {
    o.status = row.status_db === 'tam_an' ? 'inactive' : 'active';
  }
  return o;
}

async function ensureExtraColumns() {
  if (!ensureExtraColsPromise) {
    ensureExtraColsPromise = (async () => {
      const table = 'san_pham';
      const [storageCol] = await pool.query(
        `SHOW COLUMNS FROM \`${table}\` LIKE 'bao_quan_han_su_dung'`
      );
      if (!storageCol.length) {
        await pool.query(
          `ALTER TABLE \`${table}\` ADD COLUMN bao_quan_han_su_dung TEXT NULL AFTER mo_ta`
        );
      }
      const [safetyCol] = await pool.query(
        `SHOW COLUMNS FROM \`${table}\` LIKE 'huong_dan_an_toan'`
      );
      if (!safetyCol.length) {
        await pool.query(
          `ALTER TABLE \`${table}\` ADD COLUMN huong_dan_an_toan TEXT NULL AFTER bao_quan_han_su_dung`
        );
      }
      const [sizesCol] = await pool.query(
        `SHOW COLUMNS FROM \`${table}\` LIKE 'kich_co_json'`
      );
      if (!sizesCol.length) {
        await pool.query(
          `ALTER TABLE \`${table}\` ADD COLUMN kich_co_json TEXT NULL AFTER huong_dan_an_toan`
        );
      }
    })().catch((err) => {
      ensureExtraColsPromise = null;
      throw err;
    });
  }
  return ensureExtraColsPromise;
}

async function ensureReviewTable() {
  if (!ensureReviewTablePromise) {
    ensureReviewTablePromise = pool
      .query(`
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
      `)
      .catch((err) => {
        ensureReviewTablePromise = null;
        throw err;
      });
  }
  await ensureReviewTablePromise;
}

const SELECT_PRODUCT_FIELDS = `ma_san_pham AS id, ten AS name, duong_dan AS slug, mo_ta AS description,
  gia AS price, gia_cu AS oldPrice, ma_danh_muc AS category, doi_tuong AS pet_type_raw,
  anh_chinh AS image,
  COALESCE(
    (SELECT ROUND(AVG(dg.so_sao), 1) FROM danh_gia_san_pham dg WHERE dg.ma_san_pham = san_pham.ma_san_pham),
    0
  ) AS rating,
  (SELECT COUNT(*) FROM danh_gia_san_pham dg WHERE dg.ma_san_pham = san_pham.ma_san_pham) AS review_count,
  ban_chay AS best_seller, so_luong_ton AS stock,
  bao_quan_han_su_dung AS storage_guide, huong_dan_an_toan AS safety_guide,
  kich_co_json AS sizes_raw, trang_thai AS status_db`;

function publicProductFilter(all) {
  return all ? '1=1' : `trang_thai = 'dang_ban'`;
}

function trimTo20(v) {
  return String(v || '').trim().slice(0, 20);
}

/** Đảm bảo ma_danh_muc tồn tại trong danh_muc_san_pham (tránh lỗi FK khi client gửi rỗng / mã cũ không còn). */
async function resolveMaDanhMuc(b) {
  const raw = b.category ?? b.ma_danh_muc;
  let ma = raw == null ? '' : String(raw).trim();
  const [first] = await pool.query(
    `SELECT ma_danh_muc FROM danh_muc_san_pham ORDER BY thu_tu_hien_thi ASC, ma_danh_muc ASC LIMIT 1`
  );
  if (!first.length) {
    throw new Error(
      'Chưa có danh mục sản phẩm trong CSDL — thêm danh mục trước khi tạo sản phẩm.'
    );
  }
  const fallbackMa = first[0].ma_danh_muc;
  if (!ma) return fallbackMa;
  const [exist] = await pool.query(
    `SELECT ma_danh_muc FROM danh_muc_san_pham WHERE ma_danh_muc = ? LIMIT 1`,
    [ma]
  );
  if (exist.length) return ma;
  return fallbackMa;
}

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  const raw = String(baseSlug || '').trim();
  const seed = raw || `sp-${Date.now()}`;
  let candidate = seed;
  for (let i = 1; i <= 200; i++) {
    const [rows] = excludeId
      ? await pool.query(
          'SELECT 1 FROM san_pham WHERE duong_dan = ? AND ma_san_pham <> ? LIMIT 1',
          [candidate, excludeId]
        )
      : await pool.query('SELECT 1 FROM san_pham WHERE duong_dan = ? LIMIT 1', [candidate]);
    if (!rows.length) return candidate;
    const suffix = `-${i + 1}`;
    candidate = `${seed}${suffix}`.slice(0, 255);
  }
  return `${seed}-${Date.now()}`.slice(0, 255);
}

async function ensureUniqueProductId(baseId) {
  const seedRaw = trimTo20(baseId);
  const seed = seedRaw || `p${Date.now()}`;
  let candidate = seed;
  for (let i = 1; i <= 200; i++) {
    const [rows] = await pool.query(
      'SELECT 1 FROM san_pham WHERE ma_san_pham = ? LIMIT 1',
      [candidate]
    );
    if (!rows.length) return candidate;
    const suffix = `${i + 1}`;
    candidate = `${seed}`.slice(0, Math.max(1, 20 - suffix.length)) + suffix;
  }
  return `p${Date.now()}`.slice(0, 20);
}

router.get('/', async (req, res) => {
  try {
    await ensureExtraColumns();
    await ensureReviewTable();
    const all = String(req.query.all || '') === '1';
    const where = publicProductFilter(all);
    const [rows] = await pool.query(
      `SELECT ${SELECT_PRODUCT_FIELDS} FROM san_pham
       WHERE ${where}
       ORDER BY thu_tu_hien_thi ASC, ma_san_pham ASC`
    );
    res.json(rows.map(mapRow));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post(
  '/upload',
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message || 'Tải ảnh thất bại',
        });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Không có file ảnh (field name: image).' });
    }
    res.json({ success: true, path: `img/${req.file.filename}` });
  }
);

router.post('/', async (req, res) => {
  try {
    await ensureExtraColumns();
    await ensureReviewTable();
    const b = req.body || {};
    if (!b.name || b.price === undefined) {
      return res.status(400).json({
        error: 'Thiếu trường bắt buộc: name, price',
      });
    }
    const trangThai = b.status === 'inactive' ? 'tam_an' : 'dang_ban';
    const desiredSlug = String(b.slug || '').trim() || String(b.name || '').trim();
    const uniqueSlug = await ensureUniqueSlug(desiredSlug);
    const ma = await ensureUniqueProductId(b.id || b.ma_san_pham || uniqueSlug);
    const maDanhMuc = await resolveMaDanhMuc(b);
    const sizesJson = stringifySizesForDb(b.sizes);
    await pool.query(
      `INSERT INTO san_pham (
        ma_san_pham, ten, duong_dan, mo_ta, gia, gia_cu, ma_danh_muc, doi_tuong,
        anh_chinh, danh_gia, ban_chay, so_luong_ton, bao_quan_han_su_dung, huong_dan_an_toan, kich_co_json, trang_thai
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ma,
        b.name,
        uniqueSlug,
        b.description ?? null,
        b.price,
        b.oldPrice ?? b.gia_cu ?? null,
        maDanhMuc,
        petTypeToDoiTuong(b.petType ?? b.pet_type),
        b.image ?? null,
        b.rating ?? 4.5,
        (b.bestSeller ?? b.ban_chay) ? 1 : 0,
        b.stock ?? 0,
        b.storageGuide ?? b.storage_guide ?? null,
        b.safetyGuide ?? b.safety_guide ?? null,
        sizesJson,
        trangThai,
      ]
    );
    const [rows] = await pool.query(
      `SELECT ${SELECT_PRODUCT_FIELDS} FROM san_pham WHERE ma_san_pham = ?`,
      [ma]
    );
    res.status(201).json(mapRow(rows[0]));
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Mã hoặc slug đã tồn tại' });
    }
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await ensureExtraColumns();
    await ensureReviewTable();
    const id = String(req.params.id).slice(0, 20);
    const b = req.body || {};
    if (!b.name || b.price === undefined) {
      return res.status(400).json({
        error: 'Thiếu trường bắt buộc: name, price',
      });
    }
    const uniqueSlug = await ensureUniqueSlug(String(b.slug || '').trim(), id);
    const maDanhMuc = await resolveMaDanhMuc(b);
    const trangThai = b.status === 'inactive' ? 'tam_an' : 'dang_ban';
    const sizesJsonUp = stringifySizesForDb(b.sizes);
    const [r] = await pool.query(
      `UPDATE san_pham SET ten = ?, duong_dan = ?, mo_ta = ?, gia = ?, gia_cu = ?,
        ma_danh_muc = ?, doi_tuong = ?, anh_chinh = ?, danh_gia = ?, ban_chay = ?,
        so_luong_ton = ?, bao_quan_han_su_dung = ?, huong_dan_an_toan = ?, kich_co_json = ?, trang_thai = ?
       WHERE ma_san_pham = ?`,
      [
        b.name,
        uniqueSlug,
        b.description ?? null,
        b.price,
        b.oldPrice ?? b.gia_cu ?? null,
        maDanhMuc,
        petTypeToDoiTuong(b.petType ?? b.pet_type),
        b.image ?? null,
        b.rating ?? 4.5,
        (b.bestSeller ?? b.ban_chay) ? 1 : 0,
        b.stock ?? 0,
        b.storageGuide ?? b.storage_guide ?? null,
        b.safetyGuide ?? b.safety_guide ?? null,
        sizesJsonUp,
        trangThai,
        id,
      ]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }
    const [rows] = await pool.query(
      `SELECT ${SELECT_PRODUCT_FIELDS} FROM san_pham WHERE ma_san_pham = ?`,
      [id]
    );
    res.json(mapRow(rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = String(req.params.id).slice(0, 20);
    await ensureReviewTable();
    const block = await getProductDeleteBlockReason(pool, id);
    if (block) {
      return res.status(409).json({ error: block });
    }
    const [r] = await pool.query('DELETE FROM san_pham WHERE ma_san_pham = ?', [id]);
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }
    res.json({ success: true, deleted: id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await ensureExtraColumns();
    const raw = req.params.id;
    const all = String(req.query.all || '') === '1';
    const where = publicProductFilter(all);
    const [rows] = await pool.query(
      `SELECT ${SELECT_PRODUCT_FIELDS} FROM san_pham
       WHERE (${where}) AND (ma_san_pham = ? OR duong_dan = ?)
       LIMIT 1`,
      [raw, raw]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    res.json(mapRow(row));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

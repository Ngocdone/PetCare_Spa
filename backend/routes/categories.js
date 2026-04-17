/**
 * REST /api/categories: CRUD danh_muc_san_pham; mount lồng trong admin tại /api/admin/categories.
 */
const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

function petTargetToDb(v) {
  const s = String(v || '').trim();
  if (s === 'both') return 'ca_hai';
  if (s === 'cho' || s === 'meo' || s === 'ca_hai') return s;
  return 'ca_hai';
}

function petTargetFromDb(v) {
  if (!v || v === 'ca_hai') return 'both';
  return v;
}

function slugCategoryId(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 50);
}

// --- Danh sách (kèm đếm sản phẩm) ---
/** GET /api/categories (và /api/admin/categories khi mount lồng) */
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.ma_danh_muc AS id, d.ten AS name, d.bieu_tuong AS icon, d.mo_ta AS description,
        d.doi_tuong AS pet_target_db, d.ma_cha AS parent_id, d.thu_tu_hien_thi AS sort_order,
        (SELECT COUNT(*) FROM san_pham s WHERE s.ma_danh_muc = d.ma_danh_muc) AS product_count
       FROM danh_muc_san_pham d
       ORDER BY d.thu_tu_hien_thi ASC, d.ma_danh_muc ASC`
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        icon: r.icon || '',
        description: r.description || '',
        petTarget: petTargetFromDb(r.pet_target_db),
        parentId: r.parent_id || '',
        sortOrder: r.sort_order != null ? Number(r.sort_order) : 0,
        productCount: Number(r.product_count) || 0,
      }))
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Tạo mới ---
router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    let id = slugCategoryId(b.id);
    if (!id) id = slugCategoryId(b.name);
    if (!id) {
      return res.status(400).json({ error: 'Thiếu mã danh mục (slug) hoặc tên hợp lệ.' });
    }
    const name = String(b.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Vui lòng nhập tên danh mục.' });
    }
    const [dup] = await pool.query(
      'SELECT ma_danh_muc FROM danh_muc_san_pham WHERE ma_danh_muc = ? LIMIT 1',
      [id]
    );
    if (dup.length) {
      return res.status(409).json({ error: 'Mã danh mục đã tồn tại.' });
    }
    const icon = b.icon != null ? String(b.icon).trim().slice(0, 50) : null;
    const description = b.description != null ? String(b.description).trim() : null;
    const petDb = petTargetToDb(b.petTarget);
    let parentId = b.parentId != null ? String(b.parentId).trim() : '';
    if (parentId === '') parentId = null;
    else {
      const [p] = await pool.query(
        'SELECT ma_danh_muc FROM danh_muc_san_pham WHERE ma_danh_muc = ? LIMIT 1',
        [parentId]
      );
      if (!p.length) parentId = null;
    }
    const sortOrder =
      b.sortOrder != null && b.sortOrder !== '' ? parseInt(String(b.sortOrder), 10) : 0;
    const ord = Number.isFinite(sortOrder) ? sortOrder : 0;

    await pool.query(
      `INSERT INTO danh_muc_san_pham (ma_danh_muc, ten, bieu_tuong, mo_ta, doi_tuong, ma_cha, thu_tu_hien_thi)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, icon || null, description || null, petDb, parentId, ord]
    );
    res.status(201).json({
      success: true,
      category: {
        id,
        name,
        icon: icon || '',
        description: description || '',
        petTarget: petTargetFromDb(petDb),
        parentId: parentId || '',
        sortOrder: ord,
        productCount: 0,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Sửa ---
router.patch('/:id', async (req, res) => {
  try {
    const id = decodeURIComponent(String(req.params.id || ''));
    if (!id) return res.status(400).json({ error: 'Thiếu mã danh mục.' });
    const [exist] = await pool.query(
      'SELECT ma_danh_muc FROM danh_muc_san_pham WHERE ma_danh_muc = ? LIMIT 1',
      [id]
    );
    if (!exist.length) return res.status(404).json({ error: 'Không tìm thấy danh mục.' });

    const b = req.body || {};
    const name = String(b.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Tên danh mục không được để trống.' });
    const icon = b.icon != null ? String(b.icon).trim().slice(0, 50) : null;
    const description = b.description != null ? String(b.description).trim() : null;
    const petDb = petTargetToDb(b.petTarget);
    let parentId = b.parentId != null ? String(b.parentId).trim() : '';
    if (parentId === id) {
      return res.status(400).json({ error: 'Danh mục cha không được trùng chính nó.' });
    }
    if (parentId === '') parentId = null;
    else {
      const [p] = await pool.query(
        'SELECT ma_danh_muc FROM danh_muc_san_pham WHERE ma_danh_muc = ? LIMIT 1',
        [parentId]
      );
      if (!p.length) parentId = null;
    }
    const sortOrder =
      b.sortOrder != null && b.sortOrder !== '' ? parseInt(String(b.sortOrder), 10) : 0;
    const ord = Number.isFinite(sortOrder) ? sortOrder : 0;

    await pool.query(
      `UPDATE danh_muc_san_pham SET ten = ?, bieu_tuong = ?, mo_ta = ?, doi_tuong = ?, ma_cha = ?, thu_tu_hien_thi = ?
       WHERE ma_danh_muc = ?`,
      [name, icon || null, description || null, petDb, parentId, ord, id]
    );

    const [rowsOut] = await pool.query(
      `SELECT d.ma_danh_muc AS id, d.ten AS name, d.bieu_tuong AS icon, d.mo_ta AS description,
        d.doi_tuong AS pet_target_db, d.ma_cha AS parent_id, d.thu_tu_hien_thi AS sort_order,
        (SELECT COUNT(*) FROM san_pham s WHERE s.ma_danh_muc = d.ma_danh_muc) AS product_count
       FROM danh_muc_san_pham d WHERE d.ma_danh_muc = ?`,
      [id]
    );
    const row = rowsOut[0];
    if (!row) return res.status(404).json({ error: 'Không tìm thấy danh mục sau khi cập nhật.' });
    res.json({
      success: true,
      category: {
        id: row.id,
        name: row.name,
        icon: row.icon || '',
        description: row.description || '',
        petTarget: petTargetFromDb(row.pet_target_db),
        parentId: row.parent_id || '',
        sortOrder: row.sort_order != null ? Number(row.sort_order) : 0,
        productCount: Number(row.product_count) || 0,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Xóa (chặn nếu còn SP hoặc danh mục con) ---
router.delete('/:id', async (req, res) => {
  try {
    const id = decodeURIComponent(String(req.params.id || ''));
    if (!id) return res.status(400).json({ error: 'Thiếu mã danh mục.' });
    const [[pc]] = await pool.query(
      'SELECT COUNT(*) AS n FROM san_pham WHERE ma_danh_muc = ?',
      [id]
    );
    if (Number(pc.n) > 0) {
      return res.status(400).json({
        error: `Không xóa được: còn ${pc.n} sản phẩm thuộc danh mục này.`,
      });
    }
    const [[cc]] = await pool.query(
      'SELECT COUNT(*) AS n FROM danh_muc_san_pham WHERE ma_cha = ?',
      [id]
    );
    if (Number(cc.n) > 0) {
      return res.status(400).json({
        error: `Không xóa được: còn ${cc.n} danh mục con. Hãy xóa hoặc chuyển danh mục con trước.`,
      });
    }
    const [r] = await pool.query('DELETE FROM danh_muc_san_pham WHERE ma_danh_muc = ?', [id]);
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục.' });
    }
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

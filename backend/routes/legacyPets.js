/**
 * Thú cưng (bảng thu_cung): GET theo user_id (public query) | GET/POST/PATCH/DELETE có token.
 */
const express = require('express');
const { pool } = require('../config/db');
const { authUserFromToken } = require('./legacyAuth');

const router = express.Router();

function mapPetRow(r) {
  const pt = String(r.pet_type || 'dog').toLowerCase() === 'cat' ? 'cat' : 'dog';
  return {
    id: Number(r.id),
    name: r.name,
    pet_type: pt,
    weight_kg: r.weight_kg != null && r.weight_kg !== '' ? Number(r.weight_kg) : null,
  };
}

async function handlePetsList(req, res) {
  try {
    const userId = parseInt(String(req.query.user_id || '0'), 10);
    if (!userId || userId <= 0) {
      return res.json([]);
    }
    const [rows] = await pool.query(
      `SELECT id, ten AS name, loai AS pet_type, can_nang_kg AS weight_kg
       FROM thu_cung WHERE id_nguoi_dung = ? ORDER BY ten`,
      [userId]
    );
    res.json(rows.map(mapPetRow));
  } catch (_e) {
    res.json([]);
  }
}

async function handleMyPets(req, res) {
  try {
    const row = await authUserFromToken(req);
    const [rows] = await pool.query(
      `SELECT id, ten AS name, loai AS pet_type, can_nang_kg AS weight_kg
       FROM thu_cung WHERE id_nguoi_dung = ? ORDER BY ten`,
      [row.id]
    );
    res.json({ success: true, pets: rows.map(mapPetRow) });
  } catch (e) {
    const msg = e && e.message ? String(e.message) : '';
    if (
      msg === 'NO_TOKEN' ||
      msg === 'EXPIRED_TOKEN' ||
      msg === 'INVALID_TOKEN' ||
      msg === 'INVALID_USER'
    ) {
      return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập.', pets: [] });
    }
    res.status(500).json({ success: false, error: 'Không tải được danh sách.', pets: [] });
  }
}

async function handleCreatePet(req, res) {
  try {
    const row = await authUserFromToken(req);
    const name = String(req.body?.name ?? '').trim();
    let petType = String(req.body?.pet_type || 'dog').toLowerCase();
    if (petType !== 'cat') petType = 'dog';
    const w = req.body?.weight_kg;
    const weightKg =
      w != null && w !== '' && Number.isFinite(Number(w)) ? Number(w) : null;
    if (!name) {
      return res.json({ success: false, error: 'Vui lòng nhập tên thú cưng.' });
    }
    const [ins] = await pool.query(
      `INSERT INTO thu_cung (id_nguoi_dung, ten, loai, can_nang_kg) VALUES (?, ?, ?, ?)`,
      [row.id, name, petType, weightKg]
    );
    const pet = {
      id: Number(ins.insertId),
      name,
      pet_type: petType,
      weight_kg: weightKg,
    };
    res.json({ success: true, pet });
  } catch (e) {
    const msg = e && e.message ? String(e.message) : '';
    if (
      msg === 'NO_TOKEN' ||
      msg === 'EXPIRED_TOKEN' ||
      msg === 'INVALID_TOKEN' ||
      msg === 'INVALID_USER'
    ) {
      return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập.' });
    }
    res.json({ success: false, error: 'Không thể thêm thú cưng.' });
  }
}

async function handleUpdatePet(req, res) {
  try {
    const row = await authUserFromToken(req);
    const id = parseInt(String(req.params.id || '0'), 10);
    if (!id) {
      return res.json({ success: false, error: 'Thiếu mã thú cưng.' });
    }
    const [[existing]] = await pool.query(
      `SELECT id FROM thu_cung WHERE id = ? AND id_nguoi_dung = ? LIMIT 1`,
      [id, row.id]
    );
    if (!existing) {
      return res.json({ success: false, error: 'Không tìm thấy thú cưng.' });
    }
    const name = String(req.body?.name ?? '').trim();
    let petType = String(req.body?.pet_type || 'dog').toLowerCase();
    if (petType !== 'cat') petType = 'dog';
    const w = req.body?.weight_kg;
    const weightKg =
      w != null && w !== '' && Number.isFinite(Number(w)) ? Number(w) : null;
    if (!name) {
      return res.json({ success: false, error: 'Vui lòng nhập tên thú cưng.' });
    }
    await pool.query(
      `UPDATE thu_cung SET ten = ?, loai = ?, can_nang_kg = ? WHERE id = ? AND id_nguoi_dung = ?`,
      [name, petType, weightKg, id, row.id]
    );
    res.json({
      success: true,
      pet: { id, name, pet_type: petType, weight_kg: weightKg },
    });
  } catch (e) {
    const msg = e && e.message ? String(e.message) : '';
    if (
      msg === 'NO_TOKEN' ||
      msg === 'EXPIRED_TOKEN' ||
      msg === 'INVALID_TOKEN' ||
      msg === 'INVALID_USER'
    ) {
      return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập.' });
    }
    res.json({ success: false, error: 'Không thể cập nhật.' });
  }
}

async function handleDeletePet(req, res) {
  try {
    const row = await authUserFromToken(req);
    const id = parseInt(String(req.params.id || '0'), 10);
    if (!id) {
      return res.json({ success: false, error: 'Thiếu mã thú cưng.' });
    }
    const [r] = await pool.query(
      `DELETE FROM thu_cung WHERE id = ? AND id_nguoi_dung = ?`,
      [id, row.id]
    );
    if (!r.affectedRows) {
      return res.json({ success: false, error: 'Không tìm thấy thú cưng.' });
    }
    res.json({ success: true });
  } catch (e) {
    const msg = e && e.message ? String(e.message) : '';
    if (
      msg === 'NO_TOKEN' ||
      msg === 'EXPIRED_TOKEN' ||
      msg === 'INVALID_TOKEN' ||
      msg === 'INVALID_USER'
    ) {
      return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập.' });
    }
    res.json({ success: false, error: 'Không thể xóa.' });
  }
}

router.get('/api/pets/me.php', handleMyPets);
router.get('/api/pets/me', handleMyPets);
router.post('/api/pets.php', handleCreatePet);
router.post('/api/pets', handleCreatePet);
router.patch('/api/pets/:id.php', handleUpdatePet);
router.patch('/api/pets/:id', handleUpdatePet);
router.delete('/api/pets/:id.php', handleDeletePet);
router.delete('/api/pets/:id', handleDeletePet);

router.get('/api/pets.php', handlePetsList);
router.get('/api/pets', handlePetsList);

module.exports = router;

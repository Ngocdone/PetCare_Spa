/**
 * Đặt lịch spa: validate dịch vụ đang bán → tuỳ chọn tạo thu_cung mới → INSERT lich_hen_spa + chi_tiet_lich_hen (giá theo loại chó/mèo).
 */
const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

async function handleBooking(req, res) {
  const input = req.body || {};
  try {
    // --- Chuẩn hóa input & kiểm tra dịch vụ ---
    let userId = input.user_id != null ? parseInt(String(input.user_id), 10) : null;
    if (!userId || userId <= 0) userId = null;
    let petId = input.pet_id != null ? parseInt(String(input.pet_id), 10) : null;
    const serviceId = String(input.service_id || '').trim();
    const date = String(input.date || '').trim();
    let time = String(input.time || '').trim();
    let shopId = input.shop_id != null ? parseInt(String(input.shop_id), 10) : null;
    if (!shopId || shopId <= 0) shopId = null;
    const ownerName = String(input.owner_name || '').trim();
    const ownerPhone = String(input.owner_phone || '').trim();
    const ownerEmail = String(input.owner_email || '').trim();
    const ownerAddress = String(input.owner_address || '').trim();
    const petName = String(input.pet_name || '').trim();
    let petType = String(input.pet_type || 'dog').toLowerCase().trim();
    const petWeightKg =
      input.pet_weight_kg != null && input.pet_weight_kg !== ''
        ? Number(input.pet_weight_kg)
        : null;
    const note = String(input.note || '').trim();

    if (petType !== 'dog') petType = 'cat';

    if (
      !serviceId ||
      !date ||
      !time ||
      !ownerName ||
      !ownerPhone ||
      !ownerEmail ||
      !petName
    ) {
      return res.json({ success: false, error: 'Vui lòng điền đầy đủ thông tin.' });
    }

    // Chặn đặt lịch với dịch vụ đã tạm ngưng/ngưng bán.
    const [svcStatusRows] = await pool.query(
      `SELECT trang_thai FROM dich_vu_spa WHERE ma_dich_vu = ? LIMIT 1`,
      [serviceId]
    );
    if (!svcStatusRows.length) {
      return res.json({ success: false, error: 'Dịch vụ không tồn tại hoặc đã bị xóa.' });
    }
    const serviceStatus = String(svcStatusRows[0].trang_thai || '').toLowerCase();
    if (serviceStatus !== 'dang_ban') {
      return res.json({ success: false, error: 'Dịch vụ tạm ngưng. Vui lòng chọn dịch vụ khác.' });
    }

    const isPlaceholderPetName = /chưa gắn hồ sơ/i.test(petName);
    if ((petId === 0 || petId == null) && userId > 0 && petName && !isPlaceholderPetName) {
      try {
        const [pins] = await pool.query(
          `INSERT INTO thu_cung (id_nguoi_dung, ten, loai, can_nang_kg) VALUES (?, ?, ?, ?)`,
          [userId, petName, petType, petWeightKg]
        );
        petId = pins.insertId;
      } catch {
        petId = null;
      }
    }
    if (!petId || petId <= 0) petId = null;

    if (time.length === 5) time = `${time}:00`;

    const [ins] = await pool.query(
      `INSERT INTO lich_hen_spa (id_nguoi_dung, id_thu_cung, ma_dich_vu, ngay_hen, gio_hen, id_chi_nhanh, ten_chu_nuoi, so_dien_thoai, email, dia_chi, ten_thu_cung, loai_thu_cung, can_nang_kg, trang_thai, ghi_chu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cho_xac_nhan', ?)`,
      [
        userId,
        petId,
        serviceId,
        date,
        time,
        shopId,
        ownerName,
        ownerPhone,
        ownerEmail,
        ownerAddress || null,
        petName,
        petType,
        petWeightKg,
        note || null,
      ]
    );
    const idLichHen = ins.insertId;

    const [svcRows] = await pool.query(
      `SELECT ten, COALESCE(gia_cho, gia_meo, 0) AS gia_cho, COALESCE(gia_meo, gia_cho, 0) AS gia_meo FROM dich_vu_spa WHERE ma_dich_vu = ?`,
      [serviceId]
    );
    const row = svcRows[0];
    const tenDichVu = row ? String(row.ten || '').trim() : '';
    const donGia = row
      ? Math.round(petType === 'dog' ? Number(row.gia_cho) : Number(row.gia_meo))
      : 0;
    await pool.query(
      `INSERT INTO chi_tiet_lich_hen (id_lich_hen, ma_dich_vu, ten_dich_vu, don_gia, so_luong, ghi_chu) VALUES (?, ?, ?, ?, 1, ?)`,
      [idLichHen, serviceId, tenDichVu || null, donGia, note || null]
    );

    res.json({ success: true, id: idLichHen });
  } catch (e) {
    res.json({ success: false, error: `Lỗi ghi lịch hẹn: ${e.message}` });
  }
}

router.post('/api/booking.php', handleBooking);
router.post('/api/bookings', handleBooking);

module.exports = router;

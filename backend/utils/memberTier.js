/**
 * Hạng thành viên theo tổng chi tiêu: đơn hoàn thành + lịch spa hoàn thành. Ngưỡng VND: TIER_*_MIN_VND.
 *
 * Luồng tính lại: SUM(don_hang) + SUM(doanh thu lịch đã hoàn thành) theo user_id hoặc email → spendingToTierDb →
 * UPDATE nguoi_dung nếu không bị hang_khoa_boi_admin.
 */
const { pool } = require('../config/db');

function numEnv(key, fallback) {
  const n = parseInt(String(process.env[key] || ''), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function thresholdSilver() {
  return numEnv('TIER_SILVER_MIN_VND', 500_000);
}
function thresholdGold() {
  return numEnv('TIER_GOLD_MIN_VND', 2_000_000);
}
function thresholdVip() {
  return numEnv('TIER_VIP_MIN_VND', 5_000_000);
}

/** Tổng tiền đơn hoàn thành → mã hạng DB */
function spendingToTierDb(totalVnd) {
  const t = Number(totalVnd) || 0;
  if (t >= thresholdVip()) return 'kim_cuong';
  if (t >= thresholdGold()) return 'vang';
  if (t >= thresholdSilver()) return 'bac';
  return 'dong';
}

const TIER_MAP = {
  dong: 'bronze',
  bac: 'silver',
  vang: 'gold',
  kim_cuong: 'vip',
};

function tierApiFromSpending(totalVnd) {
  return TIER_MAP[spendingToTierDb(totalVnd)] || 'bronze';
}

/**
 * Cập nhật hang_thanh_vien theo chi tiêu nếu user không bị khóa bởi admin.
 */
async function recalcUserTierIfUnlocked(userId) {
  const uid = parseInt(String(userId), 10);
  if (!Number.isFinite(uid) || uid < 1) return;

  const [[userRow]] = await pool.query('SELECT email FROM nguoi_dung WHERE id = ? LIMIT 1', [
    uid,
  ]);
  const emailTrim = userRow?.email != null ? String(userRow.email).trim() : '';

  const [[sumRow]] = await pool.query(
    `SELECT COALESCE(SUM(d.tong_tien), 0) AS s FROM don_hang d
     WHERE d.trang_thai = 'hoan_thanh'
     AND (
       d.id_nguoi_dung = ?
       OR (
         d.id_nguoi_dung IS NULL
         AND ? <> ''
         AND LOWER(TRIM(d.email)) = LOWER(?)
       )
     )`,
    [uid, emailTrim, emailTrim]
  );
  const orderTotal = Number(sumRow?.s) || 0;

  const [[apptSumRow]] = await pool.query(
    `SELECT COALESCE(SUM(
      COALESCE(
        NULLIF(ct.sum_lines, 0),
        CASE
          WHEN a.loai_thu_cung IN ('dog', 'cho') THEN COALESCE(s.gia_cho, s.gia_meo, 0)
          WHEN a.loai_thu_cung IN ('cat', 'meo') THEN COALESCE(s.gia_meo, s.gia_cho, 0)
          ELSE COALESCE(s.gia_cho, s.gia_meo, 0)
        END
      )
    ), 0) AS s
    FROM lich_hen_spa a
    LEFT JOIN dich_vu_spa s ON s.ma_dich_vu = a.ma_dich_vu
    LEFT JOIN (
      SELECT id_lich_hen, SUM(don_gia * COALESCE(so_luong, 1)) AS sum_lines
      FROM chi_tiet_lich_hen
      GROUP BY id_lich_hen
    ) ct ON ct.id_lich_hen = a.id
    WHERE a.trang_thai = 'da_hoan_thanh'
    AND (
      a.id_nguoi_dung = ?
      OR (
        a.id_nguoi_dung IS NULL
        AND ? <> ''
        AND LOWER(TRIM(a.email)) = LOWER(?)
      )
    )`,
    [uid, emailTrim, emailTrim]
  );
  const apptTotal = Number(apptSumRow?.s) || 0;
  const total = orderTotal + apptTotal;
  const tierDb = spendingToTierDb(total);

  await pool.query(
    `UPDATE nguoi_dung SET hang_thanh_vien = ?
     WHERE id = ? AND COALESCE(hang_khoa_boi_admin, 0) = 0`,
    [tierDb, uid]
  );
}

/**
 * Sau khi đổi trạng thái đơn — đồng bộ hạng khách (nếu không khóa).
 */
async function recalcTierForOrderId(orderId) {
  const oid = parseInt(String(orderId), 10);
  if (!Number.isFinite(oid) || oid < 1) return;
  const [[row]] = await pool.query(
    'SELECT id_nguoi_dung, email FROM don_hang WHERE id = ? LIMIT 1',
    [oid]
  );
  let uid = row?.id_nguoi_dung != null ? parseInt(String(row.id_nguoi_dung), 10) : null;
  if (uid && uid >= 1) {
    await recalcUserTierIfUnlocked(uid);
    return;
  }
  const em = row?.email != null ? String(row.email).trim() : '';
  if (!em) return;
  const [[urow]] = await pool.query(
    'SELECT id FROM nguoi_dung WHERE LOWER(TRIM(email)) = LOWER(?) LIMIT 1',
    [em]
  );
  const linked = urow?.id != null ? parseInt(String(urow.id), 10) : null;
  if (linked && linked >= 1) await recalcUserTierIfUnlocked(linked);
}

/**
 * Sau khi đổi trạng thái lịch spa — đồng bộ hạng khách (nếu không khóa).
 */
async function recalcTierForAppointmentId(appointmentId) {
  const aid = parseInt(String(appointmentId), 10);
  if (!Number.isFinite(aid) || aid < 1) return;
  const [[row]] = await pool.query(
    'SELECT id_nguoi_dung, email FROM lich_hen_spa WHERE id = ? LIMIT 1',
    [aid]
  );
  let uid = row?.id_nguoi_dung != null ? parseInt(String(row.id_nguoi_dung), 10) : null;
  if (uid && uid >= 1) {
    await recalcUserTierIfUnlocked(uid);
    return;
  }
  const em = row?.email != null ? String(row.email).trim() : '';
  if (!em) return;
  const [[urow]] = await pool.query(
    'SELECT id FROM nguoi_dung WHERE LOWER(TRIM(email)) = LOWER(?) LIMIT 1',
    [em]
  );
  const linked = urow?.id != null ? parseInt(String(urow.id), 10) : null;
  if (linked && linked >= 1) await recalcUserTierIfUnlocked(linked);
}

module.exports = {
  spendingToTierDb,
  tierApiFromSpending,
  thresholdSilver,
  thresholdGold,
  thresholdVip,
  recalcUserTierIfUnlocked,
  recalcTierForOrderId,
  recalcTierForAppointmentId,
  TIER_MAP,
};

/**
 * Pool MySQL (mysql2/promise): dùng chung cho mọi route; testConnection() gọi khi khởi động server.
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'petcare_spa',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  /** Tránh DATE → JS Date → JSON UTC làm lệch ngày so với lịch VN khi so sánh YYYY-MM-DD */
  dateStrings: true,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('MySQL đã kết nối:', process.env.DB_NAME || 'petspa');
  } catch (err) {
    console.error('Lỗi kết nối MySQL:', err.message);
  }
}

/**
 * Đảm bảo có cột `dia_chi` (địa chỉ người dùng). Chạy một lần khi khởi động — an toàn nếu cột đã tồn tại.
 */
async function ensureNguoiDungDiaChiColumn() {
  try {
    await pool.query(
      'ALTER TABLE nguoi_dung ADD COLUMN dia_chi TEXT NULL DEFAULT NULL AFTER so_dien_thoai'
    );
    console.log('DB: đã thêm cột nguoi_dung.dia_chi');
  } catch (e) {
    const dup =
      e.code === 'ER_DUP_FIELDNAME' ||
      e.errno === 1060 ||
      String(e.message || '').includes('Duplicate column name');
    if (dup) return;
    console.warn('DB: không thể đảm bảo cột dia_chi:', e.message);
  }
}

module.exports = { pool, testConnection, ensureNguoiDungDiaChiColumn };

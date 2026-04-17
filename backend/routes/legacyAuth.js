/**
 * Xác thực người dùng tương thích PHP cũ: token base64 `id:md5(email:passHash):expiry`.
 *
 * Luồng: GET /api/me — giải token, khớp hash DB | POST login/register — bcrypt + phát token |
 * POST auth/google — JWT Google | POST change-password | POST profile/avatar-upload (multer).
 */
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { createRemoteJWKSet, jwtVerify } = require('jose');
const { pool } = require('../config/db');
const { md5, cookieGet } = require('./legacyShared');

const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

const router = express.Router();

/** Chuỗi địa chỉ từ cột `dia_chi` → JSON `address` */
function addressFromDb(val) {
  if (val == null) return '';
  return String(val).trim();
}
const IMG_DIR = path.join(__dirname, '..', '..', 'img');
const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination(_req, _file, cb) {
      fs.mkdirSync(IMG_DIR, { recursive: true });
      cb(null, IMG_DIR);
    },
    filename(_req, file, cb) {
      const ext = MIME_EXT[file.mimetype] || path.extname(file.originalname) || '.jpg';
      const stamp = Date.now();
      const rand = crypto.randomBytes(4).toString('hex');
      cb(null, `avt_${stamp}_${rand}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (MIME_EXT[file.mimetype]) return cb(null, true);
    cb(new Error('Định dạng không hợp lệ. Chỉ JPG, PNG, WebP, GIF.'));
  },
});

function parseSessionToken(token) {
  const raw = String(token || '').trim();
  if (!raw) return null;
  let decoded = '';
  try {
    decoded = Buffer.from(raw, 'base64').toString('utf8');
  } catch {
    return null;
  }
  const parts = decoded.split(':');
  if (parts.length < 3) return null;
  const userId = parseInt(parts[0], 10);
  const userHash = parts[1];
  const expiry = parseInt(parts[2], 10);
  if (!Number.isFinite(userId) || !Number.isFinite(expiry)) return null;
  if (Date.now() / 1000 > expiry) return { expired: true };
  return { userId, userHash, expiry };
}

function getCandidateTokens(req) {
  const tokens = [];
  let headerToken = String(req.headers.authorization || '').trim();
  if (headerToken.toLowerCase().startsWith('bearer ')) headerToken = headerToken.slice(7).trim();
  const cookieToken = cookieGet(req, 'petspa_token');
  if (headerToken) tokens.push(headerToken);
  if (cookieToken && cookieToken !== headerToken) tokens.push(cookieToken);
  return tokens;
}

// Dùng nội bộ (avatar): đọc Bearer/cookie → decode → so khớp md5(email:mat_khau_ma_hoa)
async function authUserFromToken(req) {
  const candidates = getCandidateTokens(req);
  if (!candidates.length) throw new Error('NO_TOKEN');
  let sawExpired = false;
  for (const token of candidates) {
    const parsed = parseSessionToken(token);
    if (!parsed) continue;
    if (parsed.expired) {
      sawExpired = true;
      continue;
    }
    const { userId, userHash } = parsed;
    const [rows] = await pool.query(
      `SELECT id, ten AS name, email, so_dien_thoai AS phone, dia_chi, mat_khau_ma_hoa AS password_hash,
        hang_thanh_vien AS tier, vai_tro AS role, anh_dai_dien AS avatar_db FROM nguoi_dung WHERE id = ?`,
      [userId]
    );
    const row = rows[0];
    if (row && md5(`${row.email}:${row.password_hash}`) === userHash) {
      return row;
    }
  }
  if (sawExpired) throw new Error('EXPIRED_TOKEN');
  throw new Error('INVALID_TOKEN');
}

async function handleMe(req, res) {
  try {
    let token = String(req.headers.authorization || '').trim();
    if (token.startsWith('Bearer ')) token = token.slice(7).trim();
    if (!token) token = cookieGet(req, 'petspa_token');
    if (!token) {
      return res.json({ success: false, error: 'No token provided' });
    }
    let decoded;
    try {
      decoded = Buffer.from(token, 'base64').toString('utf8');
    } catch {
      return res.json({ success: false, error: 'Invalid token' });
    }
    const parts = decoded.split(':');
    if (parts.length < 3) {
      return res.json({ success: false, error: 'Invalid token' });
    }
    const userId = parseInt(parts[0], 10);
    const userHash = parts[1];
    const expiry = parseInt(parts[2], 10);
    if (!Number.isFinite(userId) || !Number.isFinite(expiry) || Date.now() / 1000 > expiry) {
      return res.json({ success: false, error: 'Invalid or expired token' });
    }
    const [rows] = await pool.query(
      `SELECT id, ten AS name, email, so_dien_thoai AS phone, dia_chi, mat_khau_ma_hoa AS password_hash,
        hang_thanh_vien AS tier, vai_tro AS role, anh_dai_dien AS avatar_db FROM nguoi_dung WHERE id = ?`,
      [userId]
    );
    const row = rows[0];
    if (!row || md5(`${row.email}:${row.password_hash}`) !== userHash) {
      return res.json({ success: false, error: 'Invalid user' });
    }
    const avatar = row.avatar_db != null ? String(row.avatar_db).trim() : '';
    res.json({
      success: true,
      user: {
        id: Number(row.id),
        name: row.name,
        email: row.email,
        phone: row.phone || '',
        address: addressFromDb(row.dia_chi),
        role: row.role,
        tier: row.tier || 'bronze',
        avatar: avatar || '',
      },
    });
  } catch {
    res.json({ success: false, error: 'Database error' });
  }
}
router.get('/api/me.php', handleMe);
router.get('/api/me', handleMe);

async function handleLogin(req, res) {
  try {
    const input = req.body || {};
    const email = String(input.email || '').trim();
    const password = String(input.password || '');
    if (!email || !password) {
      return res.json({ success: false, error: 'Email hoặc mật khẩu không đúng.' });
    }
    const [rows] = await pool.query(
      `SELECT id, ten AS name, email, so_dien_thoai AS phone, dia_chi, mat_khau_ma_hoa AS password_hash,
        hang_thanh_vien AS tier, vai_tro AS role, anh_dai_dien AS avatar_db FROM nguoi_dung WHERE email = ?`,
      [email]
    );
    const row = rows[0];
    if (!row) {
      return res.json({ success: false, error: 'Email hoặc mật khẩu không đúng.' });
    }
    let valid = false;
    try {
      valid = bcrypt.compareSync(password, row.password_hash || '');
    } catch {
      valid = false;
    }
    if (!valid && row.password_hash === password) valid = true;

    if (!valid) {
      return res.json({ success: false, error: 'Email hoặc mật khẩu không đúng.' });
    }

    const [[passRow]] = await pool.query('SELECT mat_khau_ma_hoa FROM nguoi_dung WHERE id = ?', [
      row.id,
    ]);
    const passHash = passRow?.mat_khau_ma_hoa || row.password_hash;
    const userHash = md5(`${row.email}:${passHash}`);
    const expiry = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
    const token = Buffer.from(`${row.id}:${userHash}:${expiry}`, 'utf8').toString('base64');

    const avatar = row.avatar_db != null ? String(row.avatar_db).trim() : '';
    res.json({
      success: true,
      token,
      user: {
        id: Number(row.id),
        name: row.name,
        email: row.email,
        phone: row.phone || '',
        address: addressFromDb(row.dia_chi),
        role: row.role,
        tier: row.tier || 'bronze',
        avatar: avatar || '',
      },
    });
  } catch (e) {
    res.json({ success: false, error: 'Không thể kết nối cơ sở dữ liệu.' });
  }
}
router.post('/api/login.php', handleLogin);
router.post('/api/login', handleLogin);

async function handleRegister(req, res) {
  try {
    const input = req.body || {};
    const name = String(input.name || '').trim();
    const email = String(input.email || '').trim();
    const phone = String(input.phone || '').trim();
    const password = String(input.password || '');
    if (!name) return res.json({ success: false, error: 'Vui lòng nhập họ tên.' });
    if (!email) return res.json({ success: false, error: 'Vui lòng nhập email.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.json({ success: false, error: 'Email không hợp lệ.' });
    }
    if (password.length < 6) {
      return res.json({ success: false, error: 'Mật khẩu ít nhất 6 ký tự.' });
    }
    const [dup] = await pool.query('SELECT id FROM nguoi_dung WHERE email = ?', [email]);
    if (dup.length) {
      return res.json({ success: false, error: 'Email đã được đăng ký.' });
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const [ins] = await pool.query(
      `INSERT INTO nguoi_dung (ten, email, mat_khau_ma_hoa, so_dien_thoai, hang_thanh_vien, vai_tro) VALUES (?, ?, ?, ?, 'dong', 'user')`,
      [name, email, passwordHash, phone || null]
    );
    const id = ins.insertId;
    const userHash = md5(`${email}:${passwordHash}`);
    const expiry = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
    const token = Buffer.from(`${id}:${userHash}:${expiry}`, 'utf8').toString('base64');

    res.json({
      success: true,
      token,
      user: {
        id,
        name,
        email,
        phone,
        address: '',
        role: 'user',
        tier: 'bronze',
        avatar: '',
      },
    });
  } catch (e) {
    res.json({ success: false, error: 'Không thể kết nối cơ sở dữ liệu.' });
  }
}
router.post('/api/register.php', handleRegister);
router.post('/api/register', handleRegister);

async function verifyGoogleIdToken(credential) {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) {
    const err = new Error('no_client');
    err.code = 'no_client';
    throw err;
  }
  const { payload } = await jwtVerify(credential, googleJwks, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: clientId,
  });
  const email = String(payload.email || '').trim().toLowerCase();
  const verified =
    payload.email_verified === true ||
    payload.email_verified === 'true' ||
    String(payload.email_verified || '') === '1';
  if (!email || !verified) {
    const err = new Error('email');
    err.code = 'email';
    throw err;
  }
  return {
    sub: String(payload.sub || ''),
    email,
    name: String(payload.name || '').trim() || email.split('@')[0],
    picture: payload.picture ? String(payload.picture).trim() : '',
  };
}

function issueSessionToken(userId, email, passHash) {
  const userHash = md5(`${email}:${passHash}`);
  const expiry = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
  return Buffer.from(`${userId}:${userHash}:${expiry}`, 'utf8').toString('base64');
}

async function handleGoogleAuth(req, res) {
  try {
    const credential = String(req.body?.credential || req.body?.idToken || '').trim();
    if (!credential) {
      return res.json({ success: false, error: 'Thiếu mã xác thực Google.' });
    }

    let profile;
    try {
      profile = await verifyGoogleIdToken(credential);
    } catch (e) {
      if (e.code === 'no_client') {
        return res.json({
          success: false,
          error: 'Chưa cấu hình GOOGLE_CLIENT_ID trên máy chủ.',
        });
      }
      if (e.code === 'email') {
        return res.json({ success: false, error: 'Email Google chưa được xác minh.' });
      }
      return res.json({ success: false, error: 'Mã Google không hợp lệ hoặc đã hết hạn.' });
    }

    const [rows] = await pool.query(
      `SELECT id, ten AS name, email, so_dien_thoai AS phone, dia_chi, mat_khau_ma_hoa AS password_hash,
        hang_thanh_vien AS tier, vai_tro AS role, anh_dai_dien AS avatar_db
        FROM nguoi_dung WHERE email = ?`,
      [profile.email]
    );
    const existing = rows[0];

    if (!existing) {
      const rndSecret = crypto.randomBytes(24).toString('hex');
      const pwdHash = bcrypt.hashSync(`google_oauth|${profile.sub}|${rndSecret}`, 10);
      const pic = profile.picture ? profile.picture.slice(0, 255) : null;
      const [ins] = await pool.query(
        `INSERT INTO nguoi_dung (ten, email, mat_khau_ma_hoa, so_dien_thoai, hang_thanh_vien, vai_tro, anh_dai_dien)
         VALUES (?, ?, ?, NULL, 'dong', 'user', ?)`,
        [profile.name, profile.email, pwdHash, pic]
      );
      const id = ins.insertId;
      const token = issueSessionToken(id, profile.email, pwdHash);
      return res.json({
        success: true,
        token,
        user: {
          id,
          name: profile.name,
          email: profile.email,
          phone: '',
          address: '',
          role: 'user',
          tier: 'bronze',
          avatar: profile.picture ? profile.picture.slice(0, 255) : '',
        },
      });
    }

    let avatarDb = existing.avatar_db != null ? String(existing.avatar_db).trim() : '';
    if (profile.picture && !avatarDb) {
      await pool.query('UPDATE nguoi_dung SET anh_dai_dien = ? WHERE id = ?', [
        profile.picture.slice(0, 255),
        existing.id,
      ]);
      avatarDb = profile.picture.slice(0, 255);
    }

    const [[passRow]] = await pool.query('SELECT mat_khau_ma_hoa FROM nguoi_dung WHERE id = ?', [
      existing.id,
    ]);
    const passHash = passRow?.mat_khau_ma_hoa || existing.password_hash;
    const token = issueSessionToken(existing.id, existing.email, passHash);

    res.json({
      success: true,
      token,
      user: {
        id: Number(existing.id),
        name: existing.name,
        email: existing.email,
        phone: existing.phone || '',
        address: addressFromDb(existing.dia_chi),
        role: existing.role,
        tier: existing.tier || 'bronze',
        avatar: avatarDb || '',
      },
    });
  } catch (_e) {
    res.json({ success: false, error: 'Không thể đăng nhập bằng Google.' });
  }
}
router.post('/api/auth/google', handleGoogleAuth);
router.post('/api/auth/google.php', handleGoogleAuth);

async function handleChangePassword(req, res) {
  try {
    let token = String(req.headers.authorization || '').trim();
    if (token.toLowerCase().startsWith('bearer ')) token = token.slice(7).trim();
    if (!token) token = cookieGet(req, 'petspa_token');
    if (!token) {
      return res.json({
        success: false,
        error: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
      });
    }
    let decoded;
    try {
      decoded = Buffer.from(token, 'base64').toString('utf8');
    } catch {
      return res.json({ success: false, error: 'Phiên đăng nhập không hợp lệ.' });
    }
    const parts = decoded.split(':');
    if (parts.length < 3) {
      return res.json({ success: false, error: 'Phiên đăng nhập không hợp lệ.' });
    }
    const userId = parseInt(parts[0], 10);
    const userHash = parts[1];
    const expiry = parseInt(parts[2], 10);
    if (!Number.isFinite(userId) || !Number.isFinite(expiry) || Date.now() / 1000 > expiry) {
      return res.json({
        success: false,
        error: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
      });
    }
    const [rows] = await pool.query(
      'SELECT id, email, mat_khau_ma_hoa AS password_hash FROM nguoi_dung WHERE id = ?',
      [userId]
    );
    const row = rows[0];
    if (!row || md5(`${row.email}:${row.password_hash}`) !== userHash) {
      return res.json({
        success: false,
        error: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
      });
    }

    const input = req.body || {};
    const currentPassword = String(input.currentPassword || '');
    const newPassword = String(input.newPassword || '');
    const newPasswordConfirm = String(input.newPasswordConfirm || '');

    if (!currentPassword) {
      return res.json({ success: false, error: 'Vui lòng nhập mật khẩu hiện tại.' });
    }
    if (newPassword.length < 6) {
      return res.json({ success: false, error: 'Mật khẩu mới ít nhất 6 ký tự.' });
    }
    if (newPassword !== newPasswordConfirm) {
      return res.json({ success: false, error: 'Xác nhận mật khẩu mới không khớp.' });
    }

    let validCurrent = false;
    try {
      validCurrent = bcrypt.compareSync(currentPassword, row.password_hash || '');
    } catch {
      validCurrent = false;
    }
    if (!validCurrent && row.password_hash === currentPassword) validCurrent = true;

    if (!validCurrent) {
      return res.json({ success: false, error: 'Mật khẩu hiện tại không đúng.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE nguoi_dung SET mat_khau_ma_hoa = ? WHERE id = ?', [newHash, userId]);

    const newUserHash = md5(`${row.email}:${newHash}`);
    const newExpiry = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
    const newToken = Buffer.from(`${userId}:${newUserHash}:${newExpiry}`, 'utf8').toString('base64');

    res.json({ success: true, token: newToken });
  } catch (_e) {
    res.json({ success: false, error: 'Không thể cập nhật mật khẩu.' });
  }
}
router.post('/api/change-password.php', handleChangePassword);
router.post('/api/change-password', handleChangePassword);

/**
 * PATCH /api/profile — cập nhật ten, so_dien_thoai, dia_chi (Bearer hoặc cookie petspa_token).
 * Ngày sinh / giới tính vẫn chỉ lưu localStorage (chưa có cột DB).
 */
async function handleUpdateProfile(req, res) {
  try {
    const row = await authUserFromToken(req);
    const body = req.body || {};
    const name = String(body.name ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const address = String(body.address ?? '').trim();
    if (!name) {
      return res.json({ success: false, error: 'Họ tên không được để trống.' });
    }
    const phoneVal = phone || null;
    const addressVal = address || null;
    await pool.query(
      'UPDATE nguoi_dung SET ten = ?, so_dien_thoai = ?, dia_chi = ? WHERE id = ?',
      [name, phoneVal, addressVal, row.id]
    );
    const [[updated]] = await pool.query(
      `SELECT id, ten AS name, email, so_dien_thoai AS phone, dia_chi,
        hang_thanh_vien AS tier, vai_tro AS role, anh_dai_dien AS avatar_db
       FROM nguoi_dung WHERE id = ?`,
      [row.id]
    );
    const avatar =
      updated.avatar_db != null && String(updated.avatar_db).trim()
        ? String(updated.avatar_db).trim()
        : '';
    res.json({
      success: true,
      user: {
        id: Number(updated.id),
        name: updated.name,
        email: updated.email,
        phone: updated.phone || '',
        address: addressFromDb(updated.dia_chi),
        role: updated.role,
        tier: updated.tier || 'bronze',
        avatar,
      },
    });
  } catch (e) {
    const msg = e && e.message ? String(e.message) : '';
    if (
      msg === 'NO_TOKEN' ||
      msg === 'EXPIRED_TOKEN' ||
      msg === 'INVALID_TOKEN' ||
      msg === 'INVALID_USER'
    ) {
      return res.json({
        success: false,
        error: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
      });
    }
    const sqlErr = e && (e.code || e.errno);
    if (sqlErr === 'ER_BAD_FIELD_ERROR' || e.errno === 1054) {
      return res.json({
        success: false,
        error:
          'CSDL chưa có cột địa chỉ (dia_chi). Khởi động lại máy chủ API hoặc chạy migrations/20260412_nguoi_dung_dia_chi.sql trong phpMyAdmin.',
      });
    }
    res.json({ success: false, error: 'Không thể cập nhật hồ sơ.' });
  }
}
router.patch('/api/profile.php', handleUpdateProfile);
router.patch('/api/profile', handleUpdateProfile);

router.post(
  '/api/profile/avatar-upload',
  (req, res, next) => {
    avatarUpload.single('image')(req, res, (err) => {
      if (err) {
        return res.json({ success: false, error: err.message || 'Tải ảnh thất bại.' });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.json({ success: false, error: 'Không có file ảnh.' });
      }
      let user;
      try {
        user = await authUserFromToken(req);
      } catch {
        const bodyUserId = parseInt(String(req.body?.user_id || ''), 10);
        const bodyEmail = String(req.body?.user_email || '').trim().toLowerCase();
        if (Number.isFinite(bodyUserId) && bodyUserId > 0) {
          const [rows] = await pool.query(
            `SELECT id, ten AS name, email, so_dien_thoai AS phone, dia_chi,
              hang_thanh_vien AS tier, vai_tro AS role
             FROM nguoi_dung WHERE id = ? LIMIT 1`,
            [bodyUserId]
          );
          user = rows[0];
        } else if (bodyEmail) {
          const [rows] = await pool.query(
            `SELECT id, ten AS name, email, so_dien_thoai AS phone, dia_chi,
              hang_thanh_vien AS tier, vai_tro AS role
             FROM nguoi_dung WHERE LOWER(email) = ? LIMIT 1`,
            [bodyEmail]
          );
          user = rows[0];
        }
        if (!user) {
          return res.json({ success: false, error: 'Không xác định được tài khoản để lưu ảnh.' });
        }
      }
      const avatarPath = `img/${req.file.filename}`;
      await pool.query('UPDATE nguoi_dung SET anh_dai_dien = ? WHERE id = ?', [avatarPath, user.id]);
      res.json({
        success: true,
        path: avatarPath,
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          address: addressFromDb(user.dia_chi),
          role: user.role,
          tier: user.tier || 'bronze',
          avatar: avatarPath,
        },
      });
    } catch (_e) {
      res.json({ success: false, error: 'Không thể lưu ảnh đại diện.' });
    }
  }
);

module.exports = router;
module.exports.authUserFromToken = authUserFromToken;

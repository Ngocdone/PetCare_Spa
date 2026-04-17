const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { md5 } = require("./legacyShared");
const { verifyGoogleToken } = require("../utils/loginGoogle");

const router = express.Router();

// Helper to issue the same legacy session token used by the rest of the app
function issueSessionToken(userId, email, passHash) {
  const userHash = md5(`${email}:${passHash}`);
  const expiry = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
  return Buffer.from(`${userId}:${userHash}:${expiry}`, "utf8").toString("base64");
}

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.json({ success: false, error: "Thiếu mã xác thực Google." });
    }

    // 1. Verify token with Google
    let profile;
    try {
      profile = await verifyGoogleToken(credential);
    } catch (err) {
      console.error("Google verify error:", err.message);
      return res.json({ success: false, error: "Xác thực Google thất bại." });
    }

    // 2. Check if user exists in DB
    const [rows] = await pool.query(
      `SELECT id, ten AS name, email, so_dien_thoai AS phone, dia_chi, 
        mat_khau_ma_hoa AS password_hash, hang_thanh_vien AS tier, vai_tro AS role, 
        anh_dai_dien AS avatar_db 
       FROM nguoi_dung WHERE email = ?`,
      [profile.email]
    );

    let user = rows[0];

    // 3. If user doesn't exist, create new
    if (!user) {
      const rndSecret = crypto.randomBytes(24).toString("hex");
      const pwdHash = bcrypt.hashSync(`google_oauth|${profile.sub}|${rndSecret}`, 10);
      const pic = profile.picture ? profile.picture.slice(0, 255) : null;
      
      const [ins] = await pool.query(
        `INSERT INTO nguoi_dung (ten, email, mat_khau_ma_hoa, so_dien_thoai, hang_thanh_vien, vai_tro, anh_dai_dien)
         VALUES (?, ?, ?, NULL, 'dong', 'user', ?)`,
        [profile.name, profile.email, pwdHash, pic]
      );
      
      const newId = ins.insertId;
      const [newRows] = await pool.query(
        `SELECT id, ten AS name, email, so_dien_thoai AS phone, dia_chi, 
          mat_khau_ma_hoa AS password_hash, hang_thanh_vien AS tier, vai_tro AS role, 
          anh_dai_dien AS avatar_db 
         FROM nguoi_dung WHERE id = ?`,
        [newId]
      );
      user = newRows[0];
    } else {
      // Update avatar if missing
      if (profile.picture && !user.avatar_db) {
        await pool.query("UPDATE nguoi_dung SET anh_dai_dien = ? WHERE id = ?", [
          profile.picture.slice(0, 255),
          user.id,
        ]);
        user.avatar_db = profile.picture.slice(0, 255);
      }
    }

    // 4. Issue legacy session token
    const token = issueSessionToken(user.id, user.email, user.password_hash);

    res.json({
      success: true,
      token,
      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.dia_chi || "",
        role: user.role,
        tier: user.tier || "bronze",
        avatar: user.avatar_db || "",
      },
    });
  } catch (err) {
    console.error("Google login route error:", err);
    res.json({
      success: false,
      error: "Không thể đăng nhập bằng Google.",
    });
  }
});

module.exports = router;

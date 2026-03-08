const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'petspa-secret-key';

// Đăng ký
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng điền họ tên, email và mật khẩu' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu ít nhất 6 ký tự' });
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }
    const existing = await User.findByEmail(email.toLowerCase());
    if (existing) return res.status(400).json({ error: 'Email đã được đăng ký' });

    const user = await User.create({ name, email: email.toLowerCase(), phone: phone || '', password });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user', tier: user.tier || 'bronze' },
      token
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Lỗi đăng ký' });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu' });
    }
    const user = await User.findByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user', tier: user.tier || 'bronze' },
      token
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Lỗi đăng nhập' });
  }
});

// Lấy thông tin user hiện tại
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user', tier: user.tier || 'bronze', phone: user.phone, address: user.address }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;


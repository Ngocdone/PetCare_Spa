const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
    if (!token) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'petspa-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ error: 'Token không hợp lệ' });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền' });
    }
    next();
  });
};

module.exports = { auth, adminAuth };

const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Tạo đơn hàng (khách hoặc đã đăng nhập)
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let userId = null;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'petspa-secret-key');
        userId = decoded.userId;
      } catch (_) {}
    }
    orderData.userId = userId;
    orderData.id = 'ord' + Date.now();
    orderData.status = 'pending';

    // Trừ tồn kho
    for (const item of orderData.items) {
      const p = await Product.findOne({ $or: [{ _id: item.id }, { slug: item.id }] });
      if (p && p.stock !== undefined) {
        const stockNum = parseInt(p.stock, 10);
        const qty = item.quantity || 1;
        if (!isNaN(stockNum) && stockNum >= qty) {
          p.stock = Math.max(0, stockNum - qty);
          await p.save();
        }
      }
    }

    const order = new Order(orderData);
    await order.save();
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// User: lấy đơn hàng của mình
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: lấy tất cả đơn
router.get('/', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// User: hủy đơn của mình (chỉ pending)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const byId = /^[a-f0-9]{24}$/i.test(req.params.id);
    const order = await Order.findOne(byId ? { _id: req.params.id } : { id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Không tìm thấy' });
    if (order.userId && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Không có quyền hủy đơn này' });
    }
    if (order.status !== 'pending') return res.status(400).json({ error: 'Chỉ có thể hủy đơn đang chờ' });
    order.status = 'cancelled';
    await order.save();
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const byId = /^[a-f0-9]{24}$/i.test(req.params.id);
    const order = await Order.findOneAndUpdate(
      byId ? { _id: req.params.id } : { id: req.params.id },
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

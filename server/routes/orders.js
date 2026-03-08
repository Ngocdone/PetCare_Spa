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
<<<<<<< HEAD
      const p = await Product.findOne({ slug: item.id });
=======
      const p = await Product.findOne({ $or: [{ _id: item.id }, { slug: item.id }] });
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
      if (p && p.stock !== undefined) {
        const stockNum = parseInt(p.stock, 10);
        const qty = item.quantity || 1;
        if (!isNaN(stockNum) && stockNum >= qty) {
<<<<<<< HEAD
          await Product.findByIdAndUpdate(p.id, { stock: Math.max(0, stockNum - qty) });
=======
          p.stock = Math.max(0, stockNum - qty);
          await p.save();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
        }
      }
    }

<<<<<<< HEAD
    const order = await Order.create(orderData);
=======
    const order = new Order(orderData);
    await order.save();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// User: lấy đơn hàng của mình
router.get('/my', auth, async (req, res) => {
  try {
<<<<<<< HEAD
    const orders = await Order.findByUserId(req.userId);
=======
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

<<<<<<< HEAD
// Admin: lấy tất cả đơn - tạm mở cho admin
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
=======
// Admin: lấy tất cả đơn
router.get('/', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// User: hủy đơn của mình (chỉ pending)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
<<<<<<< HEAD
    const orderId = req.params.id;
    const order = await Order.findByOrderId(orderId);
    if (!order) return res.status(404).json({ error: 'Không tìm thấy' });
    if (order.userId && order.userId !== req.userId) {
      return res.status(403).json({ error: 'Không có quyền hủy đơn này' });
    }
    if (order.status !== 'pending') return res.status(400).json({ error: 'Chỉ có thể hủy đơn đang chờ' });
    await Order.findByIdAndUpdate(order.id, { status: 'cancelled' });
    res.json({ success: true });
=======
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
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id/status', adminAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const orderId = req.params.id;
    // Try to find by order_id or id
    let order = await Order.findByOrderId(orderId);
    if (!order) {
      order = await Order.findById(orderId);
    }
    if (!order) return res.status(404).json({ error: 'Không tìm thấy' });
    await Order.findByIdAndUpdate(order.id, { status: req.body.status });
    res.json({ success: true });
=======
    const byId = /^[a-f0-9]{24}$/i.test(req.params.id);
    const order = await Order.findOneAndUpdate(
      byId ? { _id: req.params.id } : { id: req.params.id },
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(order);
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
<<<<<<< HEAD

=======
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

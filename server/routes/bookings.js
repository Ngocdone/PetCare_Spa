const express = require('express');
const Booking = require('../models/Booking');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Tạo lịch hẹn
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let userId = null;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'petspa-secret-key');
        userId = decoded.userId;
      } catch (_) {}
    }
    data.userId = userId;
    data.status = 'pending';
    const booking = new Booking(data);
    await booking.save();
    res.json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// User: lấy lịch hẹn của mình
router.get('/my', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).sort({ date: -1, time: -1 }).lean();
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: lấy tất cả
router.get('/', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: -1, time: -1 }).lean();
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// User: hủy lịch của mình
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Không tìm thấy' });
    if (booking.userId && booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Không có quyền hủy lịch này' });
    }
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Chỉ có thể hủy lịch đang chờ' });
    booking.status = 'cancelled';
    await booking.save();
    res.json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!booking) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

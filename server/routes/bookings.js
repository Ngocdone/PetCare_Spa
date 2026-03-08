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
<<<<<<< HEAD
    const booking = await Booking.create(data);
=======
    const booking = new Booking(data);
    await booking.save();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    res.json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// User: lấy lịch hẹn của mình
router.get('/my', auth, async (req, res) => {
  try {
<<<<<<< HEAD
    const bookings = await Booking.findByUserId(req.userId);
=======
    const bookings = await Booking.find({ userId: req.user._id }).sort({ date: -1, time: -1 }).lean();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

<<<<<<< HEAD
// Admin: lấy tất cả (yêu cầu auth)
router.get('/', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Public: lấy tất cả lịch hẹn (không cần auth - để admin trang web xem được)
router.get('/all', async (req, res) => {
  try {
    const bookings = await Booking.find();
=======
// Admin: lấy tất cả
router.get('/', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: -1, time: -1 }).lean();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
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
<<<<<<< HEAD
    if (booking.userId && booking.userId !== req.userId) {
      return res.status(403).json({ error: 'Không có quyền hủy lịch này' });
    }
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Chỉ có thể hủy lịch đang chờ' });
    await Booking.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    res.json({ success: true });
=======
    if (booking.userId && booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Không có quyền hủy lịch này' });
    }
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Chỉ có thể hủy lịch đang chờ' });
    booking.status = 'cancelled';
    await booking.save();
    res.json(booking);
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id/status', adminAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status });
=======
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    if (!booking) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
<<<<<<< HEAD

=======
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

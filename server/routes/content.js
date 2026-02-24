const express = require('express');
const Team = require('../models/Team');
const Testimonial = require('../models/Testimonial');
const Faq = require('../models/Faq');
const Brand = require('../models/Brand');
const Newsletter = require('../models/Newsletter');

const router = express.Router();

// Team (đội ngũ)
router.get('/team', async (req, res) => {
  try {
    const list = await Team.find().sort({ order: 1 }).lean();
    res.json(list.map(t => ({ ...t, id: t._id?.toString?.() || t.id })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Testimonials (đánh giá khách hàng)
router.get('/testimonials', async (req, res) => {
  try {
    const list = await Testimonial.find().sort({ order: 1 }).lean();
    res.json(list.map(t => ({ ...t, id: t._id?.toString?.() || t.id })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// FAQ
router.get('/faqs', async (req, res) => {
  try {
    const list = await Faq.find().sort({ order: 1 }).lean();
    res.json(list.map(f => ({ ...f, id: f._id?.toString?.() || f.id })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Brands (thương hiệu)
router.get('/brands', async (req, res) => {
  try {
    const list = await Brand.find().sort({ order: 1 }).lean();
    res.json(list.map(b => b.name));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Newsletter - đăng ký nhận tin
router.post('/newsletter', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.json({ message: 'Email đã được đăng ký trước đó.' });
    }
    await Newsletter.create({ email: email.toLowerCase() });
    res.json({ message: 'Đăng ký nhận tin thành công!' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

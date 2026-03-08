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
<<<<<<< HEAD
    const list = await Team.find();
    res.json(list);
=======
    const list = await Team.find().sort({ order: 1 }).lean();
    res.json(list.map(t => ({ ...t, id: t._id?.toString?.() || t.id })));
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Testimonials (đánh giá khách hàng)
router.get('/testimonials', async (req, res) => {
  try {
<<<<<<< HEAD
    const list = await Testimonial.find();
    res.json(list);
=======
    const list = await Testimonial.find().sort({ order: 1 }).lean();
    res.json(list.map(t => ({ ...t, id: t._id?.toString?.() || t.id })));
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// FAQ
router.get('/faqs', async (req, res) => {
  try {
<<<<<<< HEAD
    const list = await Faq.find();
    res.json(list);
=======
    const list = await Faq.find().sort({ order: 1 }).lean();
    res.json(list.map(f => ({ ...f, id: f._id?.toString?.() || f.id })));
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Brands (thương hiệu)
router.get('/brands', async (req, res) => {
  try {
<<<<<<< HEAD
    const list = await Brand.find();
=======
    const list = await Brand.find().sort({ order: 1 }).lean();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
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
<<<<<<< HEAD

=======
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

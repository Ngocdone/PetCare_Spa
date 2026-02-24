const express = require('express');
const Product = require('../models/Product');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Public: lấy danh sách
router.get('/', async (req, res) => {
  try {
    const list = await Product.find().lean();
    res.json(list.map(p => ({ ...p, id: p._id?.toString?.() || p.id })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const byId = /^[a-f0-9]{24}$/i.test(req.params.id);
    let p = await Product.findOne(byId ? { _id: req.params.id } : { slug: req.params.id }).lean();
    if (!p) p = await Product.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ ...p, id: p._id?.toString?.() || p.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: thêm/sửa/xóa
router.post('/', adminAuth, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    const p = product.toObject();
    res.json({ ...p, id: p._id?.toString?.() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!p) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ ...p, id: p._id?.toString?.() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

const express = require('express');
const Product = require('../models/Product');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Public: lấy danh sách
router.get('/', async (req, res) => {
  try {
    const list = await Product.find();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Check if it's a valid number (ID) or slug
    const isNumeric = /^\d+$/.test(id);
    let product;
    
    if (isNumeric) {
      product = await Product.findById(id);
    } else {
      product = await Product.findOne({ slug: id });
    }
    
    if (!product) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: thêm/sửa/xóa -暂时开放无需认证 (for testing)
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;


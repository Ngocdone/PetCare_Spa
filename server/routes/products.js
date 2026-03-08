const express = require('express');
const Product = require('../models/Product');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Public: lấy danh sách
router.get('/', async (req, res) => {
  try {
<<<<<<< HEAD
    const list = await Product.find();
    res.json(list);
=======
    const list = await Product.find().lean();
    res.json(list.map(p => ({ ...p, id: p._id?.toString?.() || p.id })));
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
<<<<<<< HEAD
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
=======
    const byId = /^[a-f0-9]{24}$/i.test(req.params.id);
    let p = await Product.findOne(byId ? { _id: req.params.id } : { slug: req.params.id }).lean();
    if (!p) p = await Product.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ ...p, id: p._id?.toString?.() || p.id });
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

<<<<<<< HEAD
// Admin: thêm/sửa/xóa -暂时开放无需认证 (for testing)
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.json(product);
=======
// Admin: thêm/sửa/xóa
router.post('/', adminAuth, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    const p = product.toObject();
    res.json({ ...p, id: p._id?.toString?.() });
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

<<<<<<< HEAD
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(product);
=======
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!p) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ ...p, id: p._id?.toString?.() });
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

<<<<<<< HEAD
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
=======
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ error: 'Không tìm thấy' });
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
<<<<<<< HEAD

=======
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

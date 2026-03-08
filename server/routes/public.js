const express = require('express');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Gallery = require('../models/Gallery');
const Category = require('../models/Category');

const router = express.Router();

// Lấy tất cả sản phẩm (public)
router.get('/products', async (req, res) => {
  try {
<<<<<<< HEAD
    const products = await Product.find();
=======
    const products = await Product.find().lean();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Lấy sản phẩm theo ID
router.get('/products/:id', async (req, res) => {
  try {
<<<<<<< HEAD
    const id = req.params.id;
    let p = await Product.findById(id);
    if (!p) p = await Product.findOne({ slug: id });
=======
    const p = await Product.findOne({ $or: [{ _id: req.params.id }, { id: req.params.id }, { slug: req.params.id }] }).lean();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    if (!p) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Lấy tất cả dịch vụ
router.get('/services', async (req, res) => {
  try {
<<<<<<< HEAD
    const services = await Service.find();
=======
    const services = await Service.find().lean();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    res.json(services);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Lấy gallery
router.get('/gallery', async (req, res) => {
  try {
<<<<<<< HEAD
    const gallery = await Gallery.find();
=======
    const gallery = await Gallery.find().lean();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    res.json(gallery);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Lấy categories
router.get('/categories', async (req, res) => {
  try {
<<<<<<< HEAD
    const cats = await Category.find();
=======
    const cats = await Category.find().sort({ order: 1 }).lean();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    res.json(cats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
<<<<<<< HEAD

=======
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

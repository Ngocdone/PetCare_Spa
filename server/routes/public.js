const express = require('express');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Gallery = require('../models/Gallery');
const Category = require('../models/Category');

const router = express.Router();

// Lấy tất cả sản phẩm (public)
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Lấy sản phẩm theo ID
router.get('/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let p = await Product.findById(id);
    if (!p) p = await Product.findOne({ slug: id });
    if (!p) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Lấy tất cả dịch vụ
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Lấy gallery
router.get('/gallery', async (req, res) => {
  try {
    const gallery = await Gallery.find();
    res.json(gallery);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Lấy categories
router.get('/categories', async (req, res) => {
  try {
    const cats = await Category.find();
    res.json(cats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;


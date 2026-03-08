const express = require('express');
const Category = require('../models/Category');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const cats = await Category.find();
    res.json(cats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.json(cat);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const cat = await Category.findByIdAndUpdate(id, req.body);
    if (!cat) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(cat);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;


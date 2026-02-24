const express = require('express');
const Category = require('../models/Category');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const cats = await Category.find().sort({ order: 1 }).lean();
    res.json(cats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const cat = new Category(req.body);
    await cat.save();
    res.json(cat);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const byId = /^[a-f0-9]{24}$/i.test(req.params.id);
    const filter = byId ? { _id: req.params.id } : { id: req.params.id };
    const cat = await Category.findOneAndUpdate(filter, req.body, { new: true });
    if (!cat) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(cat);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const byId = /^[a-f0-9]{24}$/i.test(req.params.id);
    const filter = byId ? { _id: req.params.id } : { id: req.params.id };
    const cat = await Category.findOneAndDelete(filter);
    if (!cat) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

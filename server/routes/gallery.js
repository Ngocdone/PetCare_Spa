const express = require('express');
const Gallery = require('../models/Gallery');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const list = await Gallery.find();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const item = await Gallery.create(req.body);
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const item = await Gallery.findByIdAndUpdate(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;


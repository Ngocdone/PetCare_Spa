const express = require('express');
const Gallery = require('../models/Gallery');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const list = await Gallery.find().lean();
    res.json(list.map(g => ({ ...g, id: g._id?.toString?.() || g.id })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const item = new Gallery(req.body);
    await item.save();
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const item = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

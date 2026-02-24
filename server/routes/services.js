const express = require('express');
const Service = require('../models/Service');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const list = await Service.find().lean();
    res.json(list.map(s => ({ ...s, id: s._id?.toString?.() || s.id })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.json(service);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const s = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!s) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const s = await Service.findByIdAndDelete(req.params.id);
    if (!s) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

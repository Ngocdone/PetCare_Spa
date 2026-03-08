const express = require('express');
const Service = require('../models/Service');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const list = await Service.find();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.json(service);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body);
    if (!service) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(service);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;


const express = require('express');
const Service = require('../models/Service');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
<<<<<<< HEAD
    const list = await Service.find();
    res.json(list);
=======
    const list = await Service.find().lean();
    res.json(list.map(s => ({ ...s, id: s._id?.toString?.() || s.id })));
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const service = await Service.create(req.body);
=======
    const service = new Service(req.body);
    await service.save();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    res.json(service);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const service = await Service.findByIdAndUpdate(req.params.id, req.body);
    if (!service) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(service);
=======
    const s = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!s) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(s);
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    await Service.findByIdAndDelete(req.params.id);
=======
    const s = await Service.findByIdAndDelete(req.params.id);
    if (!s) return res.status(404).json({ error: 'Không tìm thấy' });
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

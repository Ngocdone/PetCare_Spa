const express = require('express');
const Gallery = require('../models/Gallery');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
<<<<<<< HEAD
    const list = await Gallery.find();
    res.json(list);
=======
    const list = await Gallery.find().lean();
    res.json(list.map(g => ({ ...g, id: g._id?.toString?.() || g.id })));
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const item = await Gallery.create(req.body);
=======
    const item = new Gallery(req.body);
    await item.save();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const item = await Gallery.findByIdAndUpdate(req.params.id, req.body);
=======
    const item = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    await Gallery.findByIdAndDelete(req.params.id);
=======
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
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

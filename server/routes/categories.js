const express = require('express');
const Category = require('../models/Category');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
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

router.post('/', adminAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const cat = await Category.create(req.body);
=======
    const cat = new Category(req.body);
    await cat.save();
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    res.json(cat);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const id = req.params.id;
    const cat = await Category.findByIdAndUpdate(id, req.body);
=======
    const byId = /^[a-f0-9]{24}$/i.test(req.params.id);
    const filter = byId ? { _id: req.params.id } : { id: req.params.id };
    const cat = await Category.findOneAndUpdate(filter, req.body, { new: true });
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
    if (!cat) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(cat);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    await Category.findByIdAndDelete(req.params.id);
=======
    const byId = /^[a-f0-9]{24}$/i.test(req.params.id);
    const filter = byId ? { _id: req.params.id } : { id: req.params.id };
    const cat = await Category.findOneAndDelete(filter);
    if (!cat) return res.status(404).json({ error: 'Không tìm thấy' });
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

const express = require('express');
const Pet = require('../models/Pet');
const { adminAuth, auth } = require('../middleware/auth');

const router = express.Router();

// Get pets of current user
router.get('/my', auth, async (req, res) => {
  try {
    const pets = await Pet.findByUserId(req.user.id);
    res.json(pets);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all pets (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const pets = await Pet.findAll();
    res.json(pets);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get pet by ID
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(pet);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create new pet (for current user)
router.post('/', auth, async (req, res) => {
  try {
    const petData = {
      user_id: req.user.id,
      ...req.body
    };
    const pet = await Pet.create(petData);
    res.json(pet);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update pet
router.put('/:id', auth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Không tìm thấy' });
    
    // Check ownership
    if (pet.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền' });
    }
    
    const updated = await Pet.update(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete pet
router.delete('/:id', auth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Không tìm thấy' });
    
    // Check ownership
    if (pet.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền' });
    }
    
    await Pet.delete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

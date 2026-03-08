const express = require('express');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', adminAuth, async (req, res) => {
  try {
    const users = await User.find();
    // Remove password from response
    const usersWithoutPassword = users.map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    res.json(usersWithoutPassword);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { tier, role } = req.body;
    const update = {};
    if (tier) update.tier = tier;
    if (role) update.role = role;
    const user = await User.findByIdAndUpdate(req.params.id, update);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;


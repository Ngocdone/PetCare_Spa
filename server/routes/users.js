const express = require('express');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', adminAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const users = await User.find();
    // Remove password from response
    const usersWithoutPassword = users.map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    res.json(usersWithoutPassword);
=======
    const users = await User.find().select('-password').lean();
    res.json(users);
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
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
<<<<<<< HEAD
    const user = await User.findByIdAndUpdate(req.params.id, update);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
=======
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(user);
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
<<<<<<< HEAD

=======
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

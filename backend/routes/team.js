/**
 * REST /api/team: danh sách đội ngũ (doi_ngu) — chỉ GET.
 */
const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, ten AS name, chuc_vu AS role, kinh_nghiem AS experience, anh AS image
       FROM doi_ngu
       ORDER BY thu_tu ASC, id ASC`
    );
    res.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        experience: row.experience || '',
        image: row.image || '',
      }))
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

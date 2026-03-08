<<<<<<< HEAD
const { pool } = require('../config/db');

const Newsletter = {
  async find() {
    const [rows] = await pool.query('SELECT * FROM newsletter ORDER BY created_at DESC');
    return rows;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM newsletter WHERE email = ?', [email.toLowerCase()]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO newsletter (email) VALUES (?)`,
      [data.email.toLowerCase()]
    );
    return { id: result.insertId, email: data.email.toLowerCase() };
  }
};

module.exports = Newsletter;

=======
const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true }
}, { timestamps: true });

module.exports = mongoose.model('Newsletter', newsletterSchema);
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

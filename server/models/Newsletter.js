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


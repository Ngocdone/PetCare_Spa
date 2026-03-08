const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const User = {
  async find() {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    return rows[0] || null;
  },

  async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, phone, password, role, tier, address) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.email.toLowerCase(), data.phone || '', hashedPassword, data.role || 'user', data.tier || 'bronze', data.address || '']
    );
    return this.findById(result.insertId);
  },

  async findByIdAndUpdate(id, data) {
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
    if (data.tier !== undefined) { fields.push('tier = ?'); values.push(data.tier); }
    if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
    if (data.password !== undefined) {
      fields.push('password = ?');
      values.push(await bcrypt.hash(data.password, 10));
    }
    
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findById(id);
  },

  async comparePassword(candidate, hashed) {
    return bcrypt.compare(candidate, hashed);
  }
};

module.exports = User;


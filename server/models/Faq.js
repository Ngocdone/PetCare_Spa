<<<<<<< HEAD
const { pool } = require('../config/db');

const Faq = {
  async find() {
    const [rows] = await pool.query('SELECT * FROM faqs ORDER BY faq_order ASC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM faqs WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO faqs (q, a, faq_order) VALUES (?, ?, ?)`,
      [data.q, data.a, data.order || 0]
    );
    return this.findById(result.insertId);
  },

  async findByIdAndUpdate(id, data) {
    const fields = [];
    const values = [];
    if (data.q !== undefined) { fields.push('q = ?'); values.push(data.q); }
    if (data.a !== undefined) { fields.push('a = ?'); values.push(data.a); }
    if (data.order !== undefined) { fields.push('faq_order = ?'); values.push(data.order); }
    
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE faqs SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    await pool.query('DELETE FROM faqs WHERE id = ?', [id]);
    return { success: true };
  }
};

module.exports = Faq;

=======
const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  q: { type: String, required: true },
  a: { type: String, required: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Faq', faqSchema);
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

<<<<<<< HEAD
const { pool } = require('../config/db');

const Gallery = {
  async find() {
    const [rows] = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM gallery WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO gallery (src, title, category) VALUES (?, ?, ?)`,
      [data.src, data.title || '', data.category || 'gallery']
    );
    return this.findById(result.insertId);
  },

  async findByIdAndUpdate(id, data) {
    const fields = [];
    const values = [];
    if (data.src !== undefined) { fields.push('src = ?'); values.push(data.src); }
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE gallery SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    await pool.query('DELETE FROM gallery WHERE id = ?', [id]);
    return { success: true };
  }
};

module.exports = Gallery;

=======
const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  src: { type: String, required: true },
  title: { type: String, default: '' },
  category: { type: String, default: 'gallery' }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

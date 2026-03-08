<<<<<<< HEAD
const { pool } = require('../config/db');

const Testimonial = {
  async find() {
    const [rows] = await pool.query('SELECT * FROM testimonials ORDER BY testimonial_order ASC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM testimonials WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO testimonials (author, pet, pet_image, text, rating, testimonial_order) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.author, data.pet || '', data.petImage || '', data.text, data.rating || 5, data.order || 0]
    );
    return this.findById(result.insertId);
  },

  async findByIdAndUpdate(id, data) {
    const fields = [];
    const values = [];
    if (data.author !== undefined) { fields.push('author = ?'); values.push(data.author); }
    if (data.pet !== undefined) { fields.push('pet = ?'); values.push(data.pet); }
    if (data.petImage !== undefined) { fields.push('pet_image = ?'); values.push(data.petImage); }
    if (data.text !== undefined) { fields.push('text = ?'); values.push(data.text); }
    if (data.rating !== undefined) { fields.push('rating = ?'); values.push(data.rating); }
    if (data.order !== undefined) { fields.push('testimonial_order = ?'); values.push(data.order); }
    
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE testimonials SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    await pool.query('DELETE FROM testimonials WHERE id = ?', [id]);
    return { success: true };
  }
};

module.exports = Testimonial;

=======
const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  author: { type: String, required: true },
  pet: { type: String, default: '' },
  petImage: { type: String, default: '' },
  text: { type: String, required: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

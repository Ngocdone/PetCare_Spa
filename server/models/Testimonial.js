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


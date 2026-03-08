const { pool } = require('../config/db');

const Category = {
  async find() {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY category_order ASC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO categories (id, name, slug, category_order) VALUES (?, ?, ?, ?)`,
      [data.id, data.name, data.slug || '', data.order || 0]
    );
    return this.findById(result.insertId);
  },

  async findByIdAndUpdate(id, data) {
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
    if (data.order !== undefined) { fields.push('category_order = ?'); values.push(data.order); }
    
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return { success: true };
  }
};

module.exports = Category;


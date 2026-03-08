const { pool } = require('../config/db');

const Brand = {
  async find() {
    const [rows] = await pool.query('SELECT * FROM brands ORDER BY brand_order ASC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM brands WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO brands (name, brand_order) VALUES (?, ?)`,
      [data.name, data.order || 0]
    );
    return this.findById(result.insertId);
  },

  async findByIdAndUpdate(id, data) {
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.order !== undefined) { fields.push('brand_order = ?'); values.push(data.order); }
    
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE brands SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    await pool.query('DELETE FROM brands WHERE id = ?', [id]);
    return { success: true };
  }
};

module.exports = Brand;


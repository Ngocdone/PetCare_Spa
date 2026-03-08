const { pool } = require('../config/db');

const Service = {
  async find() {
    const [rows] = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findBySlug(slug) {
    const [rows] = await pool.query('SELECT * FROM services WHERE slug = ?', [slug]);
    return rows[0] || null;
  },

  async create(data) {
    const slug = data.slug || (data.name ? data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'service-' + Date.now());
    const [result] = await pool.query(
      `INSERT INTO services (name, slug, description, price_dog, price_cat, duration, unit, image, featured, category, pet_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, slug, data.description || '', data.priceDog, data.priceCat, data.duration || 60, data.unit || 'phút', data.image || '', data.featured || true, data.category || 'grooming', data.petType || 'both']
    );
    return this.findById(result.insertId);
  },

  async findByIdAndUpdate(id, data) {
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.priceDog !== undefined) { fields.push('price_dog = ?'); values.push(data.priceDog); }
    if (data.priceCat !== undefined) { fields.push('price_cat = ?'); values.push(data.priceCat); }
    if (data.duration !== undefined) { fields.push('duration = ?'); values.push(data.duration); }
    if (data.unit !== undefined) { fields.push('unit = ?'); values.push(data.unit); }
    if (data.image !== undefined) { fields.push('image = ?'); values.push(data.image); }
    if (data.featured !== undefined) { fields.push('featured = ?'); values.push(data.featured); }
    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    if (data.petType !== undefined) { fields.push('pet_type = ?'); values.push(data.petType); }
    
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    await pool.query('DELETE FROM services WHERE id = ?', [id]);
    return { success: true };
  }
};

module.exports = Service;


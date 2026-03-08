<<<<<<< HEAD
const { pool } = require('../config/db');

const Product = {
  async find() {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findBySlug(slug) {
    const [rows] = await pool.query('SELECT * FROM products WHERE slug = ?', [slug]);
    return rows[0] || null;
  },

  async create(data) {
    const slug = data.slug || (data.name ? data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'product-' + Date.now());
    const [result] = await pool.query(
      `INSERT INTO products (name, slug, price, old_price, category, pet_type, image, rating, best_seller, description, stock) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, slug, data.price, data.oldPrice || null, data.category || 'cham-soc', data.petType || 'both', data.image || '', data.rating || 4.5, data.bestSeller || false, data.description || '', data.stock || 0]
    );
    return this.findById(result.insertId);
  },

  async findByIdAndUpdate(id, data) {
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
    if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
    if (data.oldPrice !== undefined) { fields.push('old_price = ?'); values.push(data.oldPrice); }
    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    if (data.petType !== undefined) { fields.push('pet_type = ?'); values.push(data.petType); }
    if (data.image !== undefined) { fields.push('image = ?'); values.push(data.image); }
    if (data.rating !== undefined) { fields.push('rating = ?'); values.push(data.rating); }
    if (data.bestSeller !== undefined) { fields.push('best_seller = ?'); values.push(data.bestSeller); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.stock !== undefined) { fields.push('stock = ?'); values.push(data.stock); }
    
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return { success: true };
  }
};

module.exports = Product;

=======
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  price: { type: Number, required: true },
  oldPrice: { type: Number },
  category: { type: String, default: 'cham-soc' },
  petType: { type: String, enum: ['cho', 'meo', 'both'], default: 'both' },
  image: { type: String, default: '' },
  rating: { type: Number, default: 4.5 },
  bestSeller: { type: Boolean, default: false },
  description: { type: String, default: '' },
  stock: { type: Number }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('id').get(function () { return this._id?.toString?.() || this._id; });

productSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'product-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

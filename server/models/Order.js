const { pool } = require('../config/db');

const Order = {
  async find() {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByOrderId(orderId) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    return rows[0] || null;
  },

  async findByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO orders (order_id, items, total, subtotal, tier_amount, tier, promo_code, promo_amount, name, phone, email, address, payment, carrier, carrier_phone, status, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id, 
        JSON.stringify(data.items || []), 
        data.total, 
        data.subtotal, 
        data.discount?.tierAmount || 0, 
        data.discount?.tier || '', 
        data.discount?.promoCode || '', 
        data.discount?.promoAmount || 0,
        data.name, 
        data.phone, 
        data.email, 
        data.address, 
        data.payment || 'cod', 
        data.carrier || 'PetCare Express', 
        data.carrierPhone || '1900 1234', 
        data.status || 'pending', 
        data.userId || null
      ]
    );
    return this.findById(result.insertId);
  },

  async findByIdAndUpdate(id, data) {
    const fields = [];
    const values = [];
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.items !== undefined) { fields.push('items = ?'); values.push(JSON.stringify(data.items)); }
    if (data.total !== undefined) { fields.push('total = ?'); values.push(data.total); }
    if (data.subtotal !== undefined) { fields.push('subtotal = ?'); values.push(data.subtotal); }
    
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    await pool.query('DELETE FROM orders WHERE id = ?', [id]);
    return { success: true };
  }
};

module.exports = Order;


const { pool } = require('../config/db');

const Booking = {
  async find() {
    const [rows] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO bookings (service_id, service_name, service_price, pet_type, pet_weight, pet_name, booking_date, booking_time, owner_name, owner_phone, owner_email, owner_address, note, status, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.serviceId, data.serviceName, data.servicePrice, data.petType, data.petWeight, data.petName, data.date, data.time, data.ownerName, data.ownerPhone, data.ownerEmail, data.ownerAddress, data.note || '', data.status || 'pending', data.userId || null]
    );
    return this.findById(result.insertId);
  },

  async findByIdAndUpdate(id, data) {
    const fields = [];
    const values = [];
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.note !== undefined) { fields.push('note = ?'); values.push(data.note); }
    
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
    return { success: true };
  }
};

module.exports = Booking;


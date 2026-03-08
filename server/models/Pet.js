const { pool } = require('../config/db');

class Pet {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM pets ORDER BY created_at DESC');
    return rows;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM pets WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { user_id, name, type, breed, age, weight, image, notes } = data;
    const [result] = await pool.query(
      'INSERT INTO pets (user_id, name, type, breed, age, weight, image, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, name, type || 'cho', breed || '', age || 0, weight || 0, image || '', notes || '']
    );
    return { id: result.insertId, ...data };
  }

  static async update(id, data) {
    const { name, type, breed, age, weight, image, notes } = data;
    await pool.query(
      'UPDATE pets SET name = ?, type = ?, breed = ?, age = ?, weight = ?, image = ?, notes = ? WHERE id = ?',
      [name, type, breed, age, weight, image, notes, id]
    );
    return Pet.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM pets WHERE id = ?', [id]);
    return { success: true };
  }
}

module.exports = Pet;

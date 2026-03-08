const { pool } = require('../config/db');

const Team = {
  async find() {
    const [rows] = await pool.query('SELECT * FROM team ORDER BY team_order ASC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM team WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO team (name, role, experience, image, team_order) VALUES (?, ?, ?, ?, ?)`,
      [data.name, data.role, data.experience || '', data.image || '', data.order || 0]
    );
    return this.findById(result.insertId);
  },

  async findByIdAndUpdate(id, data) {
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
    if (data.experience !== undefined) { fields.push('experience = ?'); values.push(data.experience); }
    if (data.image !== undefined) { fields.push('image = ?'); values.push(data.image); }
    if (data.order !== undefined) { fields.push('team_order = ?'); values.push(data.order); }
    
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE team SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    await pool.query('DELETE FROM team WHERE id = ?', [id]);
    return { success: true };
  }
};

module.exports = Team;


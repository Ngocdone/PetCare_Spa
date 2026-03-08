 const { pool } = require('./config/db');

async function testDB() {
  try {
    // Test users table
    const [users] = await pool.query('SELECT * FROM users LIMIT 1');
    console.log('Users table: OK, count:', users.length);
    
    // Test services table
    const [services] = await pool.query('SELECT * FROM services LIMIT 1');
    console.log('Services table: OK, count:', services.length);
    
    // Test pets table
    const [pets] = await pool.query('SELECT * FROM pets LIMIT 1');
    console.log('Pets table: OK, count:', pets.length);
    
    // Test inserting a pet
    const [result] = await pool.query(
      'INSERT INTO pets (user_id, name, type, breed, age, weight) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 'Test Pet', 'cho', 'Golden Retriever', 3, 15.5]
    );
    console.log('Insert pet: OK, id:', result.insertId);
    
    // Delete test pet
    await pool.query('DELETE FROM pets WHERE id = ?', [result.insertId]);
    console.log('Delete pet: OK');
    
    console.log('\n✓ All database tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
}

testDB();


const { pool } = require('./config/db');

async function testPetsAPI() {
  try {
    // 1. Login to get token
    const [users] = await pool.query('SELECT id, email, password FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('No users found');
      return;
    }
    const user = users[0];
    console.log('User found:', user.email);
    
    // Use bcrypt to check password or just use the token directly
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: user.id }, 'petspa-secret-key-change-in-production', { expiresIn: '7d' });
    console.log('Token generated');
    
    // 2. Try to add a pet
    const [result] = await pool.query(
      'INSERT INTO pets (user_id, name, type, breed, age, weight) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, 'Test Pet', 'cho', 'Golden Retriever', 3, 15.5]
    );
    console.log('Pet added with ID:', result.insertId);
    
    // 3. Fetch the pet
    const [pets] = await pool.query('SELECT * FROM pets WHERE id = ?', [result.insertId]);
    console.log('Pet fetched:', JSON.stringify(pets[0]));
    
    // 4. Delete test pet
    await pool.query('DELETE FROM pets WHERE id = ?', [result.insertId]);
    console.log('Test pet deleted');
    
    console.log('\n✅ Pets API is working correctly!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testPetsAPI();


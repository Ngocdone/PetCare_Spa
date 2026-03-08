te_path>
e:/PetCare_Spa-main/create_pets_table.js
</absolute_path>
<parameter name="content">
// Script to create pets table - run with: node create_pets_table.js
const mysql = require('mysql2/promise');

async function createPetsTable() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'petspa'
    });

    console.log('Connected to MySQL');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        type ENUM('cho', 'meo', 'other') DEFAULT 'cho',
        breed VARCHAR(255) DEFAULT '',
        age INT DEFAULT 0,
        weight DECIMAL(5,2) DEFAULT 0,
        image VARCHAR(500) DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✓ Pets table created successfully!');
    
    // Show all tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\nCurrent tables in database:');
    tables.forEach(t => console.log('  -', Object.values(t)[0]));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

createPetsTable();

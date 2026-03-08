te_path>
e:/PetCare_Spa-main/create_pets.js
</absolute_path>
<parameter name="content">
const mysql = require('mysql2/promise');

async function createPetsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'petspa'
  });

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

  console.log('Bảng pets đã được tạo!');
  await connection.end();
}

createPetsTable().catch(console.error);

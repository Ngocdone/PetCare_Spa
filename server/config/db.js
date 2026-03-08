const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'petspa', // Explicitly use petspa database
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connected successfully!');
    
    // Create pets table if not exists
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
    console.log('Pets table ready!');
    
    connection.release();
  } catch (error) {
    console.error('MySQL connection error:', error.message);
    console.log('⚠️  Server will continue without database connection');
    console.log('  Please ensure MySQL is running and the database is configured correctly.');
    // Don't exit - let server continue running for static file serving
    // process.exit(1);
  }
};

module.exports = { pool, connectDB };

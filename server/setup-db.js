const mysql = require('mysql2/promise');

async function setupDatabase() {
  // First connect without database to create it
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });

  try {
    // Create database if not exists
    await connection.query('CREATE DATABASE IF NOT EXISTS petspa');
    console.log('Database petspa created or already exists');
    
    // Use the database
    await connection.query('USE petspa');
    
    // Read and execute SQL file
    const fs = require('fs');
    const sql = fs.readFileSync('../database.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
        } catch (e) {
          // Ignore errors for DROP TABLE IF EXISTS
          if (!statement.includes('DROP TABLE')) {
            console.error('Error:', e.message);
          }
        }
      }
    }
    
    console.log('All tables created successfully!');
    
  } catch (error) {
    console.error('Setup error:', error.message);
  } finally {
    await connection.end();
  }
}

setupDatabase();


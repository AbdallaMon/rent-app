// Script to run SQL file against MySQL database
const fs = require('fs');
const { createConnection } = require('mysql2/promise');
require('dotenv').config();

async function executeSQL(filePath) {
  // Read SQL file
  const sqlContent = fs.readFileSync(filePath, 'utf8');
  
  // Database connection info from environment variables
  const connection = await createConnection({
    host: process.env.DB_HOST || '192.185.46.254',
    user: process.env.DB_USER || 'kevxncte_suhail',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'kevxncte_rent_db',
    multipleStatements: true // Important for running multiple SQL statements
  });
  
  console.log('Connected to the database');
  
  try {
    console.log('Executing SQL script...');
    await connection.query(sqlContent);
    console.log('SQL script executed successfully');
  } catch (error) {
    console.error('Error executing SQL script:', error);
  } finally {
    await connection.end();
    console.log('Database connection closed');
  }
}

// Execute the SQL file
const filePath = process.argv[2] || './create_request_tables.sql';
executeSQL(filePath);

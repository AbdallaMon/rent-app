// Script to add the missing lastAction field to the Client table
const { createConnection } = require('mysql2/promise');
require('dotenv').config();

async function addLastActionFieldToClient() {
  console.log('Starting database update process...');
  
  // Get database connection details from environment variables
  const connectionString = process.env.DATABASE_URL;
  
  // Parse the connection string to get individual components
  // Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
  const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = connectionString.match(regex);
  
  if (!match) {
    console.error('Invalid DATABASE_URL format. Expected format: mysql://USER:PASSWORD@HOST:PORT/DATABASE');
    return;
  }
  
  const [, user, password, host, port, database] = match;
  
  // Create a database connection
  let connection;
  try {
    console.log(`Connecting to database ${database} at ${host}:${port}...`);
    connection = await createConnection({
      host,
      port: parseInt(port, 10),
      user,
      password,
      database
    });
    console.log('Connected to database!');
    
    // Step 1: Check if the lastAction column already exists
    console.log('Checking if lastAction column exists...');
    const [columns] = await connection.execute(
      'SHOW COLUMNS FROM `Client` LIKE "lastAction"'
    );
    
    // Step 2: If the column doesn't exist, add it
    if (columns.length === 0) {
      console.log('lastAction column does not exist. Adding it now...');
      
      // The lastAction field is an enum in the Prisma schema, so we need to create it as an enum in the database too
      await connection.execute(`
        ALTER TABLE \`Client\` 
        ADD COLUMN \`lastAction\` ENUM(
          'COMPLAINT_SUBMISSION',
          'MAINTENANCE_REQUEST',
          'PAYMENT_SUBMITTED',
          'RENT_AGREEMENT_SIGNED',
          'PROFILE_UPDATE'
        ) NULL
      `);
      console.log('lastAction column added successfully!');
    } else {
      console.log('lastAction column already exists.');
    }
    
    // Step 3: Get the updated Client table structure
    console.log('Getting updated Client table structure...');
    const [updatedColumns] = await connection.execute('DESCRIBE Client');
    
    console.log('\nUpdated Client Table Structure:');
    console.table(updatedColumns);
    
    console.log('Database update completed successfully!');
    
  } catch (error) {
    console.error('Error during database update:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the update function
addLastActionFieldToClient();

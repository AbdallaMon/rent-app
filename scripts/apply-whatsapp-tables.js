// Script to apply or verify WhatsApp tables SQL
const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyWhatsAppTables() {
  console.log('Starting WhatsApp tables verification...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./whatsapp_tables.sql', 'utf8');
    
    // Parse the database URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('DATABASE_URL not found in .env file');
      process.exit(1);
    }
    
    // Parse the connection string
    // Example: mysql://user:password@host:port/database
    const matches = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
    if (!matches) {
      console.error('Invalid DATABASE_URL format');
      process.exit(1);
    }
    
    const [, user, password, host, port, database] = matches;
    
    // Create connection
    console.log(`Connecting to database ${database} on ${host}...`);
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port: parseInt(port, 10),
      multipleStatements: true // Important for running multiple SQL statements
    });
    
    console.log('Connected! Checking WhatsApp tables...');
    
    // Check if tables exist
    const [tables] = await connection.query(`
      SELECT TABLE_NAME FROM information_schema.tables 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'Whatsapp%'
    `, [database]);
    
    if (tables.length >= 4) {
      console.log('WhatsApp tables already exist in the database:');
      tables.forEach(table => {
        console.log(`- ${table.TABLE_NAME}`);
      });
      
      // Verify if the tables have the right structure
      console.log('\nVerifying table structure...');
      
      // Get a list of fields in one of the tables as a basic check
      const [fields] = await connection.query(`
        SHOW COLUMNS FROM WhatsappConversation
      `);
      
      console.log(`WhatsappConversation table has ${fields.length} fields:`);
      console.log('Fields:', fields.map(f => f.Field).join(', '));
      
      console.log('\nVerified! WhatsApp tables are correctly set up and ready to use.');
    } else {
      console.log('Some WhatsApp tables are missing. Attempting to create them...');
      
      try {
        // Execute the SQL statements
        await connection.query(sqlContent);
        console.log('WhatsApp tables successfully created!');
      } catch (sqlError) {
        if (sqlError.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('Some tables already exist. This may be a partial installation.');
          console.log('Continuing with verification to make sure all tables are created...');
          
          // Check again after attempted creation
          const [tablesAfter] = await connection.query(`
            SELECT TABLE_NAME FROM information_schema.tables 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'Whatsapp%'
          `, [database]);
          
          console.log('WhatsApp tables in the database:');
          tablesAfter.forEach(table => {
            console.log(`- ${table.TABLE_NAME}`);
          });
          
          if (tablesAfter.length >= 4) {
            console.log('\nAll required WhatsApp tables are present. System should work correctly.');
          } else {
            console.error(`\nERROR: Only ${tablesAfter.length} WhatsApp tables found, but 4 are required.`);
            console.error('Some tables may be missing. Consider manually checking the database.');
          }
        } else {
          throw sqlError;
        }
      }
    }
    
    // Close the connection
    await connection.end();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Error during WhatsApp tables verification/creation:', error);
    process.exit(1);
  }
}

// Run the function
applyWhatsAppTables();

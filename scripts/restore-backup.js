const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function restoreFromBackup() {
  try {
    console.log('🔄 بدء استعادة البيانات من الملف الاحتياطي...\n');

    // Read the backup file
    const backupContent = fs.readFileSync('backup_data.sql', 'utf8');
    console.log(`📁 تم قراءة الملف الاحتياطي: ${(backupContent.length / 1024).toFixed(2)} KB`);

    // Create direct MySQL connection for running the SQL file
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '192.185.46.254',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'kevxncte_suhail',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'kevxncte_rent_db',
      multipleStatements: true
    });

    console.log('🔗 تم الاتصال بقاعدة البيانات');

    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('🔓 تم إيقاف فحص المفاتيح الأجنبية');

    // Split the SQL content into individual statements
    const statements = backupContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    console.log(`📊 عدد العبارات SQL: ${statements.length}`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip certain statements that might cause issues
      if (statement.includes('CREATE DATABASE') || 
          statement.includes('USE `') ||
          statement.includes('DROP DATABASE') ||
          statement.length < 10) {
        continue;
      }

      try {
        await connection.execute(statement);
        successCount++;
        
        // Show progress every 100 statements
        if (successCount % 100 === 0) {
          console.log(`⏳ تم تنفيذ ${successCount} عبارة من أصل ${statements.length}`);
        }
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) { // Show only first 5 errors
          console.log(`⚠️ خطأ في العبارة ${i + 1}: ${error.message.substring(0, 100)}...`);
        }
      }
    }

    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🔒 تم تفعيل فحص المفاتيح الأجنبية');

    await connection.end();
    console.log('🔌 تم قطع الاتصال');

    console.log('\n📊 نتائج الاستعادة:');
    console.log('=====================================');
    console.log(`✅ عبارات نجحت: ${successCount}`);
    console.log(`❌ عبارات فشلت: ${errorCount}`);
    console.log(`📈 معدل النجاح: ${((successCount / (successCount + errorCount)) * 100).toFixed(2)}%`);

    // Verify the restoration by checking some tables
    console.log('\n🔍 التحقق من استعادة البيانات...');
    
    const userCount = await prisma.user.count();
    const propertyCount = await prisma.property.count();
    const stateCount = await prisma.state.count();
    const unitCount = await prisma.unit.count();
    const rentAgreementCount = await prisma.rentAgreement.count();

    console.log('=====================================');
    console.log(`👥 المستخدمين: ${userCount}`);
    console.log(`🏢 العقارات: ${propertyCount}`);
    console.log(`🌍 الولايات: ${stateCount}`);
    console.log(`🏠 الوحدات: ${unitCount}`);
    console.log(`📋 عقود الإيجار: ${rentAgreementCount}`);

    if (userCount > 0 && stateCount > 0) {
      console.log('\n🎉 تم استعادة البيانات بنجاح!');
    } else {
      console.log('\n⚠️ تحذير: قد تكون هناك مشكلة في استعادة البيانات');
    }

  } catch (error) {
    console.error('❌ خطأ في استعادة البيانات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreFromBackup();

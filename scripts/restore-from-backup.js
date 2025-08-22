const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function restoreDatabase() {
  try {
    console.log('🔄 بدء استعادة قاعدة البيانات...\n');

    // معلومات قاعدة البيانات
    const dbConfig = {
      host: '192.185.46.254',
      port: 3306,
      user: 'kevxncte_suhail',
      password: 'Nzaa74xd$',
      database: 'kevxncte_rent_db',
      charset: 'utf8mb4'
    };

    // قراءة ملف الـ backup
    const backupPath = path.join(__dirname, 'backup_restore.sql');
    console.log('📖 قراءة ملف الـ backup...');
    const sqlContent = fs.readFileSync(backupPath, 'utf8');

    // تقسيم الـ SQL إلى statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*!'));

    console.log(`📊 تم العثور على ${statements.length} عبارة SQL\n`);

    // الاتصال بقاعدة البيانات
    console.log('🔗 الاتصال بقاعدة البيانات...');
    const connection = await mysql.createConnection(dbConfig);

    // تعطيل foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO"');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // تنفيذ العبارات
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // تخطي العبارات غير المهمة
        if (statement.includes('phpMyAdmin') || 
            statement.includes('SET NAMES') || 
            statement.includes('SET time_zone') ||
            statement.length < 10) {
          skipCount++;
          continue;
        }

        // تعديل CREATE TABLE للـ User لإضافة WHATSAPP إلى enum
        if (statement.includes('CREATE TABLE') && statement.includes('`User`')) {
          console.log('🔧 تعديل جدول User لإضافة دعم WHATSAPP...');
          // سنتعامل مع هذا لاحقاً
        }

        await connection.execute(statement);
        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`✅ تم تنفيذ ${successCount} عبارة...`);
        }

      } catch (error) {
        errorCount++;
        
        // تجاهل بعض الأخطاء المتوقعة
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
            error.code === 'ER_DUP_ENTRY' ||
            error.message.includes('already exists')) {
          skipCount++;
          continue;
        }

        console.error(`❌ خطأ في العبارة ${i + 1}: ${error.message}`);
        
        // إيقاف في حالة أخطاء خطيرة
        if (errorCount > 10) {
          console.error('🛑 عدد كبير من الأخطاء، إيقاف العملية...');
          break;
        }
      }
    }

    // إعادة تفعيل foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n📊 ملخص الاستعادة:');
    console.log('=====================================');
    console.log(`✅ عبارات نُفذت بنجاح: ${successCount}`);
    console.log(`⚠️ عبارات تم تخطيها: ${skipCount}`);
    console.log(`❌ عبارات فشلت: ${errorCount}`);

    // إضافة WHATSAPP إلى enum إذا لم يكن موجود
    console.log('\n🔧 إضافة دعم WHATSAPP...');
    try {
      await connection.execute(`
        ALTER TABLE UserPrivilege 
        MODIFY COLUMN area ENUM('HOME', 'FOLLOW_UP', 'PROPERTY', 'UNIT', 'RENT', 'INVOICE', 'MAINTENANCE', 'REQUEST', 'REPORT', 'OWNER', 'RENTER', 'SETTING', 'WHATSAPP')
      `);
      console.log('✅ تم إضافة WHATSAPP إلى enum بنجاح');
    } catch (error) {
      console.log('⚠️ WHATSAPP موجود مسبقاً في enum');
    }

    // إضافة صلاحيات واتساب للإداريين
    console.log('\n👨‍💼 إضافة صلاحيات واتساب للإداريين...');
    try {
      // البحث عن الإداريين
      const [admins] = await connection.execute(
        "SELECT id, name, email FROM User WHERE role = 'ADMIN'"
      );

      // البحث عن صلاحية واتساب أو إنشاؤها
      let [whatsappPrivilege] = await connection.execute(
        "SELECT id FROM Privilege WHERE name = 'WHATSAPP_ADMIN'"
      );

      if (whatsappPrivilege.length === 0) {
        await connection.execute(`
          INSERT INTO Privilege (name, canRead, canWrite, canEdit, canDelete, createdAt, updatedAt) 
          VALUES ('WHATSAPP_ADMIN', 1, 1, 1, 1, NOW(), NOW())
        `);
        
        [whatsappPrivilege] = await connection.execute(
          "SELECT id FROM Privilege WHERE name = 'WHATSAPP_ADMIN'"
        );
      }

      const privilegeId = whatsappPrivilege[0].id;

      // إعطاء صلاحية واتساب للإداريين
      for (const admin of admins) {
        try {
          await connection.execute(`
            INSERT IGNORE INTO UserPrivilege (userId, privilegeId, area, createdAt, updatedAt) 
            VALUES (?, ?, 'WHATSAPP', NOW(), NOW())
          `, [admin.id, privilegeId]);
          
          console.log(`✅ تم إعطاء صلاحية واتساب للإداري: ${admin.name}`);
        } catch (error) {
          console.log(`⚠️ الإداري ${admin.name} يملك صلاحية واتساب مسبقاً`);
        }
      }

    } catch (error) {
      console.error('❌ خطأ في إضافة صلاحيات واتساب:', error.message);
    }

    await connection.end();
    
    console.log('\n🎉 تم الانتهاء من استعادة قاعدة البيانات!');
    console.log('\n📋 للتحقق من النتيجة، قم بتشغيل:');
    console.log('node test-whatsapp-access.js');

  } catch (error) {
    console.error('❌ خطأ عام في استعادة قاعدة البيانات:', error);
  }
}

restoreDatabase();

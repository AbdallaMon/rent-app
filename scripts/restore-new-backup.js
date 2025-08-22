const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

// استخراج إعدادات قاعدة البيانات من DATABASE_URL
function parseDatabaseUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('تعذر تحليل DATABASE_URL');
  }
  
  return {
    host: match[3],
    user: match[1],
    password: match[2],
    port: parseInt(match[4]),
    database: match[5],
    multipleStatements: true,
    charset: 'utf8mb4',
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000
  };
}

// تكوين الاتصال بقاعدة البيانات
const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);

async function restoreDatabase() {
  let connection;
  
  try {
    console.log('📂 قراءة ملف النسخة الاحتياطية...');
    
    // قراءة ملف SQL
    const sqlFile = 'c:\\Users\\Suhail\\Downloads\\rent_db (1).sql';
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`ملف النسخة الاحتياطية غير موجود: ${sqlFile}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    console.log(`📄 تم قراءة الملف بنجاح (${(sqlContent.length / 1024 / 1024).toFixed(2)} MB)`);
    
    // إنشاء الاتصال
    console.log('🔌 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(dbConfig);
    
    // تعطيل فحص المفاتيح الخارجية
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.execute('SET UNIQUE_CHECKS = 0;');
    await connection.execute('SET AUTOCOMMIT = 0;');
    
    console.log('📥 بدء استعادة البيانات...');
    
    // تقسيم المحتوى إلى عبارات منفصلة
    const statements = sqlContent.split(';').filter(stmt => {
      const trimmed = stmt.trim();
      return trimmed && 
             !trimmed.startsWith('--') && 
             !trimmed.startsWith('/*') &&
             !trimmed.startsWith('SET') &&
             !trimmed.startsWith('START TRANSACTION') &&
             !trimmed.startsWith('COMMIT') &&
             !trimmed.includes('CHARACTER_SET_CLIENT') &&
             !trimmed.includes('COLLATION_CONNECTION');
    });
    
    console.log(`📊 عدد العبارات: ${statements.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    let currentTable = '';
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      
      if (!statement) continue;
      
      try {
        // تتبع الجدول الحالي
        if (statement.includes('DROP TABLE') || statement.includes('CREATE TABLE')) {
          const match = statement.match(/`([^`]+)`/);
          if (match) {
            currentTable = match[1];
            console.log(`🔄 معالجة جدول: ${currentTable}`);
          }
        }
        
        // تنفيذ العبارة
        await connection.execute(statement);
        successCount++;
        
        // طباعة التقدم كل 100 عبارة
        if ((i + 1) % 100 === 0) {
          console.log(`⏳ تم تنفيذ ${i + 1}/${statements.length} عبارة`);
        }
        
      } catch (error) {
        errorCount++;
        
        // تجاهل أخطاء معينة
        if (error.message.includes('Duplicate entry') || 
            error.message.includes('already exists') ||
            error.message.includes('Unknown table')) {
          continue;
        }
        
        console.warn(`⚠️ خطأ في عبارة ${i + 1} (${currentTable}): ${error.message.substring(0, 100)}`);
        
        // إيقاف في حالة وجود أخطاء كثيرة
        if (errorCount > 50) {
          console.error('❌ عدد كبير من الأخطاء، إيقاف العملية');
          break;
        }
      }
    }
    
    // إعادة تفعيل فحص المفاتيح
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1;');
    await connection.execute('SET UNIQUE_CHECKS = 1;');
    await connection.execute('COMMIT;');
    
    console.log(`✅ انتهت عملية الاستعادة:`);
    console.log(`   - عبارات نجحت: ${successCount}`);
    console.log(`   - عبارات فشلت: ${errorCount}`);
    
    // التحقق من البيانات المستعادة
    console.log('\n📊 التحقق من البيانات المستعادة:');
    
    const tablesToCheck = [
      'User', 'Property', 'RentAgreement', 'Payment', 
      'Privilege', 'Client', 'State', 'City'
    ];
    
    for (const table of tablesToCheck) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
        console.log(`  ${table}: ${rows[0].count} سجل`);
      } catch (error) {
        console.log(`  ${table}: خطأ أو جدول غير موجود`);
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في استعادة قاعدة البيانات:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الاستعادة
restoreDatabase().catch(console.error);

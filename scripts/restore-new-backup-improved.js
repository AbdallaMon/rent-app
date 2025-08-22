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
    connectTimeout: 60000
  };
}

async function restoreDatabaseImproved() {
  let connection;
  
  try {
    console.log('📂 قراءة ملف النسخة الاحتياطية...');
    
    const sqlFile = 'c:\\Users\\Suhail\\Downloads\\rent_db (1).sql';
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`ملف النسخة الاحتياطية غير موجود: ${sqlFile}`);
    }
    
    let sqlContent = fs.readFileSync(sqlFile, 'utf8');
    console.log(`📄 تم قراءة الملف بنجاح (${(sqlContent.length / 1024 / 1024).toFixed(2)} MB)`);
    
    // تنظيف المحتوى
    sqlContent = sqlContent
      .replace(/\/\*.*?\*\//gs, '') // إزالة التعليقات
      .replace(/^--.*$/gm, '') // إزالة أسطر التعليقات
      .replace(/^\s*$/gm, ''); // إزالة الأسطر الفارغة
    
    console.log('🔌 الاتصال بقاعدة البيانات...');
    const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
    connection = await mysql.createConnection(dbConfig);
    
    // تعطيل فحص المفاتيح الخارجية
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.execute('SET UNIQUE_CHECKS = 0;');
    await connection.execute('SET AUTOCOMMIT = 0;');
    
    console.log('📥 بدء استعادة البيانات...');
    
    // تقسيم أفضل للعبارات باستخدام regex محسن
    const statements = [];
    const lines = sqlContent.split('\n');
    let currentStatement = '';
    let insideMultiLineInsert = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // تجاهل الأسطر الفارغة والتعليقات
      if (!trimmedLine || trimmedLine.startsWith('--') || 
          trimmedLine.startsWith('SET') || trimmedLine.startsWith('START') ||
          trimmedLine.startsWith('COMMIT') || trimmedLine.includes('CHARACTER_SET')) {
        continue;
      }
      
      currentStatement += line + '\n';
      
      // التحقق من بداية INSERT متعدد الأسطر
      if (trimmedLine.includes('INSERT INTO') && trimmedLine.includes('VALUES')) {
        insideMultiLineInsert = true;
      }
      
      // التحقق من نهاية العبارة
      if (trimmedLine.endsWith(';')) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
        insideMultiLineInsert = false;
      }
    }
    
    console.log(`📊 عدد العبارات: ${statements.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    let currentTable = '';
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
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
        
        // طباعة التقدم كل 50 عبارة
        if ((i + 1) % 50 === 0) {
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
        
        console.warn(`⚠️ خطأ في عبارة ${i + 1} (${currentTable}): ${error.message.substring(0, 150)}`);
        
        // إيقاف في حالة وجود أخطاء كثيرة
        if (errorCount > 20) {
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
      'Privilege', 'Client', 'State', 'City', 'Unit'
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
restoreDatabaseImproved().catch(console.error);

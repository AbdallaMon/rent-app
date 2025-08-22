const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function advancedTableChecker() {
  console.log('🔍 فحص متقدم للجداول في قاعدة البيانات...\n');

  try {
    // 1. عرض قائمة جميع الجداول في قاعدة البيانات
    console.log('📊 قائمة جميع الجداول:');
    const tables = await prisma.$queryRaw`SHOW TABLES`;
    console.table(tables);

    console.log('\n='.repeat(80));

    // 2. معلومات مفصلة عن كل جدول مهم
    const importantTables = ['ReminderSettings', 'WhatsappMessageLog', 'Complaint', 'MaintenanceRequest', 'RentAgreement', 'Client', 'Unit', 'Property'];

    for (const tableName of importantTables) {
      try {        console.log(`\n📋 تحليل مفصل للجدول: ${tableName}`);
        
        // تركيب الجدول
        const structureQuery = `DESCRIBE \`${tableName}\``;
        const structure = await prisma.$queryRawUnsafe(structureQuery);
        console.log('📝 تركيب الجدول:');
        console.table(structure);
        
        // عدد الصفوف
        const countQuery = `SELECT COUNT(*) as count FROM \`${tableName}\``;
        const count = await prisma.$queryRawUnsafe(countQuery);
        console.log(`📊 عدد الصفوف: ${count[0].count}`);
        
        // أول 3 صفوف كمثال
        const sampleQuery = `SELECT * FROM \`${tableName}\` LIMIT 3`;
        const sample = await prisma.$queryRawUnsafe(sampleQuery);
        if (sample.length > 0) {
          console.log('🔍 عينة من البيانات (أول 3 صفوف):');
          console.table(sample);
        } else {
          console.log('📭 الجدول فارغ - لا توجد بيانات');
        }
        
        console.log('\n' + '-'.repeat(60));
        
      } catch (error) {
        console.error(`❌ خطأ في فحص الجدول ${tableName}:`, error.message);
      }
    }

    console.log('\n='.repeat(80));

    // 3. فحص العلاقات والمفاتيح الخارجية
    console.log('\n🔗 فحص المفاتيح الخارجية والعلاقات:');
    
    try {
      const foreignKeys = await prisma.$queryRaw`
        SELECT 
          TABLE_NAME,
          COLUMN_NAME,
          CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM 
          information_schema.KEY_COLUMN_USAGE 
        WHERE 
          REFERENCED_TABLE_NAME IS NOT NULL 
          AND TABLE_SCHEMA = DATABASE()
      `;
      
      if (foreignKeys.length > 0) {
        console.table(foreignKeys);
      } else {
        console.log('📭 لم يتم العثور على مفاتيح خارجية');
      }
    } catch (error) {
      console.error('❌ خطأ في فحص المفاتيح الخارجية:', error.message);
    }

    console.log('\n='.repeat(80));

    // 4. فحص الفهارس
    console.log('\n📚 فحص الفهارس (Indexes):');
    
    for (const tableName of ['ReminderSettings', 'WhatsappMessageLog', 'Complaint', 'MaintenanceRequest']) {      try {
        const indexQuery = `SHOW INDEX FROM \`${tableName}\``;
        const indexes = await prisma.$queryRawUnsafe(indexQuery);
        if (indexes.length > 0) {
          console.log(`📋 فهارس الجدول ${tableName}:`);
          console.table(indexes.map(idx => ({
            Table: idx.Table,
            Key_name: idx.Key_name,
            Column_name: idx.Column_name,
            Unique: idx.Non_unique === 0 ? 'YES' : 'NO'
          })));
        }
      } catch (error) {
        console.error(`❌ خطأ في فحص فهارس ${tableName}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ خطأ عام في الفحص:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل الفحص
advancedTableChecker().catch(console.error);

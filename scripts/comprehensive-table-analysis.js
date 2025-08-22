const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function comprehensiveTableAnalysis() {
  console.log('🔍 تحليل شامل للجداول - جميع الطرق المتاحة\n');
  console.log('='.repeat(80));

  try {
    // معلومات قاعدة البيانات
    console.log('🗄️  معلومات قاعدة البيانات:');
    const dbInfo = await prisma.$queryRaw`SELECT DATABASE() as db_name, VERSION() as version`;
    console.log(`   اسم قاعدة البيانات: ${dbInfo[0].db_name}`);
    console.log(`   إصدار MySQL: ${dbInfo[0].version}`);

    // جميع الجداول الموجودة
    console.log('\n📋 جميع الجداول في قاعدة البيانات:');
    const allTables = await prisma.$queryRaw`SHOW TABLES`;
    const tableNames = allTables.map(t => Object.values(t)[0]);
    console.log(`   عدد الجداول: ${tableNames.length}`);
    console.log(`   أسماء الجداول: ${tableNames.join(', ')}`);

  } catch (error) {
    console.error('❌ خطأ في جلب معلومات قاعدة البيانات:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 تحليل الجداول المطلوبة لنظام التذكيرات والشكاوى:');

  const targetTables = [
    'ReminderSettings',
    'WhatsappMessageLog', 
    'Complaint',
    'MaintenanceRequest',
    'RentAgreement',
    'Client',
    'Installment',
    'Payment'
  ];

  const analysisResults = [];

  for (const tableName of targetTables) {
    console.log(`\n${'*'.repeat(40)}`);
    console.log(`📊 تحليل الجدول: ${tableName}`);
    
    const result = {
      table: tableName,
      exists: false,
      columnCount: 0,
      recordCount: 0,
      hasData: false,
      columns: [],
      errors: []
    };

    try {
      // 1. فحص وجود الجدول
      const exists = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = ${tableName}
      `;
      
      result.exists = exists[0].count > 0;
      
      if (!result.exists) {
        console.log('❌ الجدول غير موجود');
        result.errors.push('جدول غير موجود');
        analysisResults.push(result);
        continue;
      }

      console.log('✅ الجدول موجود');      // 2. تركيب الجدول
      const structureQuery = `DESCRIBE \`${tableName}\``;
      const structure = await prisma.$queryRawUnsafe(structureQuery);
      result.columnCount = structure.length;
      result.columns = structure.map(col => ({
        name: col.Field,
        type: col.Type,
        nullable: col.Null === 'YES',
        key: col.Key,
        default: col.Default
      }));

      console.log(`📝 عدد الأعمدة: ${result.columnCount}`);
      console.log('📋 الأعمدة:');
      structure.forEach(col => {
        const nullable = col.Null === 'YES' ? '(اختياري)' : '(مطلوب)';
        const key = col.Key ? `[${col.Key}]` : '';
        const defaultVal = col.Default !== null ? `default: ${col.Default}` : '';
        console.log(`   - ${col.Field}: ${col.Type} ${nullable} ${key} ${defaultVal}`);
      });

      // 3. عدد السجلات
      const countQuery = `SELECT COUNT(*) as count FROM \`${tableName}\``;
      const count = await prisma.$queryRawUnsafe(countQuery);
      result.recordCount = count[0].count;
      result.hasData = result.recordCount > 0;

      console.log(`📊 عدد السجلات: ${result.recordCount}`);

      // 4. عينة من البيانات
      if (result.hasData) {
        console.log('🔍 عينة من البيانات (أول صفين):');
        const sampleQuery = `SELECT * FROM \`${tableName}\` LIMIT 2`;
        const sample = await prisma.$queryRawUnsafe(sampleQuery);
        
        sample.forEach((row, index) => {
          console.log(`\n   صف ${index + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            let displayValue = value;
            if (value === null) {
              displayValue = 'NULL';
            } else if (typeof value === 'string' && value.length > 30) {
              displayValue = value.substring(0, 30) + '...';
            } else if (value instanceof Date) {
              displayValue = value.toISOString().split('T')[0];
            }
            console.log(`     ${key}: ${displayValue}`);
          });
        });
      } else {
        console.log('📭 الجدول فارغ');
      }      // 5. فحص الفهارس
      try {
        const indexQuery = `SHOW INDEX FROM \`${tableName}\``;
        const indexes = await prisma.$queryRawUnsafe(indexQuery);
        if (indexes.length > 0) {
          console.log('\n📚 الفهارس:');
          const uniqueIndexes = [...new Set(indexes.map(idx => idx.Key_name))];
          uniqueIndexes.forEach(indexName => {
            const indexCols = indexes.filter(idx => idx.Key_name === indexName);
            const isUnique = indexCols[0].Non_unique === 0;
            const cols = indexCols.map(idx => idx.Column_name).join(', ');
            console.log(`   - ${indexName}: (${cols}) ${isUnique ? '[فريد]' : '[عادي]'}`);
          });
        }
      } catch (indexError) {
        console.log(`⚠️  لا يمكن جلب الفهارس: ${indexError.message}`);
      }

    } catch (error) {
      console.error(`❌ خطأ في تحليل الجدول ${tableName}:`, error.message);
      result.errors.push(error.message);
    }

    analysisResults.push(result);
  }

  // تلخيص النتائج
  console.log('\n' + '='.repeat(80));
  console.log('📊 ملخص التحليل الشامل:');

  const summaryTable = analysisResults.map(r => ({
    'الجدول': r.table,
    'موجود': r.exists ? '✅' : '❌',
    'عدد الأعمدة': r.columnCount || 0,
    'عدد السجلات': r.recordCount || 0,
    'يحتوي بيانات': r.hasData ? '✅' : '❌',
    'الحالة': r.errors.length > 0 ? '⚠️ ' + r.errors[0] : (r.exists ? 'سليم' : 'غير موجود')
  }));

  console.table(summaryTable);

  // إحصائيات نهائية
  const existingTables = analysisResults.filter(r => r.exists).length;
  const tablesWithData = analysisResults.filter(r => r.hasData).length;
  const totalRecords = analysisResults.reduce((sum, r) => sum + (r.recordCount || 0), 0);

  console.log('\n📈 الإحصائيات النهائية:');
  console.log(`🗃️  الجداول المطلوبة: ${targetTables.length}`);
  console.log(`✅ الجداول الموجودة: ${existingTables}/${targetTables.length}`);
  console.log(`📝 الجداول التي تحتوي بيانات: ${tablesWithData}/${existingTables}`);
  console.log(`📊 إجمالي السجلات: ${totalRecords}`);

  if (existingTables === targetTables.length) {
    console.log('🎉 جميع الجداول المطلوبة موجودة!');
  } else {
    const missingTables = analysisResults.filter(r => !r.exists).map(r => r.table);
    console.log(`⚠️  الجداول المفقودة: ${missingTables.join(', ')}`);
  }

  if (tablesWithData === existingTables) {
    console.log('🎉 جميع الجداول تحتوي على بيانات!');
  } else {
    const emptyTables = analysisResults.filter(r => r.exists && !r.hasData).map(r => r.table);
    console.log(`📭 الجداول الفارغة: ${emptyTables.join(', ')}`);
  }

  console.log('\n🏁 انتهى التحليل الشامل');

  await prisma.$disconnect();
}

// تشغيل التحليل
comprehensiveTableAnalysis().catch(console.error);

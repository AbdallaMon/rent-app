const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function interactiveTableExplorer() {
  console.log('🔍 مستكشف الجداول التفاعلي...\n');

  try {
    // 1. اختبار الاتصال بقاعدة البيانات
    console.log('🔌 اختبار الاتصال بقاعدة البيانات...');
    await prisma.$connect();
    console.log('✅ تم الاتصال بنجاح\n');

    // 2. جلب معلومات قاعدة البيانات
    const dbInfo = await prisma.$queryRaw`SELECT DATABASE() as db_name`;
    console.log(`🗄️  اسم قاعدة البيانات: ${dbInfo[0].db_name}\n`);

    // 3. فحص الجداول المطلوبة لنظام التذكيرات
    const criticalTables = [
      {
        name: 'ReminderSettings',
        purpose: 'إعدادات التذكيرات الأساسية',
        expectedColumns: ['id', 'reminderType', 'daysBeforeDue', 'isActive', 'message']
      },
      {
        name: 'WhatsappMessageLog', 
        purpose: 'سجل رسائل واتساب المرسلة',
        expectedColumns: ['id', 'clientId', 'phoneNumber', 'metadata', 'messageType', 'sentAt']
      },
      {
        name: 'Complaint',
        purpose: 'شكاوى العملاء',
        expectedColumns: ['id', 'clientId', 'title', 'description', 'status', 'createdAt']
      },
      {
        name: 'MaintenanceRequest',
        purpose: 'طلبات الصيانة',
        expectedColumns: ['id', 'clientId', 'title', 'description', 'status', 'priority', 'createdAt']
      }
    ];

    for (const table of criticalTables) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 فحص الجدول: ${table.name}`);
      console.log(`🎯 الغرض: ${table.purpose}`);
      
      try {
        // فحص وجود الجدول
        const exists = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = DATABASE() 
          AND table_name = ${table.name}
        `;
        
        if (exists[0].count === 0) {
          console.log('❌ الجدول غير موجود!');
          continue;
        }
        
        console.log('✅ الجدول موجود');
          // تركيب الجدول
        const structureQuery = `DESCRIBE \`${table.name}\``;
        const structure = await prisma.$queryRawUnsafe(structureQuery);
        const actualColumns = structure.map(col => col.Field);
        
        console.log(`📊 عدد الأعمدة: ${actualColumns.length}`);
        console.log('📝 الأعمدة الموجودة:');
        structure.forEach(col => {
          const nullable = col.Null === 'YES' ? '(اختياري)' : '(مطلوب)';
          const key = col.Key ? `[${col.Key}]` : '';
          console.log(`   - ${col.Field}: ${col.Type} ${nullable} ${key}`);
        });
        
        // فحص الأعمدة المتوقعة
        console.log('\n🔍 فحص الأعمدة المتوقعة:');
        table.expectedColumns.forEach(expectedCol => {
          const exists = actualColumns.includes(expectedCol);
          console.log(`   ${exists ? '✅' : '❌'} ${expectedCol}`);
        });
          // عدد السجلات
        const countQuery = `SELECT COUNT(*) as count FROM \`${table.name}\``;
        const count = await prisma.$queryRawUnsafe(countQuery);
        console.log(`\n📊 عدد السجلات: ${count[0].count}`);
        
        // عينة من البيانات إذا كانت موجودة
        if (count[0].count > 0) {
          const sampleQuery = `SELECT * FROM \`${table.name}\` LIMIT 2`;
          const sample = await prisma.$queryRawUnsafe(sampleQuery);
          console.log('\n🔍 عينة من البيانات:');
          sample.forEach((row, index) => {
            console.log(`\n   صف ${index + 1}:`);
            Object.entries(row).forEach(([key, value]) => {
              const displayValue = value === null ? 'NULL' : 
                                 typeof value === 'string' && value.length > 50 ? 
                                 value.substring(0, 50) + '...' : value;
              console.log(`     ${key}: ${displayValue}`);
            });
          });
        } else {
          console.log('\n📭 الجدول فارغ');
        }
        
      } catch (error) {
        console.error(`❌ خطأ في فحص الجدول ${table.name}:`, error.message);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('🏁 انتهى الفحص التفاعلي للجداول');

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  } finally {
    await prisma.$disconnect();
  }
}

interactiveTableExplorer().catch(console.error);

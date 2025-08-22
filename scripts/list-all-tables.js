// سكربت للتحقق من قائمة الجداول بالكامل في قاعدة البيانات
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

(async () => {
  console.log('🔄 جاري التحقق من جداول قاعدة البيانات...');
  
  try {
    console.log('🔌 محاولة إنشاء اتصال Prisma...');
    const prisma = new PrismaClient();
    
    console.log('🔍 جاري التحقق من اتصال قاعدة البيانات...');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
    
    // عرض المعلومات الأساسية عن قاعدة البيانات
    console.log('\n📊 معلومات قاعدة البيانات:');
    const dbInfo = await prisma.$queryRaw`SELECT DATABASE() as db_name, VERSION() as db_version`;
    console.log(`   • اسم قاعدة البيانات: ${dbInfo[0].db_name}`);
    console.log(`   • إصدار قاعدة البيانات: ${dbInfo[0].db_version}`);
    
    // استعلام عن قائمة الجداول الموجودة في قاعدة البيانات
    console.log('\n📋 قائمة الجداول الموجودة في قاعدة البيانات:');
    const tables = await prisma.$queryRaw`SHOW TABLES`;
    
    // عرض قائمة الجداول بالكامل
    if (tables.length === 0) {
      console.log('   ❌ لا توجد جداول في قاعدة البيانات!');
    } else {
      console.log(`   🗂️ تم العثور على ${tables.length} جدول:`);
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`      ${index + 1}. ${tableName}`);
      });
      
      // البحث عن أسماء الجداول المتعلقة بعقود الإيجار والوحدات والعقارات
      console.log('\n🔍 البحث عن الجداول الرئيسية:');
      
      // العثور على جدول عقود الإيجار
      const rentTables = tables.filter(t => {
        const name = Object.values(t)[0].toLowerCase();
        return name.includes('rent') || name.includes('agreement') || name.includes('contract') || name.includes('lease');
      });
      
      if (rentTables.length > 0) {
        console.log('   📝 جداول محتملة لعقود الإيجار:');
        rentTables.forEach(t => console.log(`      • ${Object.values(t)[0]}`));
      } else {
        console.log('   ❓ لم يتم العثور على أي جداول تتعلق بعقود الإيجار');
      }
      
      // العثور على جدول الوحدات
      const unitTables = tables.filter(t => {
        const name = Object.values(t)[0].toLowerCase();
        return name.includes('unit') || name.includes('apartment') || name.includes('flat');
      });
      
      if (unitTables.length > 0) {
        console.log('   🏠 جداول محتملة للوحدات:');
        unitTables.forEach(t => console.log(`      • ${Object.values(t)[0]}`));
      } else {
        console.log('   ❓ لم يتم العثور على أي جداول تتعلق بالوحدات');
      }
      
      // العثور على جدول العقارات
      const propertyTables = tables.filter(t => {
        const name = Object.values(t)[0].toLowerCase();
        return name.includes('propert') || name.includes('building') || name.includes('estate');
      });
      
      if (propertyTables.length > 0) {
        console.log('   🏢 جداول محتملة للعقارات:');
        propertyTables.forEach(t => console.log(`      • ${Object.values(t)[0]}`));
      } else {
        console.log('   ❓ لم يتم العثور على أي جداول تتعلق بالعقارات');
      }
    }
    
    console.log('\n✅ تم التحقق من اتصال قاعدة البيانات وجداولها بنجاح!');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات!');
    console.error('🔍 تفاصيل الخطأ:', error);
  }
})();

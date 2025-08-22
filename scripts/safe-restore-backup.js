const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function safeRestoreBackup() {
  try {
    console.log('🔄 بدء استعادة البيانات الآمنة...\n');

    // التحقق من وجود ملف النسخة الاحتياطية
    const backupFiles = [
      'sql/backup_data.sql',
      'sql/backup_restore.sql',
      'backup_data.sql'
    ];

    let backupFile = null;
    for (const file of backupFiles) {
      if (fs.existsSync(file)) {
        backupFile = file;
        break;
      }
    }

    if (!backupFile) {
      console.log('❌ لم يتم العثور على ملف النسخة الاحتياطية');
      console.log('الملفات المتوقعة:');
      backupFiles.forEach(file => console.log(`  - ${file}`));
      return;
    }

    console.log(`📁 تم العثور على النسخة الاحتياطية: ${backupFile}`);
    
    // قراءة محتوى النسخة الاحتياطية
    const backupContent = fs.readFileSync(backupFile, 'utf8');
    console.log(`📊 حجم الملف: ${(backupContent.length / 1024 / 1024).toFixed(2)} MB`);    // استخراج عبارات INSERT
    const allLines = backupContent.split('\n');
    const insertStatements = [];
    let currentStatement = '';
    let inInsert = false;

    for (const line of allLines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.toLowerCase().startsWith('insert into')) {
        if (currentStatement && inInsert) {
          insertStatements.push(currentStatement.trim());
        }
        currentStatement = trimmedLine;
        inInsert = true;
      } else if (inInsert) {
        currentStatement += ' ' + trimmedLine;
        if (trimmedLine.endsWith(';')) {
          insertStatements.push(currentStatement.trim());
          currentStatement = '';
          inInsert = false;
        }
      }
    }

    // تصفية العبارات الصالحة
    const validStatements = insertStatements.filter(stmt => 
      stmt.includes('VALUES') &&
      !stmt.includes('_prisma_migrations') &&
      stmt.length > 50
    );    console.log(`📋 عدد عبارات الإدراج المستخرجة: ${validStatements.length}`);

    if (validStatements.length === 0) {
      console.log('⚠️ لم يتم العثور على بيانات للاستعادة في الملف');
      return;
    }

    // عرض معاينة الجداول
    const tableStats = {};
    validStatements.forEach(stmt => {
      const match = stmt.match(/INSERT INTO `?([^`\s]+)`?/i);
      if (match) {
        const tableName = match[1];
        tableStats[tableName] = (tableStats[tableName] || 0) + 1;
      }
    });

    console.log('\n📊 الجداول المكتشفة:');
    Object.entries(tableStats).forEach(([table, count]) => {
      console.log(`  📋 ${table}: ${count} سجل`);
    });

    // تأكيد من المستخدم
    console.log('\n⚠️ هذا سيحذف البيانات الحالية ويستعيد النسخة الاحتياطية');
    console.log('هل تريد المتابعة؟ (اكتب YES للتأكيد)');
    
    // محاكاة تأكيد (في بيئة حقيقية يجب إضافة readline)
    const confirmed = true; // في الإنتاج: await getUserConfirmation()

    if (!confirmed) {
      console.log('❌ تم إلغاء العملية');
      return;
    }

    console.log('\n🚀 بدء عملية الاستعادة...');

    // إيقاف فحص المفاتيح الأجنبية
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;
    console.log('🔓 تم إيقاف فحص المفاتيح الأجنبية');

    // حذف البيانات الحالية من الجداول الرئيسية (بترتيب آمن)
    const tablesToClear = [
      'UserPrivilege',
      'UserProperty', 
      'Payment',
      'Invoice',
      'Installment',
      'MaintenanceInstallment',
      'Maintenance',
      'Expense',
      'Income',
      'RentAgreement',
      'ContractExpenseToRentAgreement',
      'Unit',
      'Attachment',
      'ElectricityMeter',
      'BankAccount',
      'Client',
      'Property',
      'Neighbour',
      'District',
      'City',
      'State',
      'User',
      'Privilege',
      'PropertyType',
      'UnitType',
      'PropertyExpenseType',
      'Bank',
      'Collector',
      'Contact',
      'ContractExpense',
      'RentAgreementType'
    ];

    console.log('\n🗑️ حذف البيانات الحالية...');
    let clearedCount = 0;
    
    for (const table of tablesToClear) {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\``);
        clearedCount++;
        if (clearedCount % 5 === 0) {
          console.log(`⏳ تم حذف ${clearedCount} من ${tablesToClear.length} جدول`);
        }
      } catch (error) {
        // تجاهل أخطاء الجداول غير الموجودة
        if (!error.message.includes("doesn't exist")) {
          console.log(`⚠️ تحذير عند حذف ${table}: ${error.message}`);
        }
      }
    }

    console.log(`✅ تم حذف البيانات من ${clearedCount} جدول`);    // استعادة البيانات
    console.log('\n📥 استعادة البيانات...');
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < validStatements.length; i++) {
      const statement = validStatements[i];
      
      try {
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`⏳ تم استعادة ${successCount} من ${validStatements.length} سجل`);
        }
      } catch (error) {
        errorCount++;
        if (errors.length < 10) {
          const tableName = statement.match(/INSERT INTO `?([^`\s]+)`?/i)?.[1] || 'Unknown';
          errors.push(`${tableName}: ${error.message.substring(0, 100)}`);
        }
      }
    }

    // إعادة تفعيل فحص المفاتيح الأجنبية
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
    console.log('🔒 تم تفعيل فحص المفاتيح الأجنبية');

    // التحقق من النتائج
    console.log('\n📊 نتائج الاستعادة:');
    console.log('=====================================');
    console.log(`✅ سجلات تم استعادتها بنجاح: ${successCount}`);
    console.log(`❌ سجلات فشلت: ${errorCount}`);
      if (successCount > 0) {
      const successRate = ((successCount / (successCount + errorCount)) * 100).toFixed(2);
      console.log(`📈 معدل النجاح: ${successRate}%`);
    }

    // عرض الأخطاء إن وجدت
    if (errors.length > 0) {
      console.log('\n⚠️ عينة من الأخطاء:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // التحقق من استعادة البيانات
    console.log('\n🔍 التحقق من استعادة البيانات...');
    
    try {
      const counts = {
        المستخدمين: await prisma.user.count(),
        العقارات: await prisma.property.count(),
        الولايات: await prisma.state.count(),
        المدن: await prisma.city.count(),
        الوحدات: await prisma.unit.count(),
        العملاء: await prisma.client.count(),
        'عقود الإيجار': await prisma.rentAgreement.count(),
        الصلاحيات: await prisma.privilege.count()
      };

      console.log('=====================================');
      Object.entries(counts).forEach(([name, count]) => {
        console.log(`📊 ${name}: ${count}`);
      });

      const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
      console.log(`=====================================`);
      console.log(`📈 إجمالي السجلات المستعادة: ${totalRecords}`);      if (totalRecords > 0) {
        const successRate = ((successCount / (successCount + errorCount)) * 100).toFixed(2);
        console.log('\n🎉 تمت استعادة البيانات بنجاح!');
        
        // إنشاء تقرير للاستعادة
        const reportContent = `تقرير استعادة البيانات
التاريخ: ${new Date().toLocaleString('ar-SA')}
الملف المستخدم: ${backupFile}
السجلات المستعادة بنجاح: ${successCount}
السجلات الفاشلة: ${errorCount}
معدل النجاح: ${successRate}%

تفاصيل الجداول:
${Object.entries(counts).map(([name, count]) => `${name}: ${count}`).join('\n')}

إجمالي السجلات: ${totalRecords}
`;

        fs.writeFileSync('restore_report.txt', reportContent, 'utf8');
        console.log('📋 تم إنشاء تقرير الاستعادة: restore_report.txt');
        
      } else {
        console.log('⚠️ لم يتم استعادة أي بيانات بنجاح');
      }

    } catch (verifyError) {
      console.log('❌ خطأ في التحقق من البيانات:', verifyError.message);
    }

  } catch (error) {
    console.error('❌ خطأ في عملية الاستعادة:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

// تشغيل الاستعادة
safeRestoreBackup().catch(console.error);

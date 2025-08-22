const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreDataOnly() {
  try {
    console.log('🔄 استعادة البيانات فقط من الملف الاحتياطي...\n');

    // Read the backup file
    const backupContent = fs.readFileSync('backup_data.sql', 'utf8');
    console.log(`📁 تم قراءة الملف الاحتياطي: ${(backupContent.length / 1024).toFixed(2)} KB`);

    // Extract only INSERT statements with more precise filtering
    const lines = backupContent.split('\n');
    const insertStatements = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('INSERT INTO `') && 
          trimmedLine.includes('VALUES') &&
          !trimmedLine.includes('_prisma_migrations')) {
        insertStatements.push(trimmedLine);
      }
    }

    console.log(`📊 عدد عبارات INSERT المستخرجة: ${insertStatements.length}`);

    if (insertStatements.length === 0) {
      console.log('❌ لم يتم العثور على عبارات INSERT في الملف');
      return;
    }

    // Show first few table names for verification
    console.log('\n📋 الجداول التي سيتم استعادتها:');
    const tableNames = new Set();
    insertStatements.slice(0, 10).forEach(stmt => {
      const match = stmt.match(/INSERT INTO `([^`]+)`/);
      if (match) {
        tableNames.add(match[1]);
      }
    });
    tableNames.forEach(table => console.log(`  - ${table}`));

    // Disable foreign key checks
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;
    console.log('\n🔓 تم إيقاف فحص المفاتيح الأجنبية');

    let successCount = 0;
    let errorCount = 0;
    const errorDetails = [];

    // Execute each INSERT statement
    for (let i = 0; i < insertStatements.length; i++) {
      const statement = insertStatements[i];
      
      try {
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        
        // Show progress every 20 statements
        if (successCount % 20 === 0) {
          console.log(`⏳ تم تنفيذ ${successCount} عبارة من أصل ${insertStatements.length}`);
        }
      } catch (error) {
        errorCount++;
        if (errorCount <= 10) { // Show details for first 10 errors
          const tableName = statement.match(/INSERT INTO `([^`]+)`/)?.[1] || 'Unknown';
          errorDetails.push(`${tableName}: ${error.message.substring(0, 100)}`);
        }
      }
    }

    // Re-enable foreign key checks
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
    console.log('🔒 تم تفعيل فحص المفاتيح الأجنبية');

    console.log('\n📊 نتائج الاستعادة:');
    console.log('=====================================');
    console.log(`✅ عبارات نجحت: ${successCount}`);
    console.log(`❌ عبارات فشلت: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n🔍 تفاصيل الأخطاء:');
      errorDetails.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (successCount > 0) {
      console.log(`📈 معدل النجاح: ${((successCount / (successCount + errorCount)) * 100).toFixed(2)}%`);
    }

    // Verify the restoration by checking tables
    console.log('\n🔍 التحقق من استعادة البيانات...');
    
    try {
      const userCount = await prisma.user.count();
      const propertyCount = await prisma.property.count();
      const stateCount = await prisma.state.count();
      const unitCount = await prisma.unit.count();
      const rentAgreementCount = await prisma.rentAgreement.count();
      const privilegeCount = await prisma.privilege.count();

      console.log('=====================================');
      console.log(`👥 المستخدمين: ${userCount}`);
      console.log(`🏢 العقارات: ${propertyCount}`);
      console.log(`🌍 الولايات: ${stateCount}`);
      console.log(`🏠 الوحدات: ${unitCount}`);
      console.log(`📋 عقود الإيجار: ${rentAgreementCount}`);
      console.log(`🔐 الصلاحيات: ${privilegeCount}`);

      if (userCount > 0 || stateCount > 0) {
        console.log('\n🎉 تم استعادة البيانات بنجاح!');
        
        // Add WhatsApp privileges to admin users
        if (userCount > 0) {
          console.log('\n🔧 إضافة صلاحيات واتساب...');
          await addWhatsAppPrivileges();
        }
      } else {
        console.log('\n⚠️ تحذير: لم يتم استعادة البيانات الأساسية');
      }
    } catch (verifyError) {
      console.log(`❌ خطأ في التحقق: ${verifyError.message}`);
    }

  } catch (error) {
    console.error('❌ خطأ في استعادة البيانات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function addWhatsAppPrivileges() {
  try {
    // Create WhatsApp privilege if it doesn't exist
    let whatsappPrivilege = await prisma.privilege.findFirst({
      where: { name: 'WHATSAPP_ADMIN' }
    });

    if (!whatsappPrivilege) {
      whatsappPrivilege = await prisma.privilege.create({
        data: {
          name: 'WHATSAPP_ADMIN',
          canRead: true,
          canWrite: true,
          canEdit: true,
          canDelete: true
        }
      });
      console.log('✅ تم إنشاء صلاحية واتساب');
    }

    // Get admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    console.log(`👨‍💼 عدد المستخدمين الإداريين: ${adminUsers.length}`);

    // Add WhatsApp privilege to admin users
    for (const admin of adminUsers) {
      try {
        await prisma.userPrivilege.create({
          data: {
            userId: admin.id,
            privilegeId: whatsappPrivilege.id,
            area: 'WHATSAPP'
          }
        });
        console.log(`✅ تم إعطاء صلاحية واتساب للمستخدم: ${admin.name || admin.email}`);
      } catch (error) {
        // Already exists, ignore
        console.log(`ℹ️ المستخدم ${admin.name || admin.email} يملك صلاحية واتساب مسبقاً`);
      }
    }
  } catch (error) {
    console.log(`❌ خطأ في إضافة صلاحيات واتساب: ${error.message}`);
  }
}

restoreDataOnly();

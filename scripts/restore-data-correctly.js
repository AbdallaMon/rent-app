const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreDataCorrectly() {
  try {
    console.log('🔄 استعادة البيانات مع معالجة العبارات متعددة الأسطر...\n');

    // Read the backup file
    const backupContent = fs.readFileSync('backup_data.sql', 'utf8');
    console.log(`📁 تم قراءة الملف الاحتياطي: ${(backupContent.length / 1024).toFixed(2)} KB`);

    // Split by semicolons to get complete statements
    const statements = backupContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.startsWith('INSERT INTO') && 
        stmt.includes('VALUES') &&
        !stmt.includes('_prisma_migrations') &&
        stmt.length > 20
      );

    console.log(`📊 عدد عبارات INSERT المستخرجة: ${statements.length}`);

    if (statements.length === 0) {
      console.log('❌ لم يتم العثور على عبارات INSERT صالحة في الملف');
      return;
    }

    // Show first few statements for verification
    console.log('\n📋 أمثلة على العبارات:');
    statements.slice(0, 3).forEach((stmt, index) => {
      const tableName = stmt.match(/INSERT INTO `([^`]+)`/)?.[1] || 'Unknown';
      console.log(`${index + 1}. ${tableName}: ${stmt.substring(0, 100)}...`);
    });

    // Disable foreign key checks
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;
    console.log('\n🔓 تم إيقاف فحص المفاتيح الأجنبية');

    let successCount = 0;
    let errorCount = 0;
    const errorDetails = [];

    // Execute each INSERT statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`⏳ تم تنفيذ ${successCount} عبارة من أصل ${statements.length}`);
        }
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) {
          const tableName = statement.match(/INSERT INTO `([^`]+)`/)?.[1] || 'Unknown';
          errorDetails.push(`${tableName}: ${error.message.substring(0, 150)}`);
          
          // Show the actual statement for debugging
          console.log(`\n❌ خطأ في الجدول ${tableName}:`);
          console.log(`العبارة: ${statement.substring(0, 200)}...`);
          console.log(`الخطأ: ${error.message}\n`);
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

    if (successCount > 0) {
      console.log(`📈 معدل النجاح: ${((successCount / (successCount + errorCount)) * 100).toFixed(2)}%`);
      
      // Verify the restoration
      console.log('\n🔍 التحقق من استعادة البيانات...');
      
      const userCount = await prisma.user.count();
      const propertyCount = await prisma.property.count();
      const stateCount = await prisma.state.count();
      const unitCount = await prisma.unit.count();
      const rentAgreementCount = await prisma.rentAgreement.count();
      const privilegeCount = await prisma.privilege.count();
      const attachmentCount = await prisma.attachment.count();

      console.log('=====================================');
      console.log(`👥 المستخدمين: ${userCount}`);
      console.log(`🏢 العقارات: ${propertyCount}`);
      console.log(`🌍 الولايات: ${stateCount}`);
      console.log(`🏠 الوحدات: ${unitCount}`);
      console.log(`📋 عقود الإيجار: ${rentAgreementCount}`);
      console.log(`🔐 الصلاحيات: ${privilegeCount}`);
      console.log(`📎 المرفقات: ${attachmentCount}`);

      if (userCount > 0 || stateCount > 0 || attachmentCount > 0) {
        console.log('\n🎉 تم استعادة بعض البيانات بنجاح!');
        
        if (userCount > 0) {
          console.log('\n🔧 إضافة صلاحيات واتساب...');
          await addWhatsAppPrivileges();
        }
      } else {
        console.log('\n⚠️ تحذير: لم يتم استعادة البيانات الأساسية');
      }
    } else {
      console.log('\n❌ فشل في استعادة أي بيانات');
    }

  } catch (error) {
    console.error('❌ خطأ عام في استعادة البيانات:', error);
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
        console.log(`ℹ️ المستخدم ${admin.name || admin.email} يملك صلاحية واتساب مسبقاً`);
      }
    }
  } catch (error) {
    console.log(`❌ خطأ في إضافة صلاحيات واتساب: ${error.message}`);
  }
}

restoreDataCorrectly();

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreFromBackupPrisma() {
  try {
    console.log('🔄 بدء استعادة البيانات باستخدام Prisma...\n');

    // Read the backup file
    const backupContent = fs.readFileSync('backup_data.sql', 'utf8');
    console.log(`📁 تم قراءة الملف الاحتياطي: ${(backupContent.length / 1024).toFixed(2)} KB`);

    // Split into statements and filter INSERT statements
    const insertStatements = backupContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.startsWith('INSERT INTO') && 
        stmt.length > 10 &&
        !stmt.includes('_prisma_migrations')
      );

    console.log(`📊 عدد عبارات INSERT: ${insertStatements.length}`);

    // Disable foreign key checks
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;
    console.log('🔓 تم إيقاف فحص المفاتيح الأجنبية');

    let successCount = 0;
    let errorCount = 0;

    // Execute each INSERT statement
    for (let i = 0; i < insertStatements.length; i++) {
      const statement = insertStatements[i];
      
      try {
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        
        // Show progress every 10 statements
        if (successCount % 10 === 0) {
          console.log(`⏳ تم تنفيذ ${successCount} عبارة من أصل ${insertStatements.length}`);
        }
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) { // Show only first 5 errors
          console.log(`⚠️ خطأ في العبارة ${i + 1}: ${error.message.substring(0, 100)}...`);
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
    console.log(`📈 معدل النجاح: ${successCount > 0 ? ((successCount / (successCount + errorCount)) * 100).toFixed(2) : 0}%`);

    // Verify the restoration by checking some tables
    console.log('\n🔍 التحقق من استعادة البيانات...');
    
    const userCount = await prisma.user.count();
    const propertyCount = await prisma.property.count();
    const stateCount = await prisma.state.count();
    const unitCount = await prisma.unit.count();

    console.log('=====================================');
    console.log(`👥 المستخدمين: ${userCount}`);
    console.log(`🏢 العقارات: ${propertyCount}`);
    console.log(`🌍 الولايات: ${stateCount}`);
    console.log(`🏠 الوحدات: ${unitCount}`);

    if (userCount > 0 && stateCount > 0) {
      console.log('\n🎉 تم استعادة البيانات بنجاح!');
      
      // Now add WhatsApp privileges to existing admin users
      console.log('\n🔧 إضافة صلاحيات واتساب للمستخدمين الإداريين...');
      
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' }
      });

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

    } else {
      console.log('\n⚠️ تحذير: قد تكون هناك مشكلة في استعادة البيانات');
    }

  } catch (error) {
    console.error('❌ خطأ في استعادة البيانات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreFromBackupPrisma();

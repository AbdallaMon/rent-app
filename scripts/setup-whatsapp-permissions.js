const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupWhatsAppPermissions() {
  try {
    console.log('🚀 إعداد صلاحيات الواتساب للإدمن...\n');
    
    // 1. البحث عن صلاحية واتساب موجودة أو إنشاؤها
    let whatsappPrivilege = await prisma.privilege.findFirst({
      where: { name: 'WHATSAPP' }
    });
    
    if (!whatsappPrivilege) {
      console.log('📝 إنشاء صلاحية واتساب جديدة...');
      whatsappPrivilege = await prisma.privilege.create({
        data: {
          name: 'WHATSAPP',
          canRead: true,
          canWrite: true,
          canDelete: true,
          canEdit: true
        }
      });
      console.log(`✅ تم إنشاء صلاحية واتساب (ID: ${whatsappPrivilege.id})`);
    } else {
      console.log(`✅ صلاحية واتساب موجودة (ID: ${whatsappPrivilege.id})`);
    }
    
    // 2. إعطاء صلاحية الواتساب للمستخدم الإدمن
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      console.log('❌ لم يتم العثور على مستخدم إدمن');
      return;
    }
    
    console.log(`👤 المستخدم الإدمن: ${adminUser.name} (${adminUser.email})`);
    
    // التحقق من وجود الصلاحية
    const existingPermission = await prisma.userPrivilege.findFirst({
      where: {
        userId: adminUser.id,
        privilegeId: whatsappPrivilege.id,
        area: 'WHATSAPP'
      }
    });
    
    if (!existingPermission) {
      console.log('📋 إضافة صلاحية واتساب للإدمن...');
      await prisma.userPrivilege.create({
        data: {
          userId: adminUser.id,
          privilegeId: whatsappPrivilege.id,
          area: 'WHATSAPP'
        }
      });
      console.log('✅ تم إعطاء صلاحيات واتساب للإدمن');
    } else {
      console.log('✅ الإدمن لديه صلاحيات واتساب مسبقاً');
    }
    
    // 3. التحقق من النتيجة
    const adminWithPermissions = await prisma.user.findUnique({
      where: { id: adminUser.id },
      include: {
        privileges: {
          where: { area: 'WHATSAPP' },
          include: { privilege: true }
        }
      }
    });
    
    console.log('\n🔍 صلاحيات الواتساب للإدمن:');
    if (adminWithPermissions.privileges.length > 0) {
      adminWithPermissions.privileges.forEach(up => {
        console.log(`✅ ${up.privilege.name} - قراءة: ${up.privilege.canRead}, كتابة: ${up.privilege.canWrite}, تعديل: ${up.privilege.canEdit}, حذف: ${up.privilege.canDelete}`);
      });
    } else {
      console.log('❌ لا توجد صلاحيات واتساب');
    }
    
    console.log('\n🎉 تم إعداد صلاحيات الواتساب بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إعداد الصلاحيات:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupWhatsAppPermissions();

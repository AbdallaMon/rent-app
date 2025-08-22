const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicatePrivileges() {
  try {
    console.log('🧹 تنظيف الصلاحيات المكررة...\n');
    
    // البحث عن الصلاحيات المكررة
    const allPrivileges = await prisma.privilege.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }]
    });
    
    console.log(`📊 إجمالي الصلاحيات: ${allPrivileges.length}`);
    
    // تجميع الصلاحيات حسب الاسم
    const privilegeGroups = {};
    allPrivileges.forEach(priv => {
      if (!privilegeGroups[priv.name]) {
        privilegeGroups[priv.name] = [];
      }
      privilegeGroups[priv.name].push(priv);
    });
    
    console.log('\n📋 فحص الصلاحيات المكررة:');
    
    let toDelete = [];
    let toKeep = [];
    
    Object.entries(privilegeGroups).forEach(([name, privileges]) => {
      if (privileges.length > 1) {
        console.log(`⚠️ ${name}: ${privileges.length} نسخة مكررة`);
        
        // الاحتفاظ بأقدم صلاحية (أصغر ID)
        const keepPrivilege = privileges[0];
        const deletePrivileges = privileges.slice(1);
        
        toKeep.push(keepPrivilege);
        toDelete.push(...deletePrivileges);
        
        console.log(`   ✅ سيتم الاحتفاظ بـ ID: ${keepPrivilege.id}`);
        console.log(`   ❌ سيتم حذف: ${deletePrivileges.map(p => p.id).join(', ')}`);
      } else {
        toKeep.push(privileges[0]);
        console.log(`✅ ${name}: نسخة واحدة فقط`);
      }
    });
    
    console.log(`\n📊 ملخص:`)
    console.log(`   - صلاحيات فريدة: ${toKeep.length}`);
    console.log(`   - صلاحيات مكررة للحذف: ${toDelete.length}`);
    
    if (toDelete.length === 0) {
      console.log('✅ لا توجد صلاحيات مكررة للحذف');
      return;
    }
    
    // الحصول على موافقة (محاكاة)
    console.log('\n⚠️ هذا سيحذف الصلاحيات المكررة ويحتفظ بأقدم نسخة لكل صلاحية');
    const confirmed = true; // في الإنتاج: await getUserConfirmation()
    
    if (!confirmed) {
      console.log('❌ تم إلغاء العملية');
      return;
    }
    
    console.log('\n🗑️ حذف الصلاحيات المكررة...');
    
    // حذف UserPrivileges المرتبطة بالصلاحيات المكررة أولاً
    for (const privilege of toDelete) {
      const userPrivileges = await prisma.userPrivilege.findMany({
        where: { privilegeId: privilege.id }
      });
      
      if (userPrivileges.length > 0) {
        console.log(`   🔄 نقل ${userPrivileges.length} صلاحية مستخدم من ID ${privilege.id}`);
        
        // البحث عن الصلاحية المقابلة للاحتفاظ بها
        const keepPrivilege = toKeep.find(p => p.name === privilege.name);
        
        for (const userPriv of userPrivileges) {
          // التحقق من عدم وجود صلاحية مماثلة مسبقاً
          const existing = await prisma.userPrivilege.findFirst({
            where: {
              userId: userPriv.userId,
              privilegeId: keepPrivilege.id,
              area: userPriv.area
            }
          });
          
          if (!existing) {
            // نقل الصلاحية للصلاحية المحتفظ بها
            await prisma.userPrivilege.update({
              where: { id: userPriv.id },
              data: { privilegeId: keepPrivilege.id }
            });
          } else {
            // حذف الصلاحية المكررة
            await prisma.userPrivilege.delete({
              where: { id: userPriv.id }
            });
          }
        }
      }
    }
    
    // حذف الصلاحيات المكررة
    const deleteIds = toDelete.map(p => p.id);
    const deletedCount = await prisma.privilege.deleteMany({
      where: { id: { in: deleteIds } }
    });
    
    console.log(`✅ تم حذف ${deletedCount.count} صلاحية مكررة`);
    
    // التحقق من النتيجة النهائية
    const finalPrivileges = await prisma.privilege.findMany();
    console.log(`\n📊 الصلاحيات بعد التنظيف: ${finalPrivileges.length}`);
    
    // عرض الصلاحيات الفريدة
    console.log('\n✅ الصلاحيات النهائية:');
    const uniqueNames = [...new Set(finalPrivileges.map(p => p.name))].sort();
    uniqueNames.forEach(name => {
      console.log(`   - ${name}`);
    });
    
    console.log('\n🎉 تم تنظيف الصلاحيات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في تنظيف الصلاحيات:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicatePrivileges();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCustomerServiceNumber() {
  try {
    console.log('🔧 تحديث رقم خدمة العملاء...');
    
    // عرض الرقم الحالي
    const current = await prisma.whatsAppTeamSettings.findFirst({
      where: { id: 'default_team_settings' }
    });
    console.log('📞 الرقم الحالي:', current?.customerServicePhone || 'غير محدد');
    
    // تحديث الرقم
    const updated = await prisma.whatsAppTeamSettings.update({
      where: { id: 'default_team_settings' },
      data: { customerServicePhone: '971556677779' }
    });
    
    console.log('✅ تم تحديث رقم خدمة العملاء إلى:', updated.customerServicePhone);
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCustomerServiceNumber();

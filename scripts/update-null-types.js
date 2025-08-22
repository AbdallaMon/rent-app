// تحديث القيم NULL في جدول MaintenanceRequest
import { PrismaClient } from './generated/client/index.js';

const prisma = new PrismaClient();

async function updateNullTypes() {
  try {
    console.log('🔄 تحديث القيم NULL في جدول MaintenanceRequest...');
    
    // البحث عن السجلات التي تحتوي على NULL في type
    const recordsWithNullType = await prisma.maintenanceRequest.findMany({
      where: {
        type: null
      },
      select: {
        id: true,
        description: true,
        type: true
      }
    });
    
    console.log(`📊 وُجد ${recordsWithNullType.length} سجل يحتوي على قيمة NULL في type`);
    
    if (recordsWithNullType.length > 0) {
      console.log('📋 السجلات التي سيتم تحديثها:');
      recordsWithNullType.forEach(record => {
        console.log(`  - ID: ${record.id}, الوصف: ${record.description.substring(0, 50)}...`);
      });
      
      // تحديث جميع القيم NULL إلى 'electrical' (قيمة افتراضية)
      const updateResult = await prisma.maintenanceRequest.updateMany({
        where: {
          type: null
        },
        data: {
          type: 'electrical' // قيمة افتراضية آمنة
        }
      });
      
      console.log(`✅ تم تحديث ${updateResult.count} سجل بنجاح`);
    } else {
      console.log('✅ لا توجد سجلات تحتاج لتحديث');
    }
    
    // التحقق من النتيجة
    const remainingNulls = await prisma.maintenanceRequest.count({
      where: {
        type: null
      }
    });
    
    console.log(`📊 السجلات المتبقية مع قيم NULL: ${remainingNulls}`);
    
  } catch (error) {
    console.error('❌ خطأ في تحديث القيم:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNullTypes();

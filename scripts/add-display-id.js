// سكريبت إضافة display ID للسجلات الموجودة
import { withWriteConnection } from './src/lib/database-connection.js';
import { updateOldRecordsWithDisplayId } from './src/lib/display-id-generator.js';

async function addDisplayIdColumn() {
  console.log('🔄 بدء إضافة حقل displayId وتحديث السجلات الموجودة...');
  
  try {
    await withWriteConnection(async (prisma) => {
      // التحقق من وجود العمود أولاً
      console.log('📋 التحقق من بنية قاعدة البيانات...');
      
      try {
        // محاولة إضافة العمود للصيانة
        await prisma.$executeRaw`
          ALTER TABLE MaintenanceRequest 
          ADD COLUMN displayId VARCHAR(191) NULL UNIQUE;
        `;
        console.log('✅ تم إضافة حقل displayId لجدول MaintenanceRequest');
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log('ℹ️ حقل displayId موجود بالفعل في جدول MaintenanceRequest');
        } else {
          console.log('⚠️ خطأ في إضافة العمود للصيانة:', error.message);
        }
      }
      
      try {
        // محاولة إضافة العمود للشكاوى
        await prisma.$executeRaw`
          ALTER TABLE Complaint 
          ADD COLUMN displayId VARCHAR(191) NULL UNIQUE;
        `;
        console.log('✅ تم إضافة حقل displayId لجدول Complaint');
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log('ℹ️ حقل displayId موجود بالفعل في جدول Complaint');
        } else {
          console.log('⚠️ خطأ في إضافة العمود للشكاوى:', error.message);
        }
      }
    });
    
    // تحديث السجلات القديمة
    console.log('\n📝 تحديث السجلات القديمة...');
    const result = await updateOldRecordsWithDisplayId();
    
    if (result.success) {
      console.log('\n🎉 تم الانتهاء بنجاح!');
      console.log(`✅ تم تحديث ${result.updatedMaintenance} طلب صيانة`);
      console.log(`✅ تم تحديث ${result.updatedComplaints} شكوى`);
      console.log('\n📋 الفورمات الجديد:');
      console.log('- طلبات الصيانة: MR-2024-0001');
      console.log('- الشكاوى: CMP-2024-0001');
    } else {
      console.error('❌ فشل في تحديث السجلات:', result.error);
    }
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل السكريبت
addDisplayIdColumn();

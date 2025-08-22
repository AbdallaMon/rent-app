/*
 * ========================================
 * UPDATE MAINTENANCE REQUEST STATUS
 * ========================================
 * 
 * سكريپت لتحديث حالة طلب الصيانة وإرسال إشعار للعميل
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// دالة ترجمة الحالات للعربية
function translateStatus(status) {
  const statusTranslations = {
    'PENDING': 'قيد الانتظار',
    'IN_PROGRESS': 'قيد التنفيذ', 
    'COMPLETED': 'مكتمل',
    'REJECTED': 'مرفوض',
    'CANCELLED': 'ملغي',
    'ON_HOLD': 'معلق'
  };
  
  return statusTranslations[status] || status;
}

// دالة ترجمة نوع الصيانة للعربية
function translateMaintenanceType(type) {
  const typeTranslations = {
    'plumbing': 'سباكة',
    'electrical': 'كهرباء',
    'ac_heating': 'تكييف وتدفئة',
    'appliances': 'أجهزة منزلية',
    'structural': 'إنشائية',
    'other': 'أخرى',
    'other_maintenance': 'أخرى'
  };
  
  return typeTranslations[type] || type;
}

async function updateMaintenanceStatus() {
  try {
    console.log('🔍 البحث عن طلب الصيانة MR-2025-0004...\n');
    
    // البحث عن الطلب
    const request = await prisma.maintenanceRequest.findFirst({
      where: {
        displayId: 'MR-2025-0004'
      },
      include: {
        client: true,
        property: true,
        unit: true
      }
    });
    
    if (!request) {
      console.log('❌ لم يتم العثور على طلب الصيانة MR-2025-0004');
      
      // البحث في الطلبات الحديثة
      const recentRequests = await prisma.maintenanceRequest.findMany({
        where: {
          client: {
            name: {
              contains: 'جبل الشروق'
            }
          }
        },
        include: {
          client: true,
          property: true,
          unit: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });
      
      console.log(`\n🔍 آخر ${recentRequests.length} طلبات للعميل "جبل الشروق":`);
      recentRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.displayId || req.id} - ${translateStatus(req.status)} - ${translateMaintenanceType(req.type)}`);
        console.log(`   العقار: ${req.property?.name || 'غير محدد'}`);
        console.log(`   الوحدة: ${req.unit?.number || req.unit?.unitId || 'غير محدد'}`);
        console.log(`   التاريخ: ${req.createdAt.toLocaleDateString()}`);
        console.log('');
      });
      
      return;
    }
    
    console.log('✅ تم العثور على الطلب:');
    console.log(`📋 رقم الطلب: ${request.displayId || request.id}`);
    console.log(`👤 العميل: ${request.client?.name || 'غير محدد'}`);
    console.log(`🔧 نوع الصيانة: ${translateMaintenanceType(request.type)}`);
    console.log(`🏠 العقار: ${request.property?.name || 'غير محدد'}`);
    console.log(`🏢 الوحدة: ${request.unit?.number || request.unit?.unitId || 'غير محدد'}`);
    console.log(`📊 الحالة الحالية: ${translateStatus(request.status)} (${request.status})`);
    
    // تحديث الحالة إلى REJECTED
    const updatedRequest = await prisma.maintenanceRequest.update({
      where: {
        id: request.id
      },
      data: {
        status: 'REJECTED',
        updatedAt: new Date()
      },
      include: {
        client: true,
        property: true,
        unit: true
      }
    });
    
    console.log('\n✅ تم تحديث الحالة بنجاح!');
    console.log(`📊 الحالة الجديدة: ${translateStatus(updatedRequest.status)} (${updatedRequest.status})`);
    
    // إنشاء رسالة الإشعار بالعربية
    const notificationMessage = `🔔 *تحديث حالة طلب الصيانة*

📋 *رقم الطلب:* ‭${updatedRequest.displayId || updatedRequest.id}‬
👤 *العميل:* ${updatedRequest.client?.name || 'غير محدد'}
🔧 *نوع الصيانة:* ${translateMaintenanceType(updatedRequest.type)}
🏠 *العقار:* ${updatedRequest.property?.name || 'غير محدد'}
🏢 *الوحدة:* ${updatedRequest.unit?.number || updatedRequest.unit?.unitId || 'غير محدد'}
📊 *الحالة الجديدة:* ${translateStatus(updatedRequest.status)}

📱 *شركة تار العقارية*
☎️ *للاستفسار:* +971507935566
🇦🇪 *دولة الإمارات العربية المتحدة*`;

    console.log('\n📱 رسالة الإشعار بالعربية:');
    console.log('═'.repeat(50));
    console.log(notificationMessage);
    console.log('═'.repeat(50));
    
    // رسالة بالإنجليزية أيضاً
    const englishMessage = `🔔 *Maintenance Request Status Update*

📋 *Request ID:* ${updatedRequest.displayId || updatedRequest.id}
👤 *Client:* ${updatedRequest.client?.name || 'Not specified'}
🔧 *Maintenance Type:* ${updatedRequest.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
🏠 *Property:* ${updatedRequest.property?.name || 'Not specified'}
🏢 *Unit:* ${updatedRequest.unit?.number || updatedRequest.unit?.unitId || 'Not specified'}
📊 *New Status:* ${updatedRequest.status}

📱 *Tar Real Estate*
☎️ *For inquiries:* +971507935566
🇦🇪 *United Arab Emirates*`;

    console.log('\n📱 English Notification Message:');
    console.log('═'.repeat(50));
    console.log(englishMessage);
    console.log('═'.repeat(50));
    
    // التوضيح حول التعريب
    console.log('\n💡 توضيح حول التعريب:');
    console.log('');
    console.log('📊 الحالات في قاعدة البيانات (إنجليزية):');
    console.log('   - PENDING, IN_PROGRESS, COMPLETED, REJECTED, CANCELLED');
    console.log('');
    console.log('🔄 الترجمة للعربية في عرض الرسائل:');
    console.log('   - REJECTED → مرفوض');
    console.log('   - COMPLETED → مكتمل');
    console.log('   - PENDING → قيد الانتظار');
    console.log('   - IN_PROGRESS → قيد التنفيذ');
    console.log('');
    console.log('⚠️ المشكلة المحتملة:');
    console.log('   البوت قد لا يحتوي على دالة ترجمة الحالات');
    console.log('   أو قد يعرض الحالة الخام من قاعدة البيانات');
    
  } catch (error) {
    console.error('❌ خطأ في تحديث حالة الطلب:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateMaintenanceStatus();

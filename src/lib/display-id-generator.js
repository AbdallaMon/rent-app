// مولد فورمات ID المخصص
import { withReadOnlyConnection } from './database-connection';

/**
 * توليد display ID للصيانة بالفورمات: MR-2024-0001
 */
export async function generateMaintenanceDisplayId() {
  return await withReadOnlyConnection(async (prisma) => {
    try {
      const currentYear = new Date().getFullYear();
      
      // البحث عن آخر رقم للسنة الحالية
      const lastRequest = await prisma.maintenanceRequest.findFirst({
        where: {
          displayId: {
            startsWith: `MR-${currentYear}-`
          }
        },
        orderBy: {
          displayId: 'desc'
        }
      });
      
      let nextNumber = 1;
      
      if (lastRequest && lastRequest.displayId) {
        // استخراج الرقم من آخر displayId
        const match = lastRequest.displayId.match(/MR-\d{4}-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      // تنسيق الرقم بـ 4 أرقام (0001)
      const formattedNumber = nextNumber.toString().padStart(4, '0');
      const displayId = `MR-${currentYear}-${formattedNumber}`;
      
      console.log(`🔧 Generated maintenance display ID: ${displayId}`);
      return displayId;
      
    } catch (error) {
      console.error('❌ خطأ في توليد display ID للصيانة:', error);
      // fallback - استخدام timestamp
      const timestamp = Date.now().toString().slice(-4);
      return `MR-${new Date().getFullYear()}-${timestamp}`;
    }
  });
}

/**
 * توليد display ID للشكوى بالفورمات: CMP-2024-0001
 */
export async function generateComplaintDisplayId() {
  return await withReadOnlyConnection(async (prisma) => {
    try {
      const currentYear = new Date().getFullYear();
      
      // البحث عن آخر رقم للسنة الحالية
      const lastComplaint = await prisma.complaint.findFirst({
        where: {
          displayId: {
            startsWith: `CMP-${currentYear}-`
          }
        },
        orderBy: {
          displayId: 'desc'
        }
      });
      
      let nextNumber = 1;
      
      if (lastComplaint && lastComplaint.displayId) {
        // استخراج الرقم من آخر displayId
        const match = lastComplaint.displayId.match(/CMP-\d{4}-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      // تنسيق الرقم بـ 4 أرقام (0001)
      const formattedNumber = nextNumber.toString().padStart(4, '0');
      const displayId = `CMP-${currentYear}-${formattedNumber}`;
      
      console.log(`📝 Generated complaint display ID: ${displayId}`);
      return displayId;
      
    } catch (error) {
      console.error('❌ خطأ في توليد display ID للشكوى:', error);
      // fallback - استخدام timestamp
      const timestamp = Date.now().toString().slice(-4);
      return `CMP-${new Date().getFullYear()}-${timestamp}`;
    }
  });
}

/**
 * دالة مساعدة للحصول على display ID أو إنشاؤه إذا لم يكن موجوداً
 */
export function getDisplayId(record, type = 'maintenance') {
  if (record.displayId) {
    return record.displayId;
  }
  
  // fallback للسجلات القديمة التي لا تحتوي على displayId
  const year = new Date(record.createdAt).getFullYear();
  const shortId = record.id.slice(-4).toUpperCase();
  
  if (type === 'maintenance') {
    return `MR-${year}-${shortId}`;
  } else {
    return `CMP-${year}-${shortId}`;
  }
}

/**
 * تحديث السجلات القديمة لإضافة displayId
 */
export async function updateOldRecordsWithDisplayId() {
  return await withReadOnlyConnection(async (prisma) => {
    try {
      console.log('🔄 تحديث السجلات القديمة بـ display IDs...');
      
      // تحديث طلبات الصيانة القديمة
      const oldMaintenanceRequests = await prisma.maintenanceRequest.findMany({
        where: {
          displayId: null
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      let maintenanceCounter = {};
      
      for (const request of oldMaintenanceRequests) {
        const year = new Date(request.createdAt).getFullYear();
        
        if (!maintenanceCounter[year]) {
          maintenanceCounter[year] = 1;
        }
        
        const formattedNumber = maintenanceCounter[year].toString().padStart(4, '0');
        const displayId = `MR-${year}-${formattedNumber}`;
        
        await prisma.maintenanceRequest.update({
          where: { id: request.id },
          data: { displayId }
        });
        
        maintenanceCounter[year]++;
        console.log(`✅ Updated maintenance request ${request.id} -> ${displayId}`);
      }
      
      // تحديث الشكاوى القديمة
      const oldComplaints = await prisma.complaint.findMany({
        where: {
          displayId: null
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      let complaintCounter = {};
      
      for (const complaint of oldComplaints) {
        const year = new Date(complaint.createdAt).getFullYear();
        
        if (!complaintCounter[year]) {
          complaintCounter[year] = 1;
        }
        
        const formattedNumber = complaintCounter[year].toString().padStart(4, '0');
        const displayId = `CMP-${year}-${formattedNumber}`;
        
        await prisma.complaint.update({
          where: { id: complaint.id },
          data: { displayId }
        });
        
        complaintCounter[year]++;
        console.log(`✅ Updated complaint ${complaint.id} -> ${displayId}`);
      }
      
      console.log(`🎉 تم تحديث ${oldMaintenanceRequests.length} طلب صيانة و ${oldComplaints.length} شكوى`);
      
      return {
        success: true,
        updatedMaintenance: oldMaintenanceRequests.length,
        updatedComplaints: oldComplaints.length
      };
      
    } catch (error) {
      console.error('❌ خطأ في تحديث السجلات القديمة:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
}

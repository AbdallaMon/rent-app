// Enhanced request handler مع حل جذري للمشاكل
// النسخة المحسنة للإنتاج
import { withWriteConnection, withReadOnlyConnection } from '@/lib/database-connection';
import { sendMaintenanceNotifications, sendComplaintNotifications } from '@/lib/reliable-notifications';
import { generateMaintenanceDisplayId, generateComplaintDisplayId, getDisplayId } from '@/lib/display-id-generator';

/**
 * البحث عن العميل - النسخة المحسنة مع حل جذري
 */
export async function findClientWithPropertyProduction(phoneNumber) {
  return await withReadOnlyConnection(async (prisma) => {
    try {
      console.log(`🔍 [PRODUCTION] البحث عن العميل: ${phoneNumber}`);
      
      // إزالة جميع المسافات والرموز الخاصة
      const cleanedPhone = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
      console.log(`🧹 رقم الهاتف بعد التنظيف: ${cleanedPhone}`);
      
      // إنشاء جميع الصيغ الممكنة
      const searchVariants = [];
      
      // إضافة الرقم الأصلي كما هو
      searchVariants.push(phoneNumber);
      searchVariants.push(cleanedPhone);
      
      // إزالة البادئات المختلفة
      let coreNumber = cleanedPhone;
      if (coreNumber.startsWith('+971')) {
        coreNumber = coreNumber.substring(4);
      } else if (coreNumber.startsWith('971')) {
        coreNumber = coreNumber.substring(3);
      } else if (coreNumber.startsWith('0')) {
        coreNumber = coreNumber.substring(1);
      }
      
      // إضافة جميع الصيغ
      searchVariants.push(coreNumber);
      searchVariants.push(`+971${coreNumber}`);
      searchVariants.push(`971${coreNumber}`);
      searchVariants.push(`0${coreNumber}`);
      searchVariants.push(`+9710${coreNumber}`);
      searchVariants.push(`9710${coreNumber}`);
      
      // إزالة التكرارات
      const uniqueVariants = [...new Set(searchVariants)];
      console.log(`🔍 البحث باستخدام الأرقام:`, uniqueVariants);
      
      // البحث في قاعدة البيانات
      let client = null;
      
      // البحث المباشر أولاً
      client = await prisma.client.findFirst({
        where: {
          phone: {
            in: uniqueVariants
          }
        }
      });
      
      // إذا لم نجد، نبحث بطريقة أوسع
      if (!client) {
        console.log(`🔍 البحث المباشر فشل، محاولة البحث الموسع...`);
        
        // البحث بالجزء الأخير من الرقم
        const lastDigits = coreNumber.slice(-8); // آخر 8 أرقام
        
        client = await prisma.client.findFirst({
          where: {
            OR: [
              { phone: { endsWith: lastDigits } },
              { phone: { contains: lastDigits } },
              { phone: { contains: coreNumber } }
            ]
          }
        });
      }
      
      if (!client) {
        console.log(`❌ لم يتم العثور على العميل نهائياً`);
        
        // طباعة عينة من العملاء للمقارنة
        const sampleClients = await prisma.client.findMany({
          take: 5,
          select: { id: true, name: true, phone: true }
        });
        console.log(`📋 عينة من العملاء الموجودين:`, sampleClients);
        
        return {
          success: false,
          message: 'لم يتم العثور على العميل بهذا الرقم',
          client: null,
          property: null,
          unit: null,
          debug: {
            searchedVariants: uniqueVariants,
            sampleClients: sampleClients
          }
        };
      }
      
      console.log(`✅ تم العثور على العميل: ${client.name} (ID: ${client.id})`);
      
      // البحث عن العقود النشطة
      const rentAgreements = await prisma.rentAgreement.findMany({
        where: {
          renterId: client.id,
          status: 'ACTIVE'
        },
        include: {
          unit: {
            include: {
              property: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      let property = null;
      let unit = null;
      
      if (rentAgreements.length > 0) {
        const mainAgreement = rentAgreements[0];
        property = mainAgreement.unit.property;
        unit = mainAgreement.unit;
        
        console.log(`🏠 العقار: ${property.name}, الوحدة: ${unit.number}`);
      } else {
        console.log(`⚠️ لا توجد عقود إيجار نشطة للعميل`);
      }
      
      return {
        success: true,
        message: 'تم العثور على العميل والعقار والوحدة بنجاح',
        client: client,
        property: property,
        unit: unit,
        rentAgreements: rentAgreements
      };
      
    } catch (error) {
      console.error('❌ خطأ في البحث عن العميل:', error);
      console.error('📋 تفاصيل الخطأ الكاملة:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        phoneNumber: phoneNumber
      });
      
      return {
        success: false,
        message: 'حدث خطأ أثناء البحث عن العميل',
        client: null,
        property: null,
        unit: null,
        error: error.message
      };
    }
  });
}

/**
 * إنشاء طلب صيانة - النسخة المحسنة
 */
export async function createMaintenanceRequestProduction(phoneNumber, description, session) {
  return await withWriteConnection(async (prisma) => {
    try {
      console.log(`🔧 [PRODUCTION] إنشاء طلب صيانة للرقم: ${phoneNumber}`);
      console.log(`📝 الوصف: ${description}`);
      console.log(`📋 Session:`, JSON.stringify(session, null, 2));
      
      // البحث عن العميل
      const clientData = await findClientWithPropertyProduction(phoneNumber);
      
      if (!clientData.success || !clientData.client) {
        console.error('❌ فشل في العثور على العميل:', clientData.message);
        return {
          success: false,
          message: 'لم يتم العثور على العميل. يرجى التأكد من رقم الهاتف.',
          data: null,
          error: 'CLIENT_NOT_FOUND',
          debug: clientData.debug
        };
      }
      
      const { client, property, unit } = clientData;
        // تحضير البيانات مع التحقق من الصحة
      const maintenanceData = {
        clientId: client.id,
        propertyId: property?.id || null,
        unitId: unit?.id || null,
        description: description,
        type: 'OTHER', // قيمة افتراضية آمنة من MaintenanceType enum
        priority: 'MEDIUM', // قيمة افتراضية آمنة
        status: 'PENDING'
      };
        // تحديث القيم من الجلسة إذا كانت متوفرة وصحيحة
      if (session?.data?.maintenanceType) {        // إنشاء مطابقة بين القيم lowercase والـ enum UPPERCASE
        const typeMapping = {
          'electrical': 'ELECTRICAL',
          'plumbing': 'PLUMBING', 
          'ac_heating': 'AC_HEATING',
          'appliances': 'APPLIANCES',
          'structural': 'STRUCTURAL',
          'cleaning': 'CLEANING',
          'painting': 'PAINTING',
          'carpentry': 'CARPENTRY',
          'pest_control': 'PEST_CONTROL',
          'other': 'OTHER',
          'other_maintenance': 'OTHER' // إضافة مطابقة للـ ID الصحيح
        };
        
        const inputType = session.data.maintenanceType.toLowerCase();
        const mappedType = typeMapping[inputType];
        
        console.log(`🔧 نوع الصيانة المرسل: ${session.data.maintenanceType}`);
        console.log(`🔧 نوع الصيانة بعد التطبيع: ${inputType}`);
        console.log(`🔧 نوع الصيانة المطابق: ${mappedType}`);
        
        if (mappedType) {
          maintenanceData.type = mappedType;
        } else {
          console.log(`⚠️ نوع صيانة غير معروف: ${session.data.maintenanceType}, استخدام OTHER`);
          maintenanceData.type = 'OTHER';
        }
      }
      
      if (session?.data?.priority) {
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        if (validPriorities.includes(session.data.priority.toUpperCase())) {
          maintenanceData.priority = session.data.priority.toUpperCase();
        }
      }
        console.log(`📊 بيانات طلب الصيانة النهائية:`, maintenanceData);
      
      // توليد display ID مخصص
      const displayId = await generateMaintenanceDisplayId();
      maintenanceData.displayId = displayId;
      console.log(`🔧 Display ID للطلب: ${displayId}`);
      
      // إنشاء الطلب
      const maintenanceRequest = await prisma.maintenanceRequest.create({
        data: maintenanceData,
        include: {
          client: true,
          property: true,
          unit: true
        }
      });console.log(`✅ تم إنشاء طلب الصيانة بنجاح: ${maintenanceRequest.id}`);
      
      // إرسال الإشعارات الموثوقة للفني وخدمة العملاء
      try {
        console.log(`📤 إرسال إشعارات طلب الصيانة #${maintenanceRequest.id}...`);        const notificationResult = await sendMaintenanceNotifications({
          requestId: maintenanceRequest.id,
          displayId: maintenanceRequest.displayId,
          clientName: client.name,
          clientPhone: phoneNumber,
          maintenanceType: maintenanceRequest.type,
          priority: maintenanceRequest.priority,
          description: description,
          propertyName: property?.name || 'غير محدد',
          unitNumber: unit?.number || unit?.unitId || `الطابق ${unit?.floor || 'غير محدد'}` || 'غير محدد'
        });
        
        console.log(`📤 نتيجة إرسال الإشعارات:`, notificationResult);
        
        if (notificationResult.success) {
          console.log(`✅ تم إرسال جميع الإشعارات بنجاح (${notificationResult.successCount}/${notificationResult.totalCount})`);
        } else {
          console.log(`⚠️ فشل في إرسال بعض الإشعارات (${notificationResult.successCount}/${notificationResult.totalCount})`);
        }
        
      } catch (notificationError) {
        console.error(`❌ خطأ في إرسال الإشعارات:`, notificationError);
        // لا نوقف العملية حتى لو فشلت الإشعارات
      }
      
      return {
        success: true,
        message: 'تم إنشاء طلب الصيانة بنجاح',
        data: {
          request: maintenanceRequest,
          client: client,
          property: property,
          unit: unit
        }
      };
      
    } catch (error) {
      console.error('❌ خطأ في إنشاء طلب الصيانة:', error);
      console.error('📋 تفاصيل الخطأ الكاملة:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        phoneNumber: phoneNumber,
        session: session
      });
      
      return {
        success: false,
        message: 'حدث خطأ أثناء إنشاء طلب الصيانة',
        data: null,
        error: error.message
      };
    }
  });
}

/**
 * إنشاء شكوى - النسخة المحسنة
 */
export async function createComplaintProduction(phoneNumber, description, session) {
  return await withWriteConnection(async (prisma) => {
    try {      console.log(`📝 [PRODUCTION] إنشاء شكوى للرقم: ${phoneNumber}`);
      console.log(`📄 الوصف: ${description}`);
      console.log(`📋 Session كاملة:`, JSON.stringify(session, null, 2));
      console.log(`📋 Session.data:`, JSON.stringify(session?.data, null, 2));
      console.log(`📋 Session.data.category:`, session?.data?.category);
      
      // البحث عن العميل
      const clientData = await findClientWithPropertyProduction(phoneNumber);
      
      if (!clientData.success || !clientData.client) {
        console.error('❌ فشل في العثور على العميل:', clientData.message);
        return {
          success: false,
          message: 'لم يتم العثور على العميل. يرجى التأكد من رقم الهاتف.',
          data: null,
          error: 'CLIENT_NOT_FOUND',
          debug: clientData.debug
        };
      }
      
      const { client, property, unit } = clientData;
      
      // تحضير البيانات مع التحقق من الصحة
      const complaintData = {
        clientId: client.id,
        propertyId: property?.id || null,
        unitId: unit?.id || null,
        description: description,
        type: 'OTHER', // قيمة افتراضية آمنة
        priority: 'MEDIUM', // قيمة افتراضية آمنة
        status: 'PENDING'
      };
        // تحديث القيم من الجلسة إذا كانت متوفرة وصحيحة
      if (session?.data?.category) {
        // إنشاء مطابقة بين القيم lowercase والـ enum UPPERCASE
        const categoryMapping = {
          'property_issue': 'PROPERTY_ISSUE',
          'rent_issue': 'RENT_ISSUE',
          'neighbor_issue': 'NEIGHBOR_ISSUE',
          'maintenance_issue': 'MAINTENANCE_ISSUE',
          'noise_issue': 'NOISE_ISSUE',
          'security_issue': 'SECURITY_ISSUE',
          'payment_issue': 'PAYMENT_ISSUE',
          'service_quality': 'SERVICE_QUALITY',
          'other_complaint': 'OTHER',
          'other': 'OTHER'
        };
        
        const inputCategory = session.data.category.toLowerCase();
        const mappedCategory = categoryMapping[inputCategory];
        
        console.log(`📝 نوع الشكوى المرسل: ${session.data.category}`);
        console.log(`📝 نوع الشكوى بعد التطبيع: ${inputCategory}`);
        console.log(`📝 نوع الشكوى المطابق: ${mappedCategory}`);
        
        if (mappedCategory) {
          complaintData.type = mappedCategory;
        } else {
          console.log(`⚠️ نوع شكوى غير معروف: ${session.data.category}, استخدام OTHER`);
          complaintData.type = 'OTHER';
        }
      }
      
      if (session?.data?.priority) {
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        if (validPriorities.includes(session.data.priority.toUpperCase())) {
          complaintData.priority = session.data.priority.toUpperCase();
        }
      }
        console.log(`📊 بيانات الشكوى النهائية:`, complaintData);
      
      // توليد display ID مخصص
      const displayId = await generateComplaintDisplayId();
      complaintData.displayId = displayId;
      console.log(`📝 Display ID للشكوى: ${displayId}`);
      
      // إنشاء الشكوى
      const complaint = await prisma.complaint.create({
        data: complaintData,
        include: {
          client: true,
          property: true,
          unit: true
        }
      });console.log(`✅ تم إنشاء الشكوى بنجاح: ${complaint.id}`);
      
      // إرسال الإشعارات الموثوقة لخدمة العملاء
      try {
        console.log(`📤 إرسال إشعارات الشكوى #${complaint.id}...`);        const notificationResult = await sendComplaintNotifications({
          complaintId: complaint.id,
          displayId: complaint.displayId,
          clientName: client.name,
          clientPhone: phoneNumber,
          complaintType: complaint.type,
          priority: complaint.priority,
          description: description,
          propertyName: property?.name || 'غير محدد',
          unitNumber: unit?.number || unit?.unitId || `الطابق ${unit?.floor || 'غير محدد'}` || 'غير محدد'
        });
        
        console.log(`📤 نتيجة إرسال الإشعارات:`, notificationResult);
        
        if (notificationResult.success) {
          console.log(`✅ تم إرسال جميع الإشعارات بنجاح (${notificationResult.successCount}/${notificationResult.totalCount})`);
        } else {
          console.log(`⚠️ فشل في إرسال بعض الإشعارات (${notificationResult.successCount}/${notificationResult.totalCount})`);
        }
        
      } catch (notificationError) {
        console.error(`❌ خطأ في إرسال الإشعارات:`, notificationError);
        // لا نوقف العملية حتى لو فشلت الإشعارات
      }
      
      return {
        success: true,
        message: 'تم إنشاء الشكوى بنجاح',
        data: {
          complaint: complaint,
          client: client,
          property: property,
          unit: unit
        }
      };
      
    } catch (error) {
      console.error('❌ خطأ في إنشاء الشكوى:', error);
      console.error('📋 تفاصيل الخطأ الكاملة:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        phoneNumber: phoneNumber,
        session: session
      });
      
      return {
        success: false,
        message: 'حدث خطأ أثناء إنشاء الشكوى',
        data: null,
        error: error.message
      };
    }
  });
}

/**
 * إنشاء رسالة نجاح لطلب الصيانة
 */
export function createMaintenanceSuccessMessage(data) {
  const { request, client, property, unit } = data;
  
  let message = `✅ تم تقديم طلب الصيانة بنجاح!\n`;
  message += `📋 رقم الطلب: #${request.id}\n`;
  message += `👤 العميل: ${client.name}\n`;
  
  if (request.type) {
    message += `🔧 نوع الصيانة: ${request.type}\n`;
  }
  
  if (request.priority) {
    message += `📶 الأولوية: ${request.priority}\n`;
  }
  
  if (property) {
    message += `🏠 العقار: ${property.name}\n`;
  }
  
  if (unit) {
    message += `🏢 الوحدة: ${unit.number}\n`;
  }
  
  if (request.description) {
    message += `📝 الوصف: ${request.description}\n`;
  }
  
  message += `⏰ سيقوم فريق الصيانة بمراجعة طلبك والتواصل معك وفقاً لأولوية الطلب.`;
  
  return message;
}

/**
 * إنشاء رسالة نجاح للشكوى
 */
export function createComplaintSuccessMessage(data) {
  const { complaint, client, property, unit } = data;
  
  let message = `✅ تم تقديم الشكوى بنجاح!\n`;
  message += `📋 رقم الشكوى: #${complaint.id}\n`;
  message += `👤 العميل: ${client.name}\n`;
  
  if (complaint.type) {
    message += `📝 نوع الشكوى: ${complaint.type}\n`;
  }
  
  if (property) {
    message += `🏠 العقار: ${property.name}\n`;
  }
  
  if (unit) {
    message += `🏢 الوحدة: ${unit.number}\n`;
  }
  
  if (complaint.description) {
    message += `📄 الوصف: ${complaint.description}\n`;
  }
  
  message += `⏰ سيقوم فريق خدمة العملاء بمراجعة شكواك والرد عليك قريباً.`;
  
  return message;
}

/**
 * إنشاء رسالة معلومات العميل
 */
export function createClientStatusMessage(data) {
  const { client, property, unit, openMaintenanceRequests, openComplaints, hasActiveRental } = data;
  
  let message = `👤 معلومات العميل:\n`;
  message += `📛 الاسم: ${client.name}\n`;
  message += `📞 الهاتف: ${client.phone}\n`;
  
  if (hasActiveRental && property && unit) {
    message += `🏠 العقار: ${property.name}\n`;
    message += `🏢 الوحدة: ${unit.number}\n`;
  } else {
    message += `⚠️ لا توجد عقود إيجار نشطة\n`;
  }
  
  message += `🔧 طلبات الصيانة المفتوحة: ${openMaintenanceRequests}\n`;
  message += `📝 الشكاوى المفتوحة: ${openComplaints}`;
  
  return message;
}

/**
 * الحصول على تاريخ الطلبات للعميل
 */
export async function getClientRequestHistory(phoneNumber, limit = 10) {
  return await withReadOnlyConnection(async (prisma) => {
    try {
      // البحث عن العميل
      const clientData = await findClientWithPropertyProduction(phoneNumber);
      
      if (!clientData.success || !clientData.client) {
        return {
          success: false,
          message: 'لم يتم العثور على العميل',
          data: null
        };
      }

      const client = clientData.client;

      // البحث عن طلبات الصيانة
      const maintenanceRequests = await prisma.maintenanceRequest.findMany({
        where: { clientId: client.id },
        include: {
          property: true,
          unit: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      // البحث عن الشكاوى
      const complaints = await prisma.complaint.findMany({
        where: { clientId: client.id },
        include: {
          property: true,
          unit: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return {
        success: true,
        message: 'تم جلب تاريخ الطلبات بنجاح',
        data: {
          client: client,
          maintenanceRequests: maintenanceRequests,
          complaints: complaints,
          totalMaintenanceRequests: maintenanceRequests.length,
          totalComplaints: complaints.length,
          totalRequests: maintenanceRequests.length + complaints.length
        }
      };

    } catch (error) {
      console.error('خطأ في جلب تاريخ الطلبات:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء جلب تاريخ الطلبات',
        data: null,
        error: error.message
      };
    }
  });
}

/**
 * فحص حالة العميل (طلبات مفتوحة، معلومات العقار، إلخ)
 */
export async function checkClientStatus(phoneNumber) {
  return await withReadOnlyConnection(async (prisma) => {
    try {
      // البحث عن العميل
      const clientData = await findClientWithPropertyProduction(phoneNumber);
      
      if (!clientData.success || !clientData.client) {
        return {
          success: false,
          message: 'لم يتم العثور على العميل',
          data: null
        };
      }

      const { client, property, unit, rentAgreements } = clientData;

      // البحث عن الطلبات المفتوحة
      const openMaintenanceRequests = await prisma.maintenanceRequest.count({
        where: {
          clientId: client.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      });      const openComplaints = await prisma.complaint.count({
        where: {
          clientId: client.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] } // استخدام نفس القيم للشكاوى
        }
      });

      return {
        success: true,
        message: 'تم جلب حالة العميل بنجاح',
        data: {
          client: {
            id: client.id,
            name: client.name,
            phone: client.phone,
            email: client.email
          },
          property: property ? {
            id: property.id,
            name: property.name
          } : null,
          unit: unit ? {
            id: unit.id,
            number: unit.number
          } : null,
          activeRentAgreements: rentAgreements?.length || 0,
          openMaintenanceRequests: openMaintenanceRequests,
          openComplaints: openComplaints,
          hasActiveRental: !!property && !!unit
        }
      };

    } catch (error) {
      console.error('خطأ في فحص حالة العميل:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء فحص حالة العميل',
        data: null,
        error: error.message
      };
    }
  });
}

// توفير التوافق مع الدوال القديمة
export const findClientWithProperty = findClientWithPropertyProduction;
export const createMaintenanceRequestWithProperty = createMaintenanceRequestProduction;
export const createComplaintWithProperty = createComplaintProduction;

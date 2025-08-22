// Enhanced request handler for WhatsApp Bot
// Handles maintenance requests and complaints with client lookup by phone number

import { withWriteConnection, withReadOnlyConnection } from '@/lib/database-connection';

/**
 * البحث عن العميل باستخدام رقم الهاتف والحصول على معلومات العقار والوحدة
 */
export async function findClientWithProperty(phoneNumber) {
  return await withReadOnlyConnection(async (prisma) => {
    try {
      console.log(`🔍 البحث عن العميل باستخدام الرقم: ${phoneNumber}`);
      
      // تنظيف رقم الهاتف وإنشاء الصيغ المختلفة
      const clean = phoneNumber.replace(/^\+/, '').replace(/^971/, '').replace(/^0/, '');
      
      const variants = [
        phoneNumber,           // Original
        `+971${clean}`,        // +971xxxxxxxx
        `971${clean}`,         // 971xxxxxxxx
        `0${clean}`,           // 0xxxxxxxx
        clean,                 // xxxxxxxx
        `+9710${clean}`,       // +9710xxxxxxxx
        `9710${clean}`         // 9710xxxxxxxx
      ];
      
      console.log(`🔍 البحث عن العميل باستخدام الأرقام:`, variants);
      
      // البحث عن العميل مع معلومات العقار والوحدة
      const client = await prisma.client.findFirst({
        where: {
          phone: {
            in: variants
          }
        }
      });

      if (!client) {
        console.log(`❌ لم يتم العثور على العميل بالرقم: ${phoneNumber}`);
        console.log(`🔍 محاولة البحث العامة...`);
        
        // محاولة بحث أوسع
        const allClients = await prisma.client.findMany({
          where: {
            OR: [
              { phone: { contains: clean.slice(-4) } }, // آخر 4 أرقام
              { phone: { contains: phoneNumber } },
              { phone: { contains: clean } }
            ]
          },
          take: 5
        });
        
        console.log(`🔍 نتائج البحث العامة:`, allClients.map(c => `${c.name}: ${c.phone}`));
        
        return {
          success: false,
          message: 'لم يتم العثور على العميل بهذا الرقم',
          client: null,
          property: null,
          unit: null
        };
      }

      console.log(`✅ تم العثور على العميل: ${client.name} (ID: ${client.id})`);

      // البحث عن عقود الإيجار النشطة للعميل
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

      if (rentAgreements.length === 0) {
        console.log('⚠️ لا توجد عقود إيجار نشطة للعميل');
        return {
          success: true,
          message: 'تم العثور على العميل لكن لا توجد عقود إيجار نشطة',
          client: client,
          property: null,
          unit: null,
          rentAgreements: []
        };
      }

      // استخدام أول عقد إيجار نشط
      const mainAgreement = rentAgreements[0];
      const property = mainAgreement.unit.property;
      const unit = mainAgreement.unit;

      console.log(`🏠 العقار: ${property.name}, الوحدة: ${unit.number}`);

      return {
        success: true,
        message: 'تم العثور على العميل والعقار والوحدة بنجاح',
        client: client,
        property: property,
        unit: unit,
        rentAgreements: rentAgreements
      };    } catch (error) {
      console.error('❌ خطأ في البحث عن العميل:', error);
      console.error('📋 تفاصيل الخطأ:', {
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
 * إنشاء طلب صيانة جديد مع معلومات العقار والوحدة
 */
export async function createMaintenanceRequestWithProperty(phoneNumber, description, session) {
  return await withWriteConnection(async (prisma) => {
    try {
      console.log(`🔧 إنشاء طلب صيانة للرقم: ${phoneNumber}`);
      console.log(`📝 الوصف: ${description}`);
      console.log(`📋 Session data:`, session?.data);
      
      // البحث عن العميل والعقار
      const clientData = await findClientWithProperty(phoneNumber);
      
      if (!clientData.success || !clientData.client) {
        console.error('❌ فشل في العثور على العميل:', clientData.message);
        return {
          success: false,
          message: 'لم يتم العثور على العميل. يرجى التأكد من رقم الهاتف.',
          data: null,
          error: 'CLIENT_NOT_FOUND'
        };
      }

      const { client, property, unit } = clientData;
      
      console.log(`✅ تم العثور على العميل: ${client.name}`);
      console.log(`🏠 العقار: ${property ? property.name : 'لا يوجد'}`);
      console.log(`🏢 الوحدة: ${unit ? unit.number : 'لا يوجد'}`);      // تحضير البيانات للإنشاء
      const requestData = {
        clientId: client.id,
        propertyId: property?.id || null,
        unitId: unit?.id || null,
        description: description,
        priority: session?.data?.priority || 'MEDIUM',
        type: session?.data?.maintenanceType || 'electrical',
        status: 'PENDING'
      };
      
      console.log(`📊 بيانات طلب الصيانة للإنشاء:`, requestData);
      
      // التحقق من قيم enum
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
      
      if (!validPriorities.includes(requestData.priority)) {
        console.log(`⚠️ أولوية غير صالحة: ${requestData.priority}, استخدام MEDIUM`);
        requestData.priority = 'MEDIUM';
      }
      
      if (!validStatuses.includes(requestData.status)) {
        console.log(`⚠️ حالة غير صالحة: ${requestData.status}, استخدام PENDING`);
        requestData.status = 'PENDING';
      }

      // إنشاء طلب الصيانة
      const maintenanceRequest = await prisma.maintenanceRequest.create({
        data: requestData,
        include: {
          client: true,
          property: true,
          unit: true
        }
      });

      console.log(`✅ تم إنشاء طلب الصيانة بنجاح: ${maintenanceRequest.id}`);

      return {
        success: true,
        message: 'تم إنشاء طلب الصيانة بنجاح',
        data: {
          request: maintenanceRequest,
          client: client,
          property: property,
          unit: unit
        }
      };    } catch (error) {
      console.error('❌ خطأ في إنشاء طلب الصيانة:', error);
      console.error('📋 تفاصيل الخطأ:', {
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
 * إنشاء شكوى جديدة مع معلومات العقار والوحدة
 */
export async function createComplaintWithProperty(phoneNumber, description, session) {
  return await withWriteConnection(async (prisma) => {
    try {
      console.log(`📝 إنشاء شكوى للرقم: ${phoneNumber}`);
      console.log(`📄 الوصف: ${description}`);
      console.log(`📋 Session data:`, session?.data);
      
      // البحث عن العميل والعقار
      const clientData = await findClientWithProperty(phoneNumber);
      
      if (!clientData.success || !clientData.client) {
        console.error('❌ فشل في العثور على العميل:', clientData.message);
        return {
          success: false,
          message: 'لم يتم العثور على العميل. يرجى التأكد من رقم الهاتف.',
          data: null,
          error: 'CLIENT_NOT_FOUND'
        };
      }

      const { client, property, unit } = clientData;
      
      console.log(`✅ تم العثور على العميل: ${client.name}`);
      console.log(`🏠 العقار: ${property ? property.name : 'لا يوجد'}`);
      console.log(`🏢 الوحدة: ${unit ? unit.number : 'لا يوجد'}`);      // تحضير البيانات للإنشاء
      const complaintData = {
        clientId: client.id,
        propertyId: property?.id || null,
        unitId: unit?.id || null,
        description: description,
        type: session?.data?.category || 'OTHER',
        status: 'PENDING',
        priority: session?.data?.priority || 'MEDIUM'
      };
      
      console.log(`📊 بيانات الشكوى للإنشاء:`, complaintData);
      
      // التحقق من قيم enum
      const validTypes = ['PROPERTY_ISSUE', 'RENT_ISSUE', 'NEIGHBOR_ISSUE', 'MAINTENANCE_ISSUE', 'NOISE_ISSUE', 'SECURITY_ISSUE', 'PAYMENT_ISSUE', 'SERVICE_QUALITY', 'OTHER'];
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
      
      if (!validTypes.includes(complaintData.type)) {
        console.log(`⚠️ نوع شكوى غير صالح: ${complaintData.type}, استخدام OTHER`);
        complaintData.type = 'OTHER';
      }
      
      if (!validPriorities.includes(complaintData.priority)) {
        console.log(`⚠️ أولوية غير صالحة: ${complaintData.priority}, استخدام MEDIUM`);
        complaintData.priority = 'MEDIUM';
      }
      
      if (!validStatuses.includes(complaintData.status)) {
        console.log(`⚠️ حالة غير صالحة: ${complaintData.status}, استخدام PENDING`);
        complaintData.status = 'PENDING';
      }

      // إنشاء الشكوى
      const complaint = await prisma.complaint.create({
        data: complaintData,
        include: {
          client: true,
          property: true,
          unit: true
        }
      });

      console.log(`✅ تم إنشاء الشكوى بنجاح: ${complaint.id}`);

      return {
        success: true,
        message: 'تم إنشاء الشكوى بنجاح',
        data: {
          complaint: complaint,
          client: client,
          property: property,
          unit: unit
        }
      };    } catch (error) {
      console.error('❌ خطأ في إنشاء الشكوى:', error);
      console.error('📋 تفاصيل الخطأ:', {
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
 * الحصول على تاريخ الطلبات للعميل
 */
export async function getClientRequestHistory(phoneNumber, limit = 10) {
  return await withReadOnlyConnection(async (prisma) => {
    try {
      // البحث عن العميل
      const clientData = await findClientWithProperty(phoneNumber);
      
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
      });      return {
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
      const clientData = await findClientWithProperty(phoneNumber);
      
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
      });

      const openComplaints = await prisma.complaint.count({
        where: {
          clientId: client.id,
          status: { in: ['PENDING', 'REVIEWING'] }
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

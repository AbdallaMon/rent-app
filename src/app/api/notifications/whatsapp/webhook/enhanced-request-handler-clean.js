// Enhanced request handler for WhatsApp Bot
// Handles maintenance requests and complaints with client lookup by phone number

const { PrismaClient } = require('../../../../../../generated/client');
const prisma = new PrismaClient();

/**
 * البحث عن العميل باستخدام رقم الهاتف والحصول على معلومات العقار والوحدة
 */
async function findClientWithProperty(phoneNumber) {
  try {
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
    };

  } catch (error) {
    console.error('خطأ في البحث عن العميل:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء البحث عن العميل',
      client: null,
      property: null,
      unit: null,
      error: error.message
    };
  }
}

/**
 * إنشاء طلب صيانة جديد مع معلومات العقار والوحدة
 */
async function createMaintenanceRequestWithProperty(phoneNumber, description, session) {
  try {
    // البحث عن العميل والعقار
    const clientData = await findClientWithProperty(phoneNumber);
    
    if (!clientData.success || !clientData.client) {
      return {
        success: false,
        message: 'لم يتم العثور على العميل. يرجى التأكد من رقم الهاتف.',
        data: null
      };
    }

    const { client, property, unit } = clientData;

    // إنشاء طلب الصيانة
    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        clientId: client.id,
        propertyId: property?.id,
        unitId: unit?.id,
        description: description,
        requestDate: new Date(),
        priority: session?.priority || 'MEDIUM',
        type: session?.maintenanceType || 'GENERAL',
        status: 'PENDING'
      },
      include: {
        client: true,
        property: true,
        unit: true
      }
    });

    console.log(`✅ تم إنشاء طلب الصيانة: ${maintenanceRequest.id}`);

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
    console.error('خطأ في إنشاء طلب الصيانة:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء إنشاء طلب الصيانة',
      data: null,
      error: error.message
    };
  }
}

/**
 * إنشاء شكوى جديدة مع معلومات العقار والوحدة
 */
async function createComplaintWithProperty(phoneNumber, description, session) {
  try {
    // البحث عن العميل والعقار
    const clientData = await findClientWithProperty(phoneNumber);
    
    if (!clientData.success || !clientData.client) {
      return {
        success: false,
        message: 'لم يتم العثور على العميل. يرجى التأكد من رقم الهاتف.',
        data: null
      };
    }

    const { client, property, unit } = clientData;

    // إنشاء الشكوى
    const complaint = await prisma.complaint.create({
      data: {
        clientId: client.id,
        propertyId: property?.id,
        unitId: unit?.id,
        description: description,
        type: session?.complaintType || 'GENERAL',
        status: 'PENDING',
        priority: session?.priority || 'MEDIUM'
      },
      include: {
        client: true,
        property: true,
        unit: true
      }
    });

    console.log(`✅ تم إنشاء الشكوى: ${complaint.id}`);

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
    console.error('خطأ في إنشاء الشكوى:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء إنشاء الشكوى',
      data: null,
      error: error.message
    };
  }
}

/**
 * الحصول على تاريخ الطلبات للعميل
 */
async function getClientRequestHistory(phoneNumber, limit = 10) {
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
    });

    return {
      success: true,
      message: 'تم جلب تاريخ الطلبات بنجاح',
      data: {
        client: client,
        maintenanceRequests: maintenanceRequests,
        complaints: complaints,
        totalMaintenanceRequests: maintenanceRequests.length,
        totalComplaints: complaints.length
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
}

/**
 * فحص حالة العميل (طلبات مفتوحة، معلومات العقار، إلخ)
 */
async function checkClientStatus(phoneNumber) {
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
}

/**
 * إنشاء رسالة نجاح لطلب الصيانة
 */
function createMaintenanceSuccessMessage(data) {
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
function createComplaintSuccessMessage(data) {
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
function createClientStatusMessage(data) {
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

// تصدير الدوال
module.exports = {
  findClientWithProperty,
  createMaintenanceRequestWithProperty,
  createComplaintWithProperty,
  getClientRequestHistory,
  checkClientStatus,
  createMaintenanceSuccessMessage,
  createComplaintSuccessMessage,
  createClientStatusMessage
};

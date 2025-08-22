// إعدادات أرقام موظفي الشركة
// Company Staff Phone Numbers Configuration

export const STAFF_PHONE_NUMBERS = {
  // رقم الفني المسؤول عن طلبات الصيانة
  TECHNICIAN: process.env.TECHNICIAN_WHATSAPP || '0506677779',
  
  // رقم موظف العلاقات العامة المسؤول عن الشكاوى والمتابعة
  PUBLIC_RELATIONS: process.env.PUBLIC_RELATIONS_WHATSAPP || '0556677779',
  
  // رقم المدير للطوارئ العاجلة (اختياري)
  MANAGER: process.env.MANAGER_WHATSAPP || null,
  
  // رقم خدمة العملاء العام
  CUSTOMER_SERVICE: process.env.CUSTOMER_SERVICE_WHATSAPP || '0507935566'
};

// إعدادات الإشعارات
export const NOTIFICATION_SETTINGS = {
  // إرسال إشعارات طلبات الصيانة
  SEND_MAINTENANCE_NOTIFICATIONS: process.env.SEND_MAINTENANCE_NOTIFICATIONS !== 'false',
  
  // إرسال إشعارات الشكاوى
  SEND_COMPLAINT_NOTIFICATIONS: process.env.SEND_COMPLAINT_NOTIFICATIONS !== 'false',
  
  // إرسال إشعارات للمدير في الحالات العاجلة
  SEND_URGENT_TO_MANAGER: process.env.SEND_URGENT_TO_MANAGER === 'true',
  
  // تأخير الإرسال بالثواني (لتجنب spam)
  NOTIFICATION_DELAY: parseInt(process.env.NOTIFICATION_DELAY) || 1
};

// أولويات الإشعارات
export const PRIORITY_LEVELS = {
  URGENT: 'urgent',
  HIGH: 'high', 
  MEDIUM: 'medium',
  LOW: 'low'
};

// أنواع الطلبات التي تتطلب إشعار المدير فوراً
export const URGENT_REQUEST_TYPES = [
  'emergency',
  'security_issue',
  'structural',
  'urgent'
];

export default {
  STAFF_PHONE_NUMBERS,
  NOTIFICATION_SETTINGS,
  PRIORITY_LEVELS,
  URGENT_REQUEST_TYPES
};

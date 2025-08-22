// إعدادات أرقام الموظفين لنظام إشعارات WhatsApp
// تاريخ الإنشاء: 17 يونيو 2025

module.exports = {
  // رقم الفني المختص بالصيانة
  TECHNICIAN_PHONE: '0506677779',
  
  // رقم موظف العلاقات العامة
  PUBLIC_RELATIONS_PHONE: '0556677779',
    // إعدادات إضافية
  COMPANY_NAME: 'شركة تار العقارية',
  COMPANY_NAME_EN: 'Tar Real Estate',
  SUPPORT_HOURS: '24/7',
    // أرقام إضافية (اختيارية)
  EMERGENCY_PHONE: '+971507935566', // رقم الطوارئ
  MANAGER_PHONE: '', // رقم المدير (اختياري)
  
  // إعدادات الإشعارات
  NOTIFICATIONS_ENABLED: true,
  SEND_TO_TECHNICIAN: true,
  SEND_TO_PUBLIC_RELATIONS: true,
  
  // قوائم أنواع الصيانة والشكاوى
  MAINTENANCE_TYPES: {
    'plumbing': 'سباكة',
    'electrical': 'كهرباء',
    'air_conditioning': 'تكييف',
    'appliances': 'أجهزة',
    'general': 'صيانة عامة',
    'other': 'أخرى'
  },
  
  COMPLAINT_CATEGORIES: {
    'PROPERTY_ISSUE': 'مشكلة في العقار',
    'RENT_ISSUE': 'مشكلة في الإيجار',
    'NEIGHBOR_ISSUE': 'مشكلة مع الجيران',
    'MAINTENANCE_ISSUE': 'مشكلة في الصيانة',
    'NOISE_ISSUE': 'مشكلة ضوضاء',
    'SECURITY_ISSUE': 'مشكلة أمنية',
    'PAYMENT_ISSUE': 'مشكلة في الدفع',
    'SERVICE_QUALITY': 'جودة الخدمة',
    'OTHER': 'أخرى'
  }
};

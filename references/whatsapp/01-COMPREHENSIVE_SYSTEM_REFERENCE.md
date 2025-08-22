# 🚀 النظام الشامل للواتساب - المرجع الأساسي

## 📋 **معلومات النظام**
- **تاريخ الإنشاء:** 20 يونيو 2025
- **الإصدار:** v2.0 - الهيكل المنظم الجديد
- **الحالة:** ✅ مستقر وجاهز للإنتاج
- **آخر تحديث:** ${new Date().toLocaleDateString('ar-SA')}

---

## 🏗️ **الهيكل الكامل للنظام**

### **1. الهيكل الأساسي**
```
📁 src/
├── 📁 app/
│   ├── 📁 api/whatsapp/                    # 🔌 APIs الواتساب
│   │   ├── 📄 route.js                     # API موحد رئيسي
│   │   ├── 📁 webhook/                     # 🤖 البوت الرئيسي
│   │   │   └── 📄 route.js                 # معالج الرسائل الواردة
│   │   ├── 📁 reminders/                   # ⏰ إدارة التذكيرات
│   │   │   └── 📄 route.js                 # CRUD للتذكيرات
│   │   └── 📁 settings/                    # ⚙️ إعدادات النظام
│   │       └── 📄 route.js                 # إدارة الإعدادات
│   │
│   └── 📁 whatsapp/                        # 🖥️ واجهات المستخدم
│       ├── 📁 dashboard/                   # 🏠 لوحة التحكم
│       │   └── 📄 page.jsx                 # لوحة إدارة شاملة
│       ├── 📁 reminders/                   # ⏰ إدارة التذكيرات
│       │   └── 📄 page.jsx                 # واجهة التذكيرات
│       └── 📁 settings/                    # ⚙️ الإعدادات
│           └── 📄 page.jsx                 # واجهة الإعدادات
│
├── 📁 whatsapp/                            # 🧩 مكونات النظام
│   ├── 📁 components/                      # 🎨 مكونات الواجهة
│   │   ├── 📄 Reminders.jsx               # مكون التذكيرات
│   │   ├── 📄 Settings.jsx                # مكون الإعدادات
│   │   └── 📄 Dashboard.jsx               # مكون لوحة التحكم
│   ├── 📁 api/                            # 🔧 وظائف APIs
│   │   ├── 📁 webhook/                    # معالج البوت
│   │   ├── 📁 reminders/                  # وظائف التذكيرات
│   │   └── 📁 settings/                   # وظائف الإعدادات
│   ├── 📁 types/                          # 📝 تعريفات البيانات
│   │   └── 📄 whatsapp.types.js          # أنواع البيانات
│   └── 📁 utils/                          # 🛠️ أدوات مساعدة
│       ├── 📄 helpers.js                  # وظائف مساعدة
│       └── 📄 constants.js                # الثوابت
│
└── 📁 lib/                                # 📚 مكتبات النظام
    ├── 📄 whatsapp.js                     # مكتبة الواتساب الأساسية
    ├── 📄 whatsapp-auth.js                # مصادقة الواتساب
    └── 📄 database-connection.js          # اتصال قاعدة البيانات
```

---

## 🤖 **نظام البوت الشامل**

### **1. معالج الرسائل الواردة**
```javascript
// src/app/api/whatsapp/webhook/route.js
الوظائف الأساسية:
✅ استقبال الرسائل من الواتساب
✅ التحقق من صحة الرسائل (Webhook Verification)
✅ معالجة أنواع مختلفة من الرسائل:
   - رسائل نصية
   - رسائل تفاعلية (أزرار، قوائم)
   - رسائل الوسائط (صور، مستندات)
   - رسائل الموقع

✅ الردود التلقائية:
   - رسالة الترحيب
   - قائمة الخيارات الرئيسية
   - معلومات الشركة
   - ساعات العمل

✅ توجيه الطلبات:
   - طلبات الصيانة
   - الاستفسارات العامة
   - الشكاوى
   - طلبات المتابعة
```

### **2. أنواع الرسائل المدعومة**
```javascript
const MESSAGE_TYPES = {
  TEXT: 'text',           // رسائل نصية
  INTERACTIVE: 'interactive', // أزرار وقوائم
  BUTTON: 'button_reply',     // ردود الأزرار
  LIST: 'list_reply',         // اختيارات القائمة
  LOCATION: 'location',       // معلومات الموقع
  DOCUMENT: 'document',       // المستندات
  IMAGE: 'image',            // الصور
  AUDIO: 'audio',            // الملفات الصوتية
  VIDEO: 'video',            // مقاطع الفيديو
  CONTACTS: 'contacts'       // معلومات الاتصال
};
```

### **3. حالات المحادثة**
```javascript
const CONVERSATION_STATES = {
  WELCOME: 'welcome',              // رسالة الترحيب
  MAIN_MENU: 'main_menu',         // القائمة الرئيسية
  MAINTENANCE_REQUEST: 'maintenance', // طلب صيانة
  COMPLAINT: 'complaint',          // شكوى
  INQUIRY: 'inquiry',             // استفسار
  FOLLOW_UP: 'follow_up',         // متابعة
  CONTACT_INFO: 'contact_info',   // معلومات الاتصال
  WORKING_HOURS: 'working_hours', // ساعات العمل
  SERVICES: 'services',           // الخدمات
  COMPLETED: 'completed'          // تم الانتهاء
};
```

---

## ⏰ **نظام إدارة التذكيرات**

### **1. أنواع التذكيرات**
```javascript
const REMINDER_TYPES = {
  PAYMENT_REMINDER: {
    id: 'payment_reminder',
    name: 'تذكير دفع',
    description: 'تذكير بموعد دفع الإيجار أو الفواتير',
    priority: 'high',
    icon: '💰',
    template: 'payment_reminder_template'
  },
  
  CONTRACT_EXPIRY: {
    id: 'contract_expiry_reminder',
    name: 'تذكير انتهاء عقد',
    description: 'تذكير بانتهاء عقد الإيجار',
    priority: 'high',
    icon: '📄',
    template: 'contract_expiry_template'
  },
  
  MAINTENANCE_REMINDER: {
    id: 'maintenance_reminder',
    name: 'تذكير صيانة',
    description: 'تذكير بموعد الصيانة الدورية',
    priority: 'medium',
    icon: '🔧',
    template: 'maintenance_reminder_template'
  },
  
  INSPECTION_REMINDER: {
    id: 'inspection_reminder',
    name: 'تذكير معاينة',
    description: 'تذكير بموعد معاينة العقار',
    priority: 'medium',
    icon: '👁️',
    template: 'inspection_reminder_template'
  },
  
  CUSTOM_REMINDER: {
    id: 'custom_reminder',
    name: 'تذكير مخصص',
    description: 'تذكير قابل للتخصيص',
    priority: 'low',
    icon: '📅',
    template: 'custom_reminder_template'
  }
};
```

### **2. جدولة التذكيرات**
```javascript
const REMINDER_SCHEDULE = {
  IMMEDIATE: 'immediate',      // فوري
  DAILY: 'daily',             // يومي
  WEEKLY: 'weekly',           // أسبوعي
  MONTHLY: 'monthly',         // شهري
  QUARTERLY: 'quarterly',     // ربع سنوي
  YEARLY: 'yearly',           // سنوي
  CUSTOM: 'custom',           // مخصص
  
  // جدولة متقدمة
  BEFORE_DUE: {
    '1_day': 'قبل يوم واحد',
    '3_days': 'قبل 3 أيام',
    '1_week': 'قبل أسبوع',
    '2_weeks': 'قبل أسبوعين',
    '1_month': 'قبل شهر'
  }
};
```

### **3. حالات التذكيرات**
```javascript
const REMINDER_STATUS = {
  SCHEDULED: 'scheduled',      // مجدول
  SENT: 'sent',               // تم الإرسال
  DELIVERED: 'delivered',     // تم التسليم
  READ: 'read',               // تم القراءة
  REPLIED: 'replied',         // تم الرد
  FAILED: 'failed',           // فشل
  CANCELLED: 'cancelled',     // ملغي
  EXPIRED: 'expired'          // منتهي الصلاحية
};
```

---

## ⚙️ **نظام الإعدادات الشامل**

### **1. الإعدادات العامة**
```javascript
const GENERAL_SETTINGS = {
  system_name: 'نظام الواتساب - شركة تار العقارية',
  system_status: 'active', // active, maintenance, disabled
  auto_respond: true,
  business_hours: {
    start: '08:00',
    end: '18:00',
    timezone: 'Asia/Riyadh',
    working_days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
  },
  language: 'ar',
  currency: 'SAR',
  date_format: 'dd/mm/yyyy',
  number_format: 'ar-SA'
};
```

### **2. إعدادات الأمان**
```javascript
const SECURITY_SETTINGS = {
  api_key: process.env.WHATSAPP_API_KEY,
  webhook_secret: process.env.WHATSAPP_WEBHOOK_SECRET,
  phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID,
  access_token: process.env.WHATSAPP_ACCESS_TOKEN,
  enable_encryption: true,
  rate_limiting: {
    max_requests_per_minute: 100,
    max_requests_per_hour: 1000
  },
  allowed_domains: ['tar.com.sa'],
  ip_whitelist: []
};
```

### **3. إعدادات الرسائل**
```javascript
const MESSAGE_SETTINGS = {
  welcome_message: 'مرحباً بك في شركة تار العقارية 🏢\nكيف يمكنني مساعدتك اليوم؟',
  off_hours_message: 'نعتذر، نحن خارج أوقات العمل حالياً ⏰\nساعات العمل: الأحد - الخميس من 8 صباحاً حتى 6 مساءً',
  error_message: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى أو الاتصال بنا مباشرة.',
  maintenance_message: 'النظام تحت الصيانة حالياً 🔧\nسيعود قريباً.',
  
  templates: {
    main_menu: 'القائمة الرئيسية',
    contact_info: 'معلومات الاتصال',
    services: 'خدماتنا',
    maintenance_request: 'طلب صيانة',
    complaint: 'تقديم شكوى',
    follow_up: 'متابعة طلب'
  }
};
```

### **4. إعدادات الإشعارات**
```javascript
const NOTIFICATION_SETTINGS = {
  enable_reminders: true,
  enable_alerts: true,
  enable_reports: true,
  
  email_notifications: {
    enabled: true,
    admin_email: 'admin@tar.com.sa',
    notification_types: ['new_message', 'failed_delivery', 'system_error']
  },
  
  sms_notifications: {
    enabled: false,
    admin_phone: '+966xxxxxxxxx'
  },
  
  internal_notifications: {
    enabled: true,
    channels: ['dashboard', 'email']
  }
};
```

---

## 📊 **قاعدة البيانات والجداول**

### **1. جدول الرسائل**
```sql
CREATE TABLE whatsapp_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  message_type ENUM('text', 'interactive', 'button', 'list', 'location', 'document', 'image', 'audio', 'video') NOT NULL,
  content TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
  direction ENUM('inbound', 'outbound') NOT NULL,
  context JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **2. جدول التذكيرات**
```sql
CREATE TABLE whatsapp_reminders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('payment_reminder', 'contract_expiry_reminder', 'maintenance_reminder', 'inspection_reminder', 'custom_reminder') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(255),
  scheduled_date DATETIME NOT NULL,
  priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
  status ENUM('scheduled', 'sent', 'delivered', 'read', 'replied', 'failed', 'cancelled', 'expired') DEFAULT 'scheduled',
  recurring ENUM('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom') DEFAULT 'none',
  recurring_pattern JSON,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL
);
```

### **3. جدول الإعدادات**
```sql
CREATE TABLE whatsapp_settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  category ENUM('general', 'security', 'messages', 'notifications', 'templates') NOT NULL,
  setting_key VARCHAR(255) NOT NULL,
  setting_value TEXT,
  data_type ENUM('string', 'integer', 'boolean', 'json', 'array') DEFAULT 'string',
  description TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_category_key (category, setting_key)
);
```

### **4. جدول المحادثات**
```sql
CREATE TABLE whatsapp_conversations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone_number VARCHAR(20) NOT NULL,
  user_name VARCHAR(255),
  current_state ENUM('welcome', 'main_menu', 'maintenance', 'complaint', 'inquiry', 'follow_up', 'contact_info', 'working_hours', 'services', 'completed') DEFAULT 'welcome',
  context JSON,
  last_message_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔧 **APIs الأساسية**

### **1. API الواتساب الموحد**
```javascript
// GET /api/whatsapp
// معلومات عامة عن النظام
{
  "system": {
    "name": "نظام الواتساب - شركة تار العقارية",
    "version": "v2.0",
    "status": "active",
    "uptime": "99.9%"
  },
  "features": [
    "البوت التفاعلي",
    "إدارة التذكيرات",
    "إعدادات متقدمة",
    "تقارير شاملة"
  ],
  "endpoints": {
    "webhook": "/api/whatsapp/webhook",
    "reminders": "/api/whatsapp/reminders",
    "settings": "/api/whatsapp/settings"
  }
}
```

### **2. API البوت**
```javascript
// POST /api/whatsapp/webhook
// استقبال ومعالجة الرسائل
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "PHONE_NUMBER_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "966xxxxxxxxx",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "messages": [{
          "from": "966xxxxxxxxx",
          "id": "MESSAGE_ID",
          "timestamp": "TIMESTAMP",
          "text": { "body": "MESSAGE_BODY" },
          "type": "text"
        }]
      }
    }]
  }]
}
```

### **3. API التذكيرات**
```javascript
// GET /api/whatsapp/reminders
// عرض جميع التذكيرات
{
  "success": true,
  "data": {
    "reminders": [],
    "summary": {
      "total": 0,
      "byStatus": {
        "scheduled": 0,
        "sent": 0,
        "delivered": 0,
        "failed": 0
      },
      "byType": {
        "payment": 0,
        "contract": 0,
        "maintenance": 0
      }
    }
  }
}

// POST /api/whatsapp/reminders
// إنشاء تذكير جديد
{
  "type": "payment_reminder",
  "title": "تذكير دفع الإيجار",
  "message": "نذكركم بموعد دفع إيجار شهر...",
  "recipient_phone": "966xxxxxxxxx",
  "scheduled_date": "2025-06-25T10:00:00Z",
  "priority": "high"
}
```

### **4. API الإعدادات**
```javascript
// GET /api/whatsapp/settings
// عرض جميع الإعدادات
{
  "success": true,
  "settings": {
    "general": { ... },
    "security": { ... },
    "messages": { ... },
    "notifications": { ... }
  }
}

// POST /api/whatsapp/settings
// تحديث الإعدادات
{
  "category": "general",
  "settings": {
    "system_name": "نظام الواتساب الجديد",
    "auto_respond": true
  }
}
```

---

## 🎨 **واجهات المستخدم**

### **1. لوحة التحكم الرئيسية**
```javascript
// src/app/whatsapp/dashboard/page.jsx
المكونات:
✅ إحصائيات شاملة (الرسائل، التذكيرات، الحالة)
✅ الرسائل الحديثة
✅ التذكيرات القادمة
✅ حالة النظام
✅ رسوم بيانية للأداء
✅ أزرار الإجراءات السريعة
```

### **2. واجهة إدارة التذكيرات**
```javascript
// src/app/whatsapp/reminders/page.jsx
المكونات:
✅ جدول التذكيرات مع الفلترة والبحث
✅ إحصائيات التذكيرات
✅ نموذج إضافة تذكير جديد
✅ إدارة القوالب
✅ جدولة التذكيرات المتقدمة
✅ تقارير التذكيرات
```

### **3. واجهة الإعدادات**
```javascript
// src/app/whatsapp/settings/page.jsx
المكونات:
✅ إعدادات عامة
✅ إعدادات الأمان
✅ إعدادات الرسائل والقوالب
✅ إعدادات الإشعارات
✅ اختبار الاتصال
✅ تصدير/استيراد الإعدادات
```

---

## 🚦 **معايير الجودة والأمان**

### **1. معايير الأمان**
```javascript
const SECURITY_STANDARDS = {
  authentication: {
    webhook_verification: 'مطلوب',
    api_key_validation: 'مطلوب',
    rate_limiting: 'مفعل',
    ip_filtering: 'اختياري'
  },
  
  data_protection: {
    encryption_at_rest: 'مطلوب',
    encryption_in_transit: 'مطلوب',
    data_anonymization: 'مطلوب',
    gdpr_compliance: 'مطلوب'
  },
  
  logging: {
    audit_logs: 'مطلوب',
    error_tracking: 'مطلوب',
    performance_monitoring: 'مطلوب'
  }
};
```

### **2. معايير الأداء**
```javascript
const PERFORMANCE_STANDARDS = {
  response_time: {
    webhook_response: '< 3 ثوانٍ',
    api_response: '< 2 ثانية',
    ui_load_time: '< 5 ثوانٍ'
  },
  
  availability: {
    uptime: '> 99.5%',
    error_rate: '< 1%',
    message_delivery: '> 95%'
  },
  
  scalability: {
    concurrent_users: '> 100',
    messages_per_minute: '> 1000',
    storage_capacity: 'غير محدود'
  }
};
```

---

## 📋 **قائمة التحقق قبل أي تطوير**

### **✅ قبل إضافة ميزة جديدة:**
- [ ] مراجعة الهيكل الحالي
- [ ] التأكد من التوافق مع APIs الموجودة
- [ ] فحص تأثير التغيير على الأمان
- [ ] اختبار الأداء
- [ ] تحديث الوثائق

### **✅ قبل تعديل كود موجود:**
- [ ] عمل نسخة احتياطية
- [ ] مراجعة التبعيات
- [ ] اختبار في بيئة التطوير
- [ ] التأكد من عدم كسر الوظائف الموجودة
- [ ] تحديث الاختبارات

### **✅ قبل النشر:**
- [ ] اختبار شامل لجميع الوظائف
- [ ] مراجعة الأمان
- [ ] اختبار الأداء تحت الضغط
- [ ] التأكد من عمل النسخ الاحتياطية
- [ ] إعداد خطة الاستعادة

---

## 🎯 **الخلاصة**

هذا النظام الشامل يوفر:
- **🏗️ هيكل منظم ومرن** قابل للتوسع
- **🤖 بوت ذكي متقدم** مع إمكانيات تفاعلية
- **⏰ نظام تذكيرات متطور** مع جدولة متقدمة
- **⚙️ إعدادات شاملة** قابلة للتخصيص
- **🔒 أمان متقدم** مع مراقبة مستمرة
- **📊 مراقبة وتقارير** شاملة

**هذا المستند هو المرجع الأساسي** الذي يجب الرجوع إليه قبل أي تطوير أو تحسين لضمان الحفاظ على جودة النظام وتماسكه.

---

*آخر تحديث: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}*

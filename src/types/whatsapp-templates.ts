// ملف أنواع البيانات لقوالب الواتساب - الإصدار المحدث
// Types for WhatsApp Templates System - Updated Version

/**
 * أنواع اللغات المدعومة
 */
export type SupportedLanguage = 'ar_AE' | 'en';
export type LanguageCode = 'ar_AE' | 'en';
export type MessageDirection = 'rtl' | 'ltr';

/**
 * فئات القوالب
 */
export type TemplateCategory = 'contracts' | 'maintenance' | 'complaints' | 'support' | 'payments' | 'TRANSACTIONAL' | 'MARKETING' | 'UTILITY';

/**
 * حالات القوالب
 */
export type TemplateStatus = 'approved' | 'pending' | 'rejected' | 'disabled' | 'active' | 'defined';

/**
 * أنواع الرسائل التفاعلية
 */
export type InteractiveMessageType = 'list' | 'button';

/**
 * حالات الرسائل
 */
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

/**
 * أنواع مكونات القالب
 */
export type ComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';

/**
 * تنسيقات المكونات
 */
export type ComponentFormat = 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';

/**
 * واجهة مكون القالب
 */
export interface TemplateComponent {
  type: ComponentType;
  format?: ComponentFormat;
  text: string;
}

/**
 * واجهة تفاصيل القالب لكل لغة
 */
export interface TemplateLanguageDetails {
  template_name: string;
  status: TemplateStatus;
  components: {
    header?: string;
    body: string;
    footer?: string;
  };
}

/**
 * واجهة القالب الكامل
 */
export interface WhatsAppTemplate {
  purpose: string;
  purpose_en: string;
  category: TemplateCategory;
  variables_count: number;
  variables: Record<string, string>;
  languages: {
    ar_AE?: TemplateLanguageDetails;
    en?: TemplateLanguageDetails;
  };
  used_in_files: string[];
}

/**
 * واجهة الرسائل التفاعلية
 */
export interface InteractiveMessage {
  ar: string;
  en: string;
}

/**
 * واجهة خيارات القائمة التفاعلية
 */
export interface MenuOption {
  id: string;
  title: InteractiveMessage;
  description: InteractiveMessage;
}

/**
 * واجهة إعدادات اللغة
 */
export interface LanguageSettings {
  code: SupportedLanguage;
  direction: 'rtl' | 'ltr';
  date_format: string;
  template_mapping: Record<string, string>;
}

/**
 * واجهة متغيرات القالب
 */
export interface TemplateVariables {
  [key: string]: string;
}

/**
 * واجهة خيارات إرسال الرسالة
 */
export interface MessageOptions {
  language?: {
    code: SupportedLanguage;
  };
  preview_url?: boolean;
}

/**
 * واجهة استجابة إرسال الرسالة
 */
export interface WhatsAppResponse {
  messages?: Array<{
    id: string;
    message_status?: string;
  }>;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * واجهة بيانات الإشعار
 */
export interface NotificationData {
  renterName: string;
  renterEmail: string;
  renterPhone: string;
  unitNumber: string;
  propertyName: string;
  startDate: string;
  endDate: string;
  totalContractPrice: number;
  rentCollectionType: string;
}

/**
 * واجهة بيانات طلب الصيانة
 */
export interface MaintenanceRequestData {
  clientId: number;
  propertyId?: number;
  unitId?: number;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

/**
 * واجهة بيانات الشكوى
 */
export interface ComplaintData {
  clientId: number;
  propertyId?: number;
  unitId?: number;
  title?: string;
  description: string;
  category?: 'SERVICE' | 'PROPERTY' | 'BILLING' | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * واجهة رسالة الويب هوك الواردة
 */
export interface IncomingWebhookMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'image' | 'document';
  text?: {
    body: string;
  };
  interactive?: {
    type: 'list_reply' | 'button_reply';
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
    button_reply?: {
      id: string;
      title: string;
    };
  };
}

/**
 * واجهة بيانات الويب هوك
 */
export interface WebhookData {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: IncomingWebhookMessage[];
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
    }>;
  }>;
}

/**
 * دالة مساعدة لإنشاء متغيرات القالب
 */
export function createTemplateVariables(data: Record<string, any>): TemplateVariables {
  const variables: TemplateVariables = {};
  Object.keys(data).forEach((key, index) => {
    variables[(index + 1).toString()] = data[key]?.toString() || '';
  });
  return variables;
}

/**
 * دالة مساعدة للتحقق من صحة رقم الهاتف
 */
export function validatePhoneNumber(phone: string): boolean {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  // UAE: +971 + 9 digits, India: +91 + 10 digits
  return (
    (cleanPhone.startsWith('971') && cleanPhone.length === 12) ||
    (cleanPhone.startsWith('91') && cleanPhone.length === 12) ||
    cleanPhone.length >= 10
  );
}

/**
 * دالة مساعدة لتنسيق رقم الهاتف
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d]/g, '');
  
  if (!cleaned.startsWith('971') && !cleaned.startsWith('91')) {
    // افتراض UAE إذا لم يتم تحديد كود الدولة
    if (cleaned.startsWith('5') && cleaned.length === 9) {
      cleaned = '971' + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
  }
  
  return '+' + cleaned;
}

/**
 * أنواع ثوابت النظام
 */
export const TEMPLATE_CATEGORIES = {
  CONTRACTS: 'contracts',
  MAINTENANCE: 'maintenance', 
  COMPLAINTS: 'complaints',
  SUPPORT: 'support',
  PAYMENTS: 'payments'
} as const;

export const SUPPORTED_LANGUAGES = {
  ARABIC: 'ar_AE',
  ENGLISH: 'en'
} as const;

export const TEMPLATE_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
  DISABLED: 'disabled'
} as const;

/**
 * أسماء القوالب المعتمدة
 */
export const APPROVED_TEMPLATES = {
  RENT_AGREEMENT_AR: 'rent_agreement',
  RENT_AGREEMENT_EN: 'rent_agreement_en',
  MAINTENANCE_CONFIRMATION_AR: 'maintenance_confirmation_ar',
  MAINTENANCE_CONFIRMATION_EN: 'maintenance_confirmation_en',
  COMPLAINT_CONFIRMATION_AR: 'complaint_confirmation_ar',
  COMPLAINT_CONFIRMATION_EN: 'complaint_confirmation_en',
  SUPPORT_REQUEST_AR: 'support_request_ar',
  SUPPORT_REQUEST_EN: 'support_request_en',
  MAINTENANCE_STATUS_UPDATE: 'maintenance_status_update'
} as const;

/**
 * تصدير جميع الأنواع كنوع موحد
 */
export type TemplateNames = typeof APPROVED_TEMPLATES[keyof typeof APPROVED_TEMPLATES];

/**
 * متغيرات قالب عقد الإيجار
 */
export interface RentAgreementVariables {
  renterName: string;
  propertyName: string;
  unitNumber: string;
  startDate: string;
  endDate: string;
  totalContractPrice: string;
}

/**
 * بيانات قالب عقد الإيجار لاستدعاءات API
 */
export interface RentAgreementTemplateData {
  renterPhone: string;
  renterName: string;
  propertyName: string;
  unitNumber: string;
  startDate: string;
  endDate: string;
  totalContractPrice: number;
  renterId?: number;
  language?: string;
}

/**
 * متغيرات قالب طلب الصيانة
 */
export interface MaintenanceVariables {
  requestId: string;
  description: string;
}

/**
 * متغيرات تحديث حالة الصيانة
 */
export interface MaintenanceStatusVariables {
  requestId: string;
  newStatus: string;
}

/**
 * متغيرات قالب الشكوى
 */
export interface ComplaintVariables {
  complaintId: string;
  description: string;
}

/**
 * متغيرات قالب طلب الدعم
 */
export interface SupportVariables {
  clientName: string;
  clientId: string;
  clientPhone: string;
  propertyInfo: string;
}

/**
 * خيار الرسالة التفاعلية
 */
export interface InteractiveOption {
  id: string;
  title: string;
  description?: string;
}

/**
 * خيار تفاعلي متعدد اللغات
 */
export interface MultilingualOption {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
}

/**
 * رسالة القائمة التفاعلية
 */
export interface ListInteractiveMessage {
  type: 'list';
  header?: {
    type: 'text';
    text: string;
  };
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: {
    button: string;
    sections: Array<{
      title: string;
      rows: InteractiveOption[];
    }>;
  };
}

/**
 * رسالة الأزرار التفاعلية
 */
export interface ButtonInteractiveMessage {
  type: 'button';
  body: {
    text: string;
  };
  action: {
    buttons: Array<{
      type: 'reply';
      reply: {
        id: string;
        title: string;
      };
    }>;
  };
}

export type InteractiveMessageUnion = ListInteractiveMessage | ButtonInteractiveMessage;

/**
 * رسالة webhook الواتساب
 */
export interface WhatsAppWebhookMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'image' | 'document' | 'audio' | 'video';
  text?: {
    body: string;
  };
  interactive?: {
    type: 'list_reply' | 'button_reply';
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
    button_reply?: {
      id: string;
      title: string;
    };
  };
}

/**
 * نتيجة إرسال الرسالة
 */
export interface MessageSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  templateUsed?: string;
  language?: string;
}

/**
 * استجابة API الواتساب لإرسال الرسائل
 */
export interface WhatsAppSendResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

/**
 * أسماء القوالب المدعومة
 */
export type SupportedTemplateName = 
  | 'rent_agreement_creation'
  | 'rent_agreement_creation_en'
  | 'maintenance_confirmation_ar'
  | 'maintenance_confirmation_en'
  | 'maintenance_status_update'
  | 'complaint_confirmation_ar'
  | 'complaint_confirmation_en'
  | 'support_request_ar'
  | 'support_request_en'
  | 'maintenance_notification_ar'
  | 'maintenance_notification_en'
  | 'payment_confirmation_ar'
  | 'payment_confirmation_en';

/**
 * معرفات إجراءات الرسائل التفاعلية
 */
export type InteractiveActionId = 
  | 'select_arabic'
  | 'select_english'
  | 'submit_maintenance'
  | 'submit_complaint'
  | 'contact_support'
  | 'change_language'
  | `confirm_maintenance|${string}`
  | `confirm_complaint|${string}`;

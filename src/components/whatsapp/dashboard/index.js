/**
 * ملف التصدير الرئيسي لمكونات لوحة تحكم واتساب
 */

// المكون الرئيسي المحسن الجديد
export { default as EnhancedWhatsAppDashboard } from './EnhancedWhatsAppDashboard';

// المكون الرئيسي المحسن السابق
export { default as SimpleWhatsAppDashboard } from './SimpleWhatsAppDashboard-New';

// المكونات الفرعية
export { default as BotStatistics } from '@/components/BotStatistics';
export { default as SystemStatus } from '@/components/SystemStatus';
export { default as WhatsAppBotMessagesTable } from '@/components/WhatsAppBotMessagesTable';

// الهوكس
export { useBotStatus } from './hooks/useBotStatus';

// الوظائف المساعدة
export * from './utils/helpers';

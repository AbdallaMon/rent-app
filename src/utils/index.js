// Utility functions

// تنسيق التواريخ
export const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
};

// تنسيق الأرقام والعملة
export const formatCurrency = (amount) => {
  if (!amount) return '0';
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
  }).format(amount);
};

// تحقق من صحة البريد الإلكتروني
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// تحقق من صحة رقم الهاتف السعودي
export const isValidSaudiPhone = (phone) => {
  const phoneRegex = /^(05|5)[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

// تنظيف النصوص
export const cleanText = (text) => {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
};

// تحديد اتجاه النص
export const getTextDirection = (text) => {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text) ? 'rtl' : 'ltr';
};

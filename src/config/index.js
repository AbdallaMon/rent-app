// إعدادات التطبيق المشتركة

export const APP_CONFIG = {
  name: 'Tar Real Estate Company',
  version: '1.0.0',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
};

export const WHATSAPP_CONFIG = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessApiToken: process.env.WHATSAPP_BUSINESS_API_TOKEN,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
};

export const EMAIL_CONFIG = {
  username: process.env.EMAIL_USERNAME,
  password: process.env.EMAIL_PASSWORD,
};

export const UPLOAD_CONFIG = {
  secret: process.env.UPLOADTHING_SECRET,
  appId: process.env.UPLOADTHING_APP_ID,
};

export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  maxPageSize: 100,
};

export const DATE_FORMATS = {
  display: 'DD/MM/YYYY',
  api: 'YYYY-MM-DD',
  datetime: 'DD/MM/YYYY HH:mm',
};

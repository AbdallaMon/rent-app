/**
 * وظائف مساعدة للوحة تحكم واتساب
 */

/**
 * تنسيق التاريخ والوقت
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'غير محدد';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ar-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return 'تاريخ غير صحيح';
  }
};

/**
 * الحصول على لون الحالة
 */
export const getStatusColor = (status) => {
  if (status === true) return 'text-green-600';
  if (status === false) return 'text-red-600';
  return 'text-yellow-600';
};

/**
 * الحصول على نص الحالة
 */
export const getStatusText = (status) => {
  if (status === true) return 'نشط';
  if (status === false) return 'غير نشط';
  return 'جاري الفحص...';
};

/**
 * تنسيق أرقام الإحصائيات
 */
export const formatNumber = (num) => {
  if (num == null) return '0';
  return num.toLocaleString('ar-AE');
};

/**
 * معالجة أخطاء API
 */
export const handleApiError = (error, defaultMessage = 'حدث خطأ غير متوقع') => {
  console.error('API Error:', error);
  
  if (error.message === 'Failed to fetch') {
    return 'خطأ في الاتصال بالخادم';
  }
  
  if (error.status === 404) {
    return 'الصفحة غير موجودة';
  }
  
  if (error.status === 500) {
    return 'خطأ في الخادم';
  }
  
  return defaultMessage;
};

/**
 * التحقق من صحة البيانات
 */
export const validateData = (data) => {
  if (!data) return false;
  if (typeof data !== 'object') return false;
  return true;
};

/**
 * إنشاء معرف فريد
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * تحديث العنوان الفرعي للصفحة
 */
export const updatePageTitle = (title) => {
  if (typeof document !== 'undefined') {
    document.title = `${title} - لوحة تحكم واتساب - تار العقارية`;
  }
};

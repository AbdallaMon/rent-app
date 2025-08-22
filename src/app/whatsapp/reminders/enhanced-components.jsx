/**
 * 🔧 مكونات محسّنة لصفحة التذكيرات
 * تدعم البيانات الجديدة من جدول Payment
 */

// مكون حالة التذكير
export const ReminderStatusBadge = ({ status }) => {
  const statusConfig = {
    sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'مرسل' },
    delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'تم التسليم' },
    read: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'مقروء' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'فشل' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'في الانتظار' },
    scheduled: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'مجدول' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// مكون نوع التذكير
export const ReminderTypeBadge = ({ type }) => {
  const typeConfig = {
    payment_reminder: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'تذكير دفعة' },
    contract_expiry_reminder: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'انتهاء عقد' },
    maintenance_reminder: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'تذكير صيانة' },
    general_reminder: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'تذكير عام' },
    // إضافة المفاتيح المختصرة للتوافق
    payment: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'تذكير دفعة' },
    contract: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'انتهاء عقد' },
    maintenance: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'تذكير صيانة' }
  };

  const config = typeConfig[type] || typeConfig.general_reminder;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// مكون حالة الدفع
export const PaymentStatusBadge = ({ paymentStatus }) => {
  if (!paymentStatus) return null;
  
  const statusConfig = {
    'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'معلق', icon: '⏳' },
    'PAID': { bg: 'bg-green-100', text: 'text-green-800', label: 'مدفوع', icon: '✅' },
    'OVERDUE': { bg: 'bg-red-100', text: 'text-red-800', label: 'متأخر', icon: '🚨' }
  };

  const config = statusConfig[paymentStatus] || statusConfig.PENDING;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

// كارد إحصائيات الدفعات
export const PaymentStatsCard = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  const formatNumber = (number) => {
    if (typeof number !== 'number') return '0';
    return number.toLocaleString('en-US');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <span className="mr-2">💰</span>
        إحصائيات الدفعات
      </h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">
            {formatNumber(stats?.totalPendingPayments || 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">دفعات معلقة</div>
          <div className="text-xs text-yellow-700 mt-1">🔄 تحتاج متابعة</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(stats?.totalPaidPayments || 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">دفعات مدفوعة</div>
          <div className="text-xs text-green-700 mt-1">✅ مكتملة</div>
        </div>
        
        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">
            {formatNumber(stats?.overduePayments || 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">دفعات متأخرة</div>
          <div className="text-xs text-red-700 mt-1">🚨 عاجلة</div>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(stats?.upcomingPayments || 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">دفعات قادمة</div>
          <div className="text-xs text-blue-700 mt-1">📅 خلال 30 يوم</div>
        </div>
      </div>
    </div>
  );
};

// كارد إحصائيات العقود
export const ContractStatsCard = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  const formatNumber = (number) => {
    if (typeof number !== 'number') return '0';
    return number.toLocaleString('en-US');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <span className="mr-2">📋</span>
        إحصائيات العقود
      </h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(stats?.totalActiveContracts || 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">عقود نشطة</div>
          <div className="text-xs text-blue-700 mt-1">📈 قيد التشغيل</div>
        </div>
        
        <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">
            {formatNumber(stats?.expiringContracts || 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">عقود منتهية قريباً</div>
          <div className="text-xs text-orange-700 mt-1">⏰ خلال 30 يوم</div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">
            {formatNumber(stats?.contractReminders || 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">تذكيرات مرسلة</div>
          <div className="text-xs text-purple-700 mt-1">📤 إجمالي</div>
        </div>
      </div>
    </div>
  );
};

// كارد تذكير محسّن
export const EnhancedReminderCard = ({ reminder, onDetails }) => {
  const formatArabicDate = (date) => {
    if (!date) return 'غير محدد';
      try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'تاريخ غير صحيح';
    }  };

  const formatEnglishNumber = (number) => {
    if (typeof number !== 'number') return '0';
    return number.toLocaleString('en-US');
  };

  const getDaysUntilDueMessage = (daysUntilDue, dueDate) => {
    if (daysUntilDue === null || daysUntilDue === undefined) return null;
    
    if (daysUntilDue < 0) {
      return {
        text: `متأخر ${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? 'يوم' : 'أيام'}`,
        color: 'text-red-600',
        bg: 'bg-red-50',
        icon: '🚨'
      };
    } else if (daysUntilDue === 0) {
      return {
        text: 'مستحق اليوم',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        icon: '⏰'
      };
    } else if (daysUntilDue <= 3) {
      return {
        text: `خلال ${daysUntilDue} ${daysUntilDue === 1 ? 'يوم' : 'أيام'}`,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        icon: '⚠️'
      };
    } else {
      return {
        text: `خلال ${daysUntilDue} ${daysUntilDue === 1 ? 'يوم' : 'أيام'}`,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        icon: '📅'
      };
    }
  };

  const urgencyInfo = getDaysUntilDueMessage(reminder.daysUntilDue, reminder.dueDate);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* رأس التذكير */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2 space-x-reverse">
          <ReminderTypeBadge type={reminder.messageType} />
          <ReminderStatusBadge status={reminder.status} />
          {reminder.paymentStatus && (
            <PaymentStatusBadge paymentStatus={reminder.paymentStatus} />
          )}
        </div>
        <span className="text-xs text-gray-500">
          {formatArabicDate(reminder.sentAt)}
        </span>
      </div>

      {/* معلومات العميل */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">العميل:</span>
          <span className="text-sm text-gray-900 font-medium">
            {reminder.clientName || reminder.client?.name || 'غير محدد'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">الهاتف:</span>
          <span className="text-sm text-gray-900 font-mono" dir="ltr">
            {reminder.recipient}
          </span>
        </div>
      </div>

      {/* معلومات الدفعة (للتذكيرات المالية) */}
      {reminder.messageType === 'payment_reminder' && (
        <div className="border-t pt-3 space-y-2">
          {reminder.amount && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">المبلغ:</span>              <span className="text-sm text-gray-900 font-bold text-green-600">
                {formatEnglishNumber(reminder.amount)} د.إ
              </span>
            </div>
          )}
          
          {reminder.dueDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">تاريخ الاستحقاق:</span>
              <span className="text-sm text-gray-900">
                {formatArabicDate(reminder.dueDate)}
              </span>
            </div>
          )}
          
          {urgencyInfo && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">الحالة:</span>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${urgencyInfo.bg} ${urgencyInfo.color}`}>
                <span className="mr-1">{urgencyInfo.icon}</span>
                {urgencyInfo.text}
              </span>
            </div>
          )}
          
          {reminder.contractNumber && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">رقم العقد:</span>
              <span className="text-sm text-gray-900 font-mono">
                {reminder.contractNumber}
              </span>
            </div>
          )}
          
          {reminder.propertyName && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">العقار:</span>
              <span className="text-sm text-gray-900">
                {reminder.propertyName}
                {reminder.unitNumber && ` - وحدة ${reminder.unitNumber}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* أزرار العمليات */}
      <div className="flex justify-end mt-4 pt-3 border-t">
        <button
          onClick={() => onDetails(reminder)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          عرض التفاصيل
        </button>
      </div>
    </div>
  );
};

// فلتر حالة الدفع
export const PaymentStatusFilter = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="all">جميع حالات الدفع</option>
      <option value="PENDING">معلق</option>
      <option value="PAID">مدفوع</option>
      <option value="OVERDUE">متأخر</option>
    </select>
  );
};

// البحث المحسّن
export const enhancedSearchReminders = (reminders, searchTerm, paymentStatusFilter) => {
  if (!reminders) return [];
  
  let filteredReminders = reminders;
  
  // فلترة حسب حالة الدفع
  if (paymentStatusFilter !== 'all') {
    filteredReminders = filteredReminders.filter(reminder => 
      reminder.paymentStatus === paymentStatusFilter
    );
  }
  
  // البحث النصي
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredReminders = filteredReminders.filter(reminder => 
      reminder.clientName?.toLowerCase().includes(term) ||
      reminder.client?.name?.toLowerCase().includes(term) ||
      reminder.recipient?.includes(term) ||
      reminder.contractNumber?.toLowerCase().includes(term) ||
      reminder.propertyName?.toLowerCase().includes(term) ||
      reminder.amount?.toString().includes(term) ||
      reminder.metadata?.renterName?.toLowerCase().includes(term)
    );
  }
  
  return filteredReminders;
};

// مكون التذكيرات المجدولة
export const ScheduledRemindersSection = ({ scheduledStats, loading, onViewScheduled }) => {  const formatNumber = (number) => {
    if (typeof number !== 'number') return '0';
    return number.toLocaleString('en-US');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="p-4 bg-gray-100 rounded-lg">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <span className="mr-2">📅</span>
          التذكيرات المجدولة
        </h3>
        {onViewScheduled && (
          <button
            onClick={onViewScheduled}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            عرض جميع المجدولة
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xl font-bold text-blue-600">
            {formatNumber(scheduledStats?.tomorrow || 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">مجدولة للغد</div>
          <div className="text-xs text-blue-700 mt-1">📍 يوم واحد</div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-xl font-bold text-purple-600">
            {formatNumber(scheduledStats?.thisWeek || 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">مجدولة هذا الأسبوع</div>
          <div className="text-xs text-purple-700 mt-1">📅 7 أيام</div>
        </div>
      </div>
    </div>
  );
};

// Modal تفاصيل التذكير المحسّن
export const EnhancedReminderDetailsModal = ({ reminder, isOpen, onClose }) => {
  if (!isOpen || !reminder) return null;

  const formatArabicDate = (date) => {
    if (!date) return 'غير محدد';
    
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'تاريخ غير صحيح';
    }
  };
  const formatEnglishNumber = (number) => {
    if (typeof number !== 'number') return '0';
    return number.toLocaleString('en-US');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-900">تفاصيل التذكير</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
          {/* معلومات التذكير */}
          <div className="border-b pb-4">
            <h4 className="font-medium mb-3 text-gray-800">معلومات التذكير</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 block mb-1">نوع التذكير:</span>
                <ReminderTypeBadge type={reminder.messageType} />
              </div>
              <div>
                <span className="text-sm text-gray-600 block mb-1">حالة الإرسال:</span>
                <ReminderStatusBadge status={reminder.status} />
              </div>
              <div>
                <span className="text-sm text-gray-600 block mb-1">تاريخ الإرسال:</span>
                <span className="text-sm font-medium">{formatArabicDate(reminder.sentAt)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 block mb-1">معرف الرسالة:</span>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {reminder.messageId || 'غير محدد'}
                </span>
              </div>
            </div>
          </div>
          
          {/* معلومات الدفعة */}
          {reminder.messageType === 'payment_reminder' && reminder.paymentDetails && (
            <div className="border-b pb-4">
              <h4 className="font-medium mb-3 text-gray-800">معلومات الدفعة</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600 block mb-1">المبلغ:</span>                  <span className="text-lg font-bold text-green-600">
                    {formatEnglishNumber(reminder.amount)} د.إ
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 block mb-1">حالة الدفع:</span>
                  <PaymentStatusBadge paymentStatus={reminder.paymentStatus} />
                </div>
                <div>
                  <span className="text-sm text-gray-600 block mb-1">تاريخ الاستحقاق:</span>
                  <span className="text-sm font-medium">{formatArabicDate(reminder.dueDate)}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 block mb-1">رقم العقد:</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {reminder.contractNumber}
                  </span>
                </div>
                {reminder.propertyName && (
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600 block mb-1">العقار:</span>
                    <span className="text-sm font-medium">
                      {reminder.propertyName}
                      {reminder.unitNumber && ` - وحدة رقم ${reminder.unitNumber}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* معلومات العميل */}
          <div className="border-b pb-4">
            <h4 className="font-medium mb-3 text-gray-800">معلومات العميل</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 block mb-1">الاسم:</span>
                <span className="text-sm font-medium">
                  {reminder.clientName || reminder.client?.name || 'غير محدد'}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600 block mb-1">رقم الهاتف:</span>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded" dir="ltr">
                  {reminder.recipient}
                </span>
              </div>
              {reminder.client?.email && (
                <div>
                  <span className="text-sm text-gray-600 block mb-1">البريد الإلكتروني:</span>
                  <span className="text-sm font-medium">{reminder.client.email}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* معلومات إضافية من metadata */}
          {reminder.metadata && Object.keys(reminder.metadata).length > 0 && (
            <div>
              <h4 className="font-medium mb-3 text-gray-800">معلومات إضافية</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(reminder.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

// مكون موحد للإحصائيات (الدفعات والعقود)
export const PaymentStatistics = ({ statistics, className = '' }) => {
  if (!statistics) {
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
        <PaymentStatsCard loading={true} />
        <ContractStatsCard loading={true} />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      <PaymentStatsCard stats={statistics.payments} />
      <ContractStatsCard stats={statistics.contracts} />
    </div>
  );
};

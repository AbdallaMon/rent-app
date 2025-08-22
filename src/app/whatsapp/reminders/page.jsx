'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/ui/Cards/StatCard';
import RefreshButton from '@/components/ui/Buttons/RefreshButton';
import ActivityCard from '@/components/ui/Cards/ActivityCard';
import DashboardSection from '@/components/ui/Cards/DashboardSection';
import ListItem from '@/components/ui/Cards/ListItem';
import QuickActionButton from '@/components/ui/Buttons/QuickActionButton';

// مكونات بسيطة للتذكيرات
const ReminderStatusBadge = ({ status }) => {
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

const ReminderTypeBadge = ({ type }) => {
  const typeConfig = {
    payment_reminder: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'تذكير دفعة' },
    contract_expiry_reminder: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'انتهاء عقد' },
    maintenance_reminder: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'تذكير صيانة' },
    general_reminder: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'تذكير عام' },
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

const PaymentStatusBadge = ({ paymentStatus }) => {
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

const PaymentStatusFilter = ({ value, onChange }) => {
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

// SVG Icons Components (نفس الأيقونات المستخدمة في الداشبورد)
const ReminderIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 5.653c0-.856.917-1.407 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971L6.167 19.334c-.75.421-1.667-.13-1.667-.986V5.653z" />
  </svg>
);

const PaymentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ContractIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const MaintenanceIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const MessageIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ActivityIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

// دالة تنسيق التاريخ بالعربية
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

// دالة تنسيق الأرقام بالإنجليزية
const formatEnglishNumber = (number) => {
  if (typeof number !== 'number') return '0';
  return number.toLocaleString('en-US');
};

// دالة تحليل سبب الفشل
const getFailureReason = (reminder) => {
  const errorMessage = reminder.errorMessage || reminder.metadata?.error || reminder.metadata?.errorMessage;
  
  if (!errorMessage) {
    return 'فشل في الإرسال - سبب غير محدد';
  }
  
  const error = errorMessage.toLowerCase();
  
  // تحليل أسباب الفشل الشائعة
  if (error.includes('phone') || error.includes('number') || error.includes('invalid')) {
    return 'رقم الهاتف غير صحيح';
  }
  if (error.includes('blocked') || error.includes('ban')) {
    return 'الرقم محظور أو مقيد';
  }
  if (error.includes('timeout') || error.includes('connection')) {
    return 'انتهت مهلة الاتصال';
  }
  if (error.includes('quota') || error.includes('limit')) {
    return 'تم تجاوز حد الرسائل';
  }
  if (error.includes('whatsapp') || error.includes('api')) {
    return 'خطأ في خدمة الواتساب';
  }
  if (error.includes('client') || error.includes('user')) {
    return 'مشكلة في بيانات العميل';
  }
    // إذا لم نجد نمط معروف، أعد الرسالة الأصلية (مختصرة)
  return errorMessage.length > 50 ? errorMessage.substring(0, 50) + '...' : errorMessage;
};

export default function RemindersPage() {
  const router = useRouter();
  const [remindersData, setRemindersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
    // حالات البحث والتصفية
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all'); // فلتر جديد لحالة الدفع
  
  // حالة modal التفاصيل
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // جلب البيانات من API
  const fetchRemindersData = async () => {
    try {
      setLoading(true);
        const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        type: typeFilter !== 'all' ? typeFilter : '',
        paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : '' // إضافة فلتر حالة الدفع
      });

      const response = await fetch(`/api/admin/whatsapp/reminders?${params}`);
      
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات التذكيرات');
      }      const data = await response.json();
      setRemindersData(data.data || data);
      setLastUpdated(new Date());
      setError(null);
      
      console.log('✅ تم جلب بيانات التذكيرات بنجاح:', {
        total: data.data?.summary?.total || 0,
        reminders: data.data?.reminders?.length || 0,
        source: data.source || 'unknown'
      });    } catch (err) {
      console.error('خطأ في جلب البيانات:', err);
      setError(err.message);
      
      // لا نستخدم بيانات وهمية - نعرض الخطأ
      setRemindersData(null);
    } finally {
      setLoading(false);
    }
  };
  // التحديث التلقائي كل 30 ثانية
  useEffect(() => {
    fetchRemindersData();
      if (autoRefresh) {
      const interval = setInterval(fetchRemindersData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, searchTerm, statusFilter, typeFilter, paymentStatusFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  // تحديث يدوي
  const handleRefresh = () => {
    fetchRemindersData();
  };

  // عرض تفاصيل التذكير
  const showReminderDetails = (reminder) => {
    setSelectedReminder(reminder);
    setShowDetailsModal(true);
  };

  // إغلاق modal التفاصيل
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedReminder(null);
  };

  if (loading && !remindersData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل التذكيرات...</p>
        </div>
      </div>
    );
  }

  if (error && !remindersData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">خطأ في تحميل البيانات</p>
            <p>{error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  const summary = remindersData?.summary || {};
  const reminders = remindersData?.reminders || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">إدارة التذكيرات</h1>
            <p className="text-gray-600 mt-1">متابعة وإدارة جميع التذكيرات والإشعارات</p>
            
            {/* إحصائيات سريعة في Header */}
            {summary && (
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">
                    إجمالي: <span className="font-semibold text-gray-900">{formatEnglishNumber(summary.total || 0)}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">
                    تم التسليم: <span className="font-semibold text-green-700">{formatEnglishNumber(summary.byStatus?.delivered || 0)}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">
                    في الانتظار: <span className="font-semibold text-yellow-700">{formatEnglishNumber(summary.byStatus?.pending || 0)}</span>
                  </span>
                </div>
                {summary.byStatus?.failed > 0 && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">
                      فشل: <span className="font-semibold text-red-700">{formatEnglishNumber(summary.byStatus.failed)}</span>
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">
                    معدل النجاح: <span className="font-semibold text-purple-700">{summary.successRate || 0}%</span>
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* زر التحديث */}
            <RefreshButton 
              onRefresh={handleRefresh}
              loading={loading}
              size="medium"
            />
            
            {/* التحديث التلقائي */}
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">تحديث تلقائي</span>
            </label>
            
            {/* آخر تحديث */}
            {lastUpdated && (
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span>آخر تحديث: {lastUpdated.toLocaleTimeString('en-US')}</span>
              </div>
            )}
          </div>
        </div>
      </div>      {/* الإحصائيات الرئيسية - إحصائيات الدفعات والعقود */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* إحصائيات الدفعات */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="mr-2">💰</span>
            إحصائيات الدفعات
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {formatEnglishNumber(remindersData?.paymentStats?.totalPendingPayments || 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">دفعات معلقة</div>
              <div className="text-xs text-yellow-700 mt-1">🔄 تحتاج متابعة</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {formatEnglishNumber(remindersData?.paymentStats?.totalPaidPayments || 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">دفعات مدفوعة</div>
              <div className="text-xs text-green-700 mt-1">✅ مكتملة</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {formatEnglishNumber(remindersData?.paymentStats?.overduePayments || 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">دفعات متأخرة</div>
              <div className="text-xs text-red-700 mt-1">🚨 عاجلة</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {formatEnglishNumber(remindersData?.paymentStats?.upcomingPayments || 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">دفعات قادمة</div>
              <div className="text-xs text-blue-700 mt-1">📅 خلال 30 يوم</div>
            </div>
          </div>
        </div>

        {/* إحصائيات العقود */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📋</span>
            إحصائيات العقود
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {formatEnglishNumber(remindersData?.contractStats?.totalActiveContracts || 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">عقود نشطة</div>
              <div className="text-xs text-blue-700 mt-1">📈 قيد التشغيل</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {formatEnglishNumber(remindersData?.contractStats?.expiringContracts || 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">عقود منتهية قريباً</div>
              <div className="text-xs text-orange-700 mt-1">⏰ خلال 30 يوم</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {formatEnglishNumber(remindersData?.contractStats?.contractReminders || 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">تذكيرات مرسلة</div>
              <div className="text-xs text-purple-700 mt-1">📤 إجمالي</div>
            </div>
          </div>
        </div>
      </div>

      {/* إحصائيات التذكيرات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* إجمالي التذكيرات */}
        <StatCard
          title="إجمالي التذكيرات"
          value={formatEnglishNumber(summary.total || 0)}
          icon={ReminderIcon}
          color="blue"
          layout="horizontal"
        />

        {/* التذكيرات المسلّمة اليوم */}
        <StatCard
          title="مُسلّمة اليوم"
          value={formatEnglishNumber(summary.todaySummary?.delivered || 0)}
          icon={CheckIcon}
          color="green"
          layout="horizontal"
        />

        {/* التذكيرات الفاشلة */}        <StatCard
          title="فشل في الإرسال"
          value={formatEnglishNumber(summary.byStatus?.failed || 0)}
          icon={ClockIcon}
          color="red"
          layout="horizontal"
        />

        {/* معدل النجاح */}
        <StatCard
          title="معدل النجاح"
          value={`${summary.successRate || 0}%`}
          icon={ActivityIcon}
          color="purple"
          layout="horizontal"
        />
      </div>

      {/* إحصائيات الأداء اليومي */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* أداء اليوم */}        <StatCard
          title="تذكيرات اليوم"
          subtitle="إجمالي المرسلة"
          value={formatEnglishNumber(summary.todaySummary?.total || 0)}
          icon={MessageIcon}
          color="cyan"
          layout="vertical"
        />

        {/* نسبة النجاح اليوم */}
        <StatCard
          title="نسبة النجاح اليوم"
          subtitle="من إجمالي المرسلة"
          value={`${
            summary.todaySummary?.total > 0 
              ? Math.round(((summary.todaySummary?.delivered || 0) / summary.todaySummary.total) * 100)
              : 0
          }%`}
          icon={CheckIcon}
          color="emerald"
          layout="vertical"
        />

        {/* التذكيرات المجدولة */}
        <StatCard
          title="التذكيرات المجدولة"
          subtitle="مجدولة للغد"
          value={formatEnglishNumber(summary.scheduledSummary?.tomorrow || 0)}
          icon={ClockIcon}
          color="amber"
          layout="vertical"
        />

        {/* تذكيرات تلقائية */}
        <StatCard
          title="تذكيرات تلقائية"
          subtitle="مجدولة هذا الأسبوع"
          value={formatEnglishNumber(summary.scheduledSummary?.thisWeek || 0)}
          icon={SettingsIcon}
          color="indigo"
          layout="vertical"
        />
      </div>{/* إحصائيات تفصيلية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* توزيع أنواع التذكيرات */}
        <DashboardSection
          title="توزيع أنواع التذكيرات"
          icon={PaymentIcon}
        >
          <div className="space-y-3">
            <ActivityCard
              title="تذكيرات الدفع"
              subtitle="أقساط ومدفوعات"
              value={formatEnglishNumber(summary.byType?.payment_reminder || summary.byType?.payment || 0)}
              color="green"
            />
            
            <ActivityCard
              title="تذكيرات الصيانة"
              subtitle="صيانة دورية وطارئة"
              value={formatEnglishNumber(summary.byType?.maintenance_reminder || summary.byType?.maintenance || 0)}
              color="orange"
            />
            
            <ActivityCard
              title="انتهاء العقود"
              subtitle="تجديد وانتهاء"
              value={formatEnglishNumber(summary.byType?.contract_expiry_reminder || summary.byType?.contract || 0)}
              color="blue"
            />
            
            <ActivityCard
              title="تذكيرات عامة"
              subtitle="إشعارات متنوعة"
              value={formatEnglishNumber(summary.byType?.general_reminder || 0)}
              color="gray"
            />
          </div>
        </DashboardSection>

        {/* حالة التسليم والمتابعة */}
        <DashboardSection
          title="حالة التسليم والمتابعة"
          icon={ActivityIcon}
        >
          <div className="space-y-3">
            <ActivityCard
              title="تم التسليم بنجاح"
              subtitle="وصلت للمستلم"
              value={formatEnglishNumber(summary.byStatus?.delivered || 0)}
              color="green"
            />
            
            <ActivityCard
              title="تم الإرسال"
              subtitle="في طريقها للتسليم"
              value={formatEnglishNumber(summary.byStatus?.sent || 0)}
              color="blue"
            />
            
            <ActivityCard
              title="في قائمة الانتظار"
              subtitle="مجدولة للإرسال"
              value={formatEnglishNumber(summary.byStatus?.pending || 0)}
              color="yellow"
            />
            
            <ActivityCard
              title="فشل في التسليم"
              subtitle="تحتاج إعادة إرسال"
              value={formatEnglishNumber(summary.byStatus?.failed || 0)}
              color="red"
            />
          </div>        </DashboardSection>
      </div>

      {/* إحصائيات الأداء والتوقيت */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* أداء اليوم */}
        <DashboardSection
          title="أداء اليوم"
          icon={ClockIcon}
          className="lg:col-span-1"
        >
          <div className="space-y-3">
            <ActivityCard
              title="تذكيرات اليوم"
              subtitle="إجمالي المرسلة"
              value={formatEnglishNumber(summary.todaySummary?.total || 0)}
              color="blue"
            />
            
            <ActivityCard
              title="نسبة النجاح اليوم"
              subtitle="من إجمالي المرسلة"
              value={`${summary.todaySummary?.successRate || 0}%`}
              color="green"
            />
          </div>
        </DashboardSection>

        {/* التذكيرات المجدولة */}
        <DashboardSection
          title="التذكيرات المجدولة"
          icon={SettingsIcon}
          className="lg:col-span-1"
        >
          <div className="space-y-3">
            <ActivityCard
              title="مجدولة للغد"
              subtitle="تذكيرات تلقائية"
              value={formatEnglishNumber(summary.scheduled?.tomorrow || 0)}
              color="purple"
            />
            
            <ActivityCard
              title="مجدولة هذا الأسبوع"
              subtitle="خطة الإرسال"
              value={formatEnglishNumber(summary.scheduled?.thisWeek || 0)}
              color="orange"
            />
          </div>
        </DashboardSection>

        {/* إحصائيات سريعة */}
        <DashboardSection
          title="نظرة سريعة"
          icon={ContractIcon}
          className="lg:col-span-1"
        >
          <div className="space-y-3">
            <ActivityCard
              title="متوسط وقت التسليم"
              subtitle="بالدقائق"
              value="2.5 دقيقة"
              color="cyan"
            />
            
            <ActivityCard
              title="العملاء المتفاعلين"
              subtitle="قرأوا التذكيرات"
              value={formatEnglishNumber(summary.byStatus?.read || 0)}
              color="emerald"
            />
          </div>
        </DashboardSection>
      </div>      {/* البحث والتصفية - مع فلتر حالة الدفع الجديد */}
      <DashboardSection
        title="البحث والتصفية"
        icon={FilterIcon}
        className="mb-6"
      >
        <div className="space-y-4">
          {/* البحث الرئيسي */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* البحث */}
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <SearchIcon className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="البحث بالاسم، الرقم، رقم العقد، أو العقار..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* تصفية الحالة */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="delivered">تم التسليم ✅</option>
              <option value="sent">مرسل 📤</option>
              <option value="pending">في الانتظار ⏳</option>
              <option value="failed">فشل ❌</option>
              <option value="read">مقروء 👁️</option>
            </select>

            {/* تصفية النوع */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">جميع الأنواع</option>
              <option value="payment_reminder">💰 تذكيرات الدفع</option>
              <option value="maintenance_reminder">🔧 تذكيرات الصيانة</option>
              <option value="contract_expiry_reminder">📋 انتهاء العقود</option>
              <option value="general_reminder">📝 تذكيرات عامة</option>
            </select>

            {/* فلتر حالة الدفع الجديد */}
            <PaymentStatusFilter
              value={paymentStatusFilter}
              onChange={setPaymentStatusFilter}
            />
          </div>          {/* مؤشرات الفلترة النشطة */}
          {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || paymentStatusFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">الفلاتر النشطة:</span>
              
              {searchTerm && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  البحث: {searchTerm}
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mr-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  الحالة: {statusFilter}
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className="mr-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {typeFilter !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  النوع: {typeFilter}
                  <button 
                    onClick={() => setTypeFilter('all')}
                    className="mr-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}

              {paymentStatusFilter !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  حالة الدفع: {paymentStatusFilter}
                  <button 
                    onClick={() => setPaymentStatusFilter('all')}
                    className="mr-1 text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setPaymentStatusFilter('all');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                مسح جميع الفلاتر
              </button>
            </div>
          )}
        </div>
      </DashboardSection>      {/* قائمة التذكيرات المحسّنة */}
      <DashboardSection
        title="آخر التذكيرات"
        icon={MessageIcon}
        action={() => router.push('/whatsapp/reminders/all')}
        actionText="عرض الكل"
      >        <div className="space-y-3">
          {reminders.length > 0 ? reminders.map((reminder) => (
            <div key={reminder.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
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

              {/* معلومات الدفعة */}
              {reminder.messageType === 'payment_reminder' && (
                <div className="border-t pt-3 space-y-2">
                  {reminder.amount && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">المبلغ:</span>
                      <span className="text-sm text-gray-900 font-bold text-green-600">
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
                  onClick={() => showReminderDetails(reminder)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  عرض التفاصيل
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <MessageIcon className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500">لا توجد تذكيرات للعرض</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || paymentStatusFilter !== 'all'
                  ? 'جرب تغيير معايير البحث أو التصفية' 
                  : 'لم يتم إرسال أي تذكيرات بعد'}
              </p>
            </div>
          )}
        </div>
      </DashboardSection>      {/* التذكيرات المجدولة */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <span className="mr-2">📅</span>
            التذكيرات المجدولة
          </h3>
        </div>
          <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xl font-bold text-blue-600">
              {formatEnglishNumber(remindersData?.scheduledSummary?.tomorrow || 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">مجدولة للغد</div>
            <div className="text-xs text-blue-700 mt-1">📍 يوم واحد</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-xl font-bold text-purple-600">
              {formatEnglishNumber(remindersData?.scheduledSummary?.thisWeek || 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">مجدولة هذا الأسبوع</div>
            <div className="text-xs text-purple-700 mt-1">📅 7 أيام</div>
          </div>
        </div>
        
        {(remindersData?.scheduledSummary?.tomorrow > 0 || remindersData?.scheduledSummary?.thisWeek > 0) && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm text-green-800 font-medium">
                النظام فعال! تم إنشاء {formatEnglishNumber((remindersData?.scheduledSummary?.tomorrow || 0) + (remindersData?.scheduledSummary?.thisWeek || 0))} تذكير مجدول بناءً على البيانات الفعلية
              </span>
            </div>
          </div>
        )}
      </div>

      {/* الإجراءات السريعة */}
      <DashboardSection
        title="الإجراءات السريعة"
        className="mt-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            title="إرسال تذكير"
            icon={MessageIcon}
            color="blue"
            onClick={() => router.push('/whatsapp/reminders/new')}
          />
          
          <QuickActionButton
            title="تذكيرات مجدولة"
            icon={ClockIcon}
            color="purple"
            onClick={() => router.push('/whatsapp/reminders/scheduled')}
          />
          
          <QuickActionButton
            title="الإعدادات"
            icon={SettingsIcon}
            color="green"
            onClick={() => router.push('/whatsapp/reminders/settings')}
          />
          
          <QuickActionButton
            title="التقارير"
            icon={ActivityIcon}
            color="orange"
            onClick={() => router.push('/whatsapp/reminders/reports')}          />
        </div>
      </DashboardSection>      {/* Modal تفاصيل التذكير */}
      {showDetailsModal && selectedReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-gray-900">تفاصيل التذكير</h3>
              <button
                onClick={closeDetailsModal}
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
                    <ReminderTypeBadge type={selectedReminder.messageType} />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">حالة الإرسال:</span>
                    <ReminderStatusBadge status={selectedReminder.status} />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">تاريخ الإرسال:</span>
                    <span className="text-sm font-medium">{formatArabicDate(selectedReminder.sentAt)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">معرف الرسالة:</span>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {selectedReminder.messageId || 'غير محدد'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* معلومات الدفعة */}
              {selectedReminder.messageType === 'payment_reminder' && (
                <div className="border-b pb-4">
                  <h4 className="font-medium mb-3 text-gray-800">معلومات الدفعة</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedReminder.amount && (
                      <div>
                        <span className="text-sm text-gray-600 block mb-1">المبلغ:</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatEnglishNumber(selectedReminder.amount)} د.إ
                        </span>
                      </div>
                    )}
                    {selectedReminder.paymentStatus && (
                      <div>
                        <span className="text-sm text-gray-600 block mb-1">حالة الدفع:</span>
                        <PaymentStatusBadge paymentStatus={selectedReminder.paymentStatus} />
                      </div>
                    )}
                    {selectedReminder.dueDate && (
                      <div>
                        <span className="text-sm text-gray-600 block mb-1">تاريخ الاستحقاق:</span>
                        <span className="text-sm font-medium">{formatArabicDate(selectedReminder.dueDate)}</span>
                      </div>
                    )}
                    {selectedReminder.contractNumber && (
                      <div>
                        <span className="text-sm text-gray-600 block mb-1">رقم العقد:</span>
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {selectedReminder.contractNumber}
                        </span>
                      </div>
                    )}
                    {selectedReminder.propertyName && (
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600 block mb-1">العقار:</span>
                        <span className="text-sm font-medium">
                          {selectedReminder.propertyName}
                          {selectedReminder.unitNumber && ` - وحدة رقم ${selectedReminder.unitNumber}`}
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
                      {selectedReminder.clientName || selectedReminder.client?.name || 'غير محدد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">رقم الهاتف:</span>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded" dir="ltr">
                      {selectedReminder.recipient}
                    </span>
                  </div>
                  {selectedReminder.client?.email && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">البريد الإلكتروني:</span>
                      <span className="text-sm font-medium">{selectedReminder.client.email}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* الرسالة المرسلة */}
              {selectedReminder.message && (
                <div>
                  <h4 className="font-medium mb-3 text-gray-800">نص الرسالة</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedReminder.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={closeDetailsModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

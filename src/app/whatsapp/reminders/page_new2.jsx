'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/ui/Cards/StatCard';
import RefreshButton from '@/components/ui/Buttons/RefreshButton';
import ActivityCard from '@/components/ui/Cards/ActivityCard';
import DashboardSection from '@/components/ui/Cards/DashboardSection';
import ListItem from '@/components/ui/Cards/ListItem';
import QuickActionButton from '@/components/ui/Buttons/QuickActionButton';

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

// مكون حالة التذكير
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

// مكون نوع التذكير
const ReminderTypeBadge = ({ type }) => {
  const typeConfig = {
    payment_reminder: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'تذكير دفعة' },
    contract_expiry_reminder: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'انتهاء عقد' },
    maintenance_reminder: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'تذكير صيانة' },
    general_reminder: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'تذكير عام' }
  };

  const config = typeConfig[type] || typeConfig.general_reminder;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
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

  // جلب البيانات من API
  const fetchRemindersData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        type: typeFilter !== 'all' ? typeFilter : ''
      });

      const response = await fetch(`/api/admin/whatsapp/reminders?${params}`);
      
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات التذكيرات');
      }

      const data = await response.json();
      setRemindersData(data.data || data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('خطأ في جلب البيانات:', err);
      setError(err.message);
      
      // بيانات تجريبية في حالة الخطأ
      setRemindersData({
        summary: {
          total: 45,
          byStatus: { delivered: 30, sent: 8, pending: 5, failed: 2 },
          byType: { 
            payment_reminder: 25, 
            maintenance_reminder: 12, 
            contract_expiry_reminder: 6, 
            general_reminder: 2 
          },
          successRate: 84
        },
        reminders: [
          {
            id: 1,
            type: 'payment_reminder',
            status: 'delivered',
            clientName: 'أحمد محمد علي',
            phoneNumber: '+966501234567',
            message: 'تذكير بموعد دفع القسط الشهري المستحق بتاريخ 25 من الشهر الجاري',
            sentAt: new Date().toISOString(),
            deliveredAt: new Date().toISOString()
          },
          {
            id: 2,
            type: 'maintenance_reminder',
            status: 'sent',
            clientName: 'فاطمة أحمد السعد',
            phoneNumber: '+966502345678',
            message: 'تذكير بموعد الصيانة الدورية لنظام التكييف المركزي',
            sentAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 3,
            type: 'contract_expiry_reminder',
            status: 'pending',
            clientName: 'محمد خالد العتيبي',
            phoneNumber: '+966503456789',
            message: 'تنبيه: عقد الصيانة سينتهي خلال 15 يوماً، يرجى التواصل لتجديد العقد',
            scheduledAt: new Date(Date.now() + 3600000).toISOString()
          },
          {
            id: 4,
            type: 'general_reminder',
            status: 'failed',
            clientName: 'سارة عبدالله',
            phoneNumber: '+966504567890',
            message: 'شكراً لكم لاختيار خدماتنا، نتطلع لخدمتكم دائماً',
            sentAt: new Date(Date.now() - 7200000).toISOString(),
            errorMessage: 'فشل في إرسال الرسالة - رقم غير صحيح'
          }
        ]
      });
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
  }, [autoRefresh, searchTerm, statusFilter, typeFilter]);

  // تحديث يدوي
  const handleRefresh = () => {
    fetchRemindersData();
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
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة التذكيرات</h1>
            <p className="text-gray-600 mt-1">متابعة وإدارة جميع التذكيرات والإشعارات</p>
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
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* إجمالي التذكيرات */}
        <StatCard
          title="إجمالي التذكيرات"
          value={formatEnglishNumber(summary.total || 0)}
          icon={ReminderIcon}
          color="blue"
          layout="horizontal"
        />

        {/* تذكيرات الدفع */}        <StatCard
          title="تذكيرات الدفع"
          value={formatEnglishNumber(summary.byType?.payment_reminder || 0)}
          icon={PaymentIcon}
          color="green"
          layout="horizontal"
        />

        {/* تذكيرات الصيانة */}        <StatCard
          title="تذكيرات الصيانة"
          value={formatEnglishNumber(summary.byType?.maintenance_reminder || 0)}
          icon={MaintenanceIcon}
          color="orange"
          layout="horizontal"
        />

        {/* معدل النجاح */}
        <StatCard
          title="معدل النجاح"
          value={`${summary.successRate || 0}%`}
          icon={CheckIcon}
          color="purple"
          layout="horizontal"
        />
      </div>

      {/* إحصائيات تفصيلية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* إحصائيات حسب الحالة */}
        <DashboardSection
          title="إحصائيات حسب الحالة"
          icon={ActivityIcon}
        >
          <div className="space-y-3">
            <ActivityCard
              title="تم التسليم"
              value={formatEnglishNumber(summary.byStatus?.delivered || 0)}
              color="green"
            />
            
            <ActivityCard
              title="مرسل"
              value={formatEnglishNumber(summary.byStatus?.sent || 0)}
              color="blue"
            />
            
            <ActivityCard
              title="في الانتظار"
              value={formatEnglishNumber(summary.byStatus?.pending || 0)}
              color="yellow"
            />
            
            <ActivityCard
              title="فشل"
              value={formatEnglishNumber(summary.byStatus?.failed || 0)}
              color="red"
            />
          </div>
        </DashboardSection>

        {/* إحصائيات حسب النوع */}
        <DashboardSection
          title="إحصائيات حسب النوع"
          icon={ClockIcon}
        >
          <div className="space-y-3">
            <ActivityCard
              title="تذكيرات الدفع"
              subtitle="أقساط وفواتير"
              value={formatEnglishNumber(summary.byType?.payment_reminder || 0)}
              color="green"
            />
            
            <ActivityCard
              title="تذكيرات الصيانة"
              subtitle="مواعيد الصيانة"
              value={formatEnglishNumber(summary.byType?.maintenance_reminder || 0)}
              color="orange"
            />
            
            <ActivityCard
              title="انتهاء العقود"
              subtitle="تجديد العقود"
              value={formatEnglishNumber(summary.byType?.contract_expiry_reminder || 0)}
              color="blue"
            />
            
            <ActivityCard
              title="تذكيرات عامة"
              subtitle="تذكيرات أخرى"
              value={formatEnglishNumber(summary.byType?.general_reminder || 0)}
              color="gray"
            />
          </div>
        </DashboardSection>
      </div>

      {/* البحث والتصفية */}
      <DashboardSection
        title="البحث والتصفية"
        icon={FilterIcon}
        className="mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* البحث */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <SearchIcon className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="البحث في التذكيرات..."
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
            <option value="delivered">تم التسليم</option>
            <option value="sent">مرسل</option>
            <option value="pending">في الانتظار</option>
            <option value="failed">فشل</option>
          </select>

          {/* تصفية النوع */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">جميع الأنواع</option>
            <option value="payment_reminder">تذكيرات الدفع</option>
            <option value="maintenance_reminder">تذكيرات الصيانة</option>
            <option value="contract_expiry_reminder">انتهاء العقود</option>
            <option value="general_reminder">تذكيرات عامة</option>
          </select>
        </div>
      </DashboardSection>

      {/* قائمة التذكيرات */}
      <DashboardSection
        title="آخر التذكيرات"
        icon={MessageIcon}
        action={() => router.push('/whatsapp/reminders/all')}
        actionText="عرض الكل"
      >
        <div className="space-y-3">
          {reminders.length > 0 ? reminders.map((reminder) => (
            <ListItem
              key={reminder.id}
              title={reminder.clientName || 'عميل غير محدد'}
              subtitle={reminder.message?.substring(0, 60) + '...'}
              timestamp={formatArabicDate(reminder.sentAt || reminder.scheduledAt)}
              status={reminder.status}
              action={
                <div className="flex items-center space-x-2 space-x-reverse">
                  <ReminderStatusBadge status={reminder.status} />
                  <ReminderTypeBadge type={reminder.type} />
                </div>
              }
              onClick={() => router.push(`/whatsapp/reminders/${reminder.id}`)}
            />
          )) : (
            <p className="text-gray-500 text-center py-8">لا توجد تذكيرات للعرض</p>
          )}
        </div>
      </DashboardSection>

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
            onClick={() => router.push('/whatsapp/reminders/reports')}
          />
        </div>
      </DashboardSection>
    </div>
  );
}

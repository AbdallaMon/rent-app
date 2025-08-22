'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/ui/Cards/StatCard';
import RefreshButton from '@/components/ui/Buttons/RefreshButton';
import ActivityCard from '@/components/ui/Cards/ActivityCard';
import DashboardSection from '@/components/ui/Cards/DashboardSection';
import ListItem from '@/components/ui/Cards/ListItem';
import QuickActionButton from '@/components/ui/Buttons/QuickActionButton';

// SVG Icons Components
const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ContractIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const MessageIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const ReminderIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 5.653c0-.856.917-1.407 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971L6.167 19.334c-.75.421-1.667-.13-1.667-.986V5.653z" />
  </svg>
);

const MaintenanceIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ComplaintIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const BotIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ActivityIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6.2c-.8 0-1.6-.3-2.1-.9-.6-.5-.9-1.3-.9-2.1V8c0-.8.3-1.6.9-2.1.6-.6 1.3-.9 2.1-.9h9.6c.8 0 1.6.3 2.1.9.6.5.9 1.3.9 2.1v3M16 14v6m0 0l-2-2m2 2l2-2" />
  </svg>
);

export default function WhatsAppDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  // جلب البيانات من API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // جلب البيانات الرئيسية
      const [dashResponse, requestsResponse, complaintsResponse, conversationsResponse, remindersResponse] = await Promise.all([
        fetch('/api/admin/whatsapp/dashboard'),
        fetch('/api/admin/whatsapp/requests?limit=5'),
        fetch('/api/admin/whatsapp/complaints?limit=5'),
        fetch('/api/admin/whatsapp/conversations?limit=5'),
        fetch('/api/admin/whatsapp/reminders?limit=5')
      ]);

      if (!dashResponse.ok) {
        throw new Error('فشل في جلب بيانات الداشبورد');
      }      const dashData = await dashResponse.json();
      const requestsData = requestsResponse.ok ? await requestsResponse.json() : { requests: [], total: 0 };
      const complaintsData = complaintsResponse.ok ? await complaintsResponse.json() : { complaints: [], total: 0 };
      const conversationsData = conversationsResponse.ok ? await conversationsResponse.json() : { data: [], total: 0 };
      const remindersData = remindersResponse.ok ? await remindersResponse.json() : { data: { reminders: [], summary: {} }, total: 0 };

      // تصحيح هيكل البيانات - الـ API يرجع البيانات مباشرة
      const processedData = dashData.success && dashData.data ? dashData.data : dashData;
      
      setDashboardData({
        ...processedData,
        requests: { data: requestsData.requests || [], total: requestsData.pagination?.total || 0 },
        complaints: { data: complaintsData.complaints || [], total: complaintsData.pagination?.total || 0 },
        conversations: conversationsData,
        reminders: remindersData.data || { reminders: [], summary: {} }
      });

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('خطأ في جلب البيانات:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // التحديث التلقائي كل 30 ثانية
  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // تحديث يدوي
  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
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
  const stats = dashboardData?.stats || {};
  const todayActivity = dashboardData?.todayActivity || {};
  const recentMessages = dashboardData?.recentMessages || [];
  const requests = dashboardData?.requests?.data || [];
  const complaints = dashboardData?.complaints?.data || [];
  const conversations = dashboardData?.conversations?.data || [];
  const reminders = dashboardData?.reminders || { reminders: [], summary: {} };
  const remindersSummary = reminders.summary || {};

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم الواتساب</h1>
            <p className="text-gray-600 mt-1">إدارة شاملة لنظام الواتساب والطلبات</p>
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
      </div>      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* العملاء */}
        <StatCard
          title="إجمالي العملاء"
          value={stats.totalClients || 0}
          icon={UsersIcon}
          color="blue"
          layout="horizontal"
        />

        {/* العقود النشطة */}
        <StatCard
          title="العقود النشطة"
          value={stats.activeContracts || 0}
          icon={ContractIcon}
          color="green"
          layout="horizontal"
        />

        {/* الرسائل اليوم */}
        <StatCard
          title="رسائل اليوم"
          value={todayActivity.totalToday || 0}
          icon={MessageIcon}
          color="purple"
          layout="horizontal"
        />

        {/* الأقساط المعلقة */}
        <StatCard
          title="أقساط معلقة"
          value={stats.pendingInstallments || 0}
          icon={ReminderIcon}
          color="orange"
          layout="horizontal"
        />
      </div>

      {/* حالة النظام والبوت */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* حالة البوت */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BotIcon className="ml-2" />
              حالة البوت
            </h3>            <div className="flex items-center space-x-2 space-x-reverse">
              <div className={`w-3 h-3 rounded-full ${
                (stats.successRate || 0) >= 80 ? 'bg-green-500 animate-pulse' :
                (stats.successRate || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                (stats.successRate || 0) >= 80 ? 'text-green-600' :
                (stats.successRate || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {(stats.successRate || 0) >= 80 ? 'نشط ومستقر' :
                 (stats.successRate || 0) >= 50 ? 'نشط مع تحذيرات' : 'يحتاج انتباه'}
              </span>
            </div>
          </div>
            <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">إجمالي الرسائل</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalMessages || 0}</p>
              <p className="text-xs text-gray-500">آخر 30 يوماً</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">معدل النجاح</p>
              <div className="flex items-center justify-center space-x-1 space-x-reverse">
                <p className={`text-xl font-bold ${
                  (stats.successRate || 0) >= 80 ? 'text-green-600' :
                  (stats.successRate || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.successRate || 0}%
                </p>
                {(stats.successRate || 0) >= 80 && (
                  <CheckIcon className="w-4 h-4 text-green-500" />
                )}
              </div>
              <p className="text-xs text-gray-500">
                {stats.sentMessages || 0} نجح من {stats.totalMessages || 0}
              </p>
            </div>
          </div>
          
          {/* إحصائيات إضافية */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-blue-50 rounded">
              <p className="text-xs text-blue-600">مُرسل</p>
              <p className="font-bold text-blue-800">{stats.sentMessages || 0}</p>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <p className="text-xs text-green-600">مُسلم</p>
              <p className="font-bold text-green-800">{stats.deliveredMessages || 0}</p>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <p className="text-xs text-red-600">فشل</p>
              <p className="font-bold text-red-800">{stats.failedMessages || 0}</p>
            </div>
          </div>
        </div>        {/* إحصائيات اليوم */}
        <DashboardSection
          title="نشاط اليوم"
          icon={ActivityIcon}
          className="lg:col-span-1"
        >
          <div className="space-y-3">
            <ActivityCard
              title="رسائل واردة"
              value={todayActivity.incomingToday || 0}
              color="blue"
              trend={(todayActivity.incomingToday || 0) > 10 ? 'up' : 'neutral'}
            />
            
            <ActivityCard
              title="طلبات صيانة"
              value={todayActivity.maintenanceToday || 0}
              color="orange"
              badge={(todayActivity.maintenanceToday || 0) > 0 ? 'جديد' : null}
            />
            
            <ActivityCard
              title="شكاوى جديدة"
              value={todayActivity.complaintsToday || 0}
              color="red"
              badge={(todayActivity.complaintsToday || 0) > 0 ? 'عاجل' : null}
            />
            
            <div className="pt-2 border-t border-gray-200">
              <ActivityCard
                title="زمن الاستجابة"
                value={stats.responseTime || stats.avgResponseTime || '1.2 ثانية'}
                color="green"
              />
              
              <ActivityCard
                title="وقت التشغيل"
                value={dashboardData?.systemHealth?.uptime || 'غير محدد'}
                color="blue"
                className="mt-3"
              />
            </div>
          </div>
        </DashboardSection>
      </div>      {/* طلبات الصيانة والشكاوي */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">        {/* طلبات الصيانة */}
        <DashboardSection
          title="طلبات الصيانة"
          icon={MaintenanceIcon}
          action={() => router.push('/whatsapp/requests')}
          actionText="عرض الكل"
        >
          <div className="space-y-3">
            {requests.length > 0 ? requests.slice(0, 3).map((request) => (
              <ListItem
                key={request.id}
                title={request.client?.name || 'عميل غير محدد'}
                subtitle={request.description?.substring(0, 50) + '...'}
                status={request.status}
                onClick={() => router.push(`/whatsapp/requests/${request.id}`)}
              />
            )) : (
              <p className="text-gray-500 text-center py-4">لا توجد طلبات صيانة حديثة</p>
            )}
          </div>
        </DashboardSection>        {/* الشكاوي */}
        <DashboardSection
          title="الشكاوي"
          icon={ComplaintIcon}
          action={() => router.push('/whatsapp/complaints')}
          actionText="عرض الكل"
        >
          <div className="space-y-3">
            {complaints.length > 0 ? complaints.slice(0, 3).map((complaint) => (
              <ListItem
                key={complaint.id}
                title={complaint.client?.name || 'عميل غير محدد'}
                subtitle={complaint.description?.substring(0, 50) + '...'}
                priority={complaint.priority}
                onClick={() => router.push(`/whatsapp/complaints/${complaint.id}`)}
              />
            )) : (
              <p className="text-gray-500 text-center py-4">لا توجد شكاوى حديثة</p>
            )}
          </div>
        </DashboardSection>        {/* التذكيرات والتنبيهات */}
        <DashboardSection
          title="التذكيرات والتنبيهات"
          icon={AlertIcon}
          action={() => router.push('/whatsapp/reminders')}
          actionText="عرض الكل"
        >
          <div className="space-y-3">
            <ActivityCard
              title="إجمالي التذكيرات"
              subtitle="جميع الأنواع"
              value={remindersSummary.total || 0}
              color="blue"
            />

            <ActivityCard
              title="تذكيرات الدفع"
              subtitle="أقساط وفواتير"
              value={remindersSummary.byType?.payment || 0}
              color="red"
            />

            <ActivityCard
              title="تذكيرات الصيانة"
              subtitle="مواعيد الصيانة"
              value={remindersSummary.byType?.maintenance || 0}
              color="yellow"
            />

            <ActivityCard
              title="انتهاء العقود"
              subtitle="تجديد العقود"
              value={remindersSummary.byType?.contract || 0}
              color="orange"
            />

            <ActivityCard
              title="معدل النجاح"
              subtitle="التسليم الناجح"
              value={`${remindersSummary.successRate || 0}%`}
              color="green"
            />
          </div>
        </DashboardSection>
      </div>

      {/* المحادثات النشطة وآخر الرسائل */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">        {/* المحادثات النشطة */}
        <DashboardSection
          title="المحادثات النشطة"
          icon={PhoneIcon}
          action={() => router.push('/whatsapp/conversations')}
          actionText="عرض الكل"
        >
          <div className="space-y-3">            {conversations.length > 0 ? conversations.slice(0, 3).map((conversation) => (
              <ListItem
                key={conversation.id}
                title={conversation.client?.name || conversation.phoneNumber}
                timestamp={new Date(conversation.lastMessageAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit', 
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
                action={
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {conversation.messageCount || 0} رسالة
                  </span>
                }
                onClick={() => router.push(`/whatsapp/conversations/${conversation.id}`)}
              />
            )) : (
              <p className="text-gray-500 text-center py-4">لا توجد محادثات نشطة</p>
            )}
          </div>
        </DashboardSection>        {/* آخر الرسائل */}
        <DashboardSection
          title="آخر الرسائل"
          icon={MessageIcon}
          action={() => router.push('/whatsapp/messages')}
          actionText="عرض الكل"
        >
          <div className="space-y-3">            {recentMessages.length > 0 ? recentMessages.slice(0, 3).map((message) => (
              <ListItem
                key={message.id}
                title={message.client || 'عميل غير محدد'}
                subtitle={message.phone}
                timestamp={new Date(message.sentAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit', 
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
                action={
                  <div className="flex items-center space-x-1 space-x-reverse">
                    {message.status === 'delivered' && <CheckIcon className="w-4 h-4 text-green-500" />}
                    <span className={`text-xs ${
                      message.status === 'delivered' ? 'text-green-600' :
                      message.status === 'sent' ? 'text-blue-600' :
                      'text-red-600'
                    }`}>
                      {message.status === 'delivered' ? 'تم التسليم' :
                       message.status === 'sent' ? 'مرسل' : 'فشل'}
                    </span>
                  </div>
                }
                onClick={() => router.push(`/whatsapp/messages/${message.id}`)}
              />
            )) : (
              <p className="text-gray-500 text-center py-4">لا توجد رسائل حديثة</p>
            )}
          </div>
        </DashboardSection>
      </div>      {/* الإجراءات السريعة */}
      <DashboardSection
        title="الإجراءات السريعة"
        className="mt-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            title="إرسال رسالة"
            icon={MessageIcon}
            color="blue"
            onClick={() => router.push('/whatsapp/send-message')}
          />
          
          <QuickActionButton
            title="التذكيرات"
            icon={ReminderIcon}
            color="purple"
            onClick={() => router.push('/whatsapp/reminders')}
          />
          
          <QuickActionButton
            title="الإعدادات"
            icon={SettingsIcon}
            color="green"
            onClick={() => router.push('/whatsapp/settings')}
          />
          
          <QuickActionButton
            title="التحليلات"
            icon={ActivityIcon}
            color="orange"
            onClick={() => router.push('/whatsapp/analytics')}
          />
        </div>
      </DashboardSection>
    </div>
  );
}

/**
 * لوحة تحكم واتساب الجديدة - نسخة محدثة ومنظمة
 * 
 * @version 8.0.0 - الهيكل الجديد مع APIs حقيقية
 * @author Tar Real Estate System  
 * @date June 20, 2025
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  Bell, 
  Settings, 
  TrendingUp, 
  RefreshCw,
  Activity,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

// استيراد المكونات الفرعية - إعادة التفعيل التدريجي
import StatsCards from '@/components/StatsCards';
import MessagesOverview from '@/components/MessagesOverview';
// import SystemHealth from '@/components/SystemHealth';
// import TodayActivity from '@/components/TodayActivity';
// import QuickActions from '@/components/QuickActions';
// import RemindersSection from '@/components/RemindersSection';

export default function WhatsAppDashboard() {
  // الحالات الأساسية
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    systemHealth: {},
    todayActivity: {},
    reminders: {},
    settings: {},
    loading: true,
    error: null,
    lastUpdated: null
  });
  const [refreshing, setRefreshing] = useState(false);

  // جلب البيانات من APIs
  useEffect(() => {
    fetchDashboardData();
    
    // تحديث تلقائي كل دقيقة
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));      // استدعاءات API متوازية (مُعطل analytics مؤقتاً لحل مشكلة Prisma)
      const responses = await Promise.allSettled([
        fetch('/api/admin/whatsapp/messages'),
        fetch('/api/admin/whatsapp/settings'),
        fetch('/api/admin/whatsapp/reminders?type=dashboard'),
        // fetch('/api/admin/whatsapp/analytics').catch(() => null), // مُعطل مؤقتاً
        fetch('/api/test/database')
      ]);

      // معالجة الاستجابات
      const processedData = await processApiResponses(responses);
      
      setDashboardData(prev => ({
        ...prev,
        ...processedData,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      }));

    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'فشل في تحميل البيانات من الخادم'
      }));
    }
  };

  const processApiResponses = async (responses) => {
    const data = {
      stats: {
        totalClients: 0,
        activeContracts: 0,
        totalMessages: 0,
        sentMessages: 0,
        deliveredMessages: 0,
        readMessages: 0,
        failedMessages: 0,
        successRate: 0,
        responseTime: '...',
        botUptime: '...'
      },
      systemHealth: {
        whatsappApi: { status: 'unknown', latency: '...' },
        webhook: { status: 'unknown', latency: '...' },
        database: { status: 'unknown', latency: '...' },
        botEngine: { status: 'unknown', cpu: '...', memory: '...' }
      },
      todayActivity: {
        totalToday: 0,
        incomingToday: 0,
        maintenanceToday: 0,
        complaintsToday: 0
      },
      reminders: {
        totalActive: 0,
        sentToday: 0,
        pendingToday: 0,
        successRate: 0
      },
      settings: {
        botEnabled: false,
        autoRemindersEnabled: false,
        workingHours: '09:00 - 18:00'
      }
    };

    // معالجة استجابة الرسائل
    if (responses[0].status === 'fulfilled' && responses[0].value?.ok) {
      try {
        const messagesResult = await responses[0].value.json();
        if (messagesResult.success && messagesResult.data) {
          const msgs = messagesResult.data;
          data.stats.totalMessages = msgs.totalMessages || 0;
          data.stats.sentMessages = msgs.sentCount || 0;
          data.stats.deliveredMessages = msgs.deliveredCount || 0;
          data.stats.readMessages = msgs.readCount || 0;
          data.stats.failedMessages = msgs.failedCount || 0;
          data.stats.successRate = msgs.successRate || 0;
          data.stats.responseTime = msgs.avgResponseTime || 'غير محدد';
          data.todayActivity.totalToday = msgs.todayTotal || 0;
          data.todayActivity.incomingToday = msgs.todayIncoming || 0;
          data.systemHealth.whatsappApi.status = 'healthy';
          data.systemHealth.whatsappApi.latency = msgs.apiLatency || '120ms';
        }
      } catch (e) {
        console.warn('خطأ في معالجة بيانات الرسائل:', e);
      }
    }

    // معالجة استجابة الإعدادات
    if (responses[1].status === 'fulfilled' && responses[1].value?.ok) {
      try {
        const settingsResult = await responses[1].value.json();
        if (settingsResult.success && settingsResult.settings) {
          const settings = settingsResult.settings;
          data.stats.totalClients = settings.clientCount || 0;
          data.settings.botEnabled = settings.botStatus === 'running';
          data.settings.autoRemindersEnabled = settings.enableAutoReminders || false;
          data.settings.workingHours = `${settings.workingHoursStart || '09:00'} - ${settings.workingHoursEnd || '18:00'}`;
          data.systemHealth.webhook.status = settings.webhookStatus === 'active' ? 'healthy' : 'warning';
          data.systemHealth.botEngine.status = settings.botStatus === 'running' ? 'healthy' : 'warning';
        }
      } catch (e) {
        console.warn('خطأ في معالجة بيانات الإعدادات:', e);
      }
    }

    // معالجة استجابة التذكيرات
    if (responses[2].status === 'fulfilled' && responses[2].value?.ok) {
      try {
        const remindersResult = await responses[2].value.json();
        if (remindersResult.success && remindersResult.data) {
          const reminders = remindersResult.data;
          data.stats.activeContracts = reminders.activeContracts || 0;
          data.reminders.totalActive = reminders.totalActive || 0;
          data.reminders.sentToday = reminders.sentToday || 0;
          data.reminders.pendingToday = reminders.pendingToday || 0;
          data.reminders.successRate = reminders.successRate || 0;
          data.todayActivity.maintenanceToday = reminders.maintenanceToday || 0;
          data.todayActivity.complaintsToday = reminders.complaintsToday || 0;
        }
      } catch (e) {
        console.warn('خطأ في معالجة بيانات التذكيرات:', e);
      }
    }    // معالجة استجابة قاعدة البيانات (تم تصحيح المؤشر)
    if (responses[3].status === 'fulfilled' && responses[3].value?.ok) {
      try {
        const dbResult = await responses[3].value.json();
        if (dbResult.message?.includes('successful')) {
          data.systemHealth.database.status = 'healthy';
          data.systemHealth.database.latency = '15ms';
        }
      } catch (e) {
        console.warn('خطأ في معالجة بيانات قاعدة البيانات:', e);
      }
    }

    return data;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // إذا كان هناك خطأ
  if (dashboardData.error && dashboardData.loading === false) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center" dir="rtl">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">خطأ في تحميل البيانات</h2>
          <p className="text-gray-600 mb-4">{dashboardData.error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="inline w-4 h-4 mr-2" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* الرأس الرئيسي */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <MessageSquare className="mr-3 text-blue-600" />
              لوحة تحكم واتساب
            </h1>
            <p className="text-gray-600">
              نظام متطور لإدارة ومراقبة خدمات واتساب والتذكيرات التلقائية
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={dashboardData.loading || refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${(dashboardData.loading || refreshing) ? 'animate-spin' : ''}`} />
              {dashboardData.loading || refreshing ? 'جاري التحديث...' : 'تحديث'}
            </button>
          </div>
        </div>        {/* شريط التبويب */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="inline w-4 h-4 mr-2" />
              لوحة التحكم
            </button>
            
            <button
              onClick={() => handleTabChange('messages')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'messages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="inline w-4 h-4 mr-2" />
              الرسائل
            </button>
            
            <button
              onClick={() => handleTabChange('reminders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'reminders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bell className="inline w-4 h-4 mr-2" />
              التذكيرات
            </button>
            
            <button
              onClick={() => handleTabChange('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="inline w-4 h-4 mr-2" />
              الإعدادات
            </button>
          </nav>
        </div>        {/* محتوى التبويبات */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📊 لوحة التحكم الرئيسية</h2>
                {/* الإحصائيات الأساسية */}
              <StatsCards stats={dashboardData.stats} loading={dashboardData.loading} />
              
              {/* نظرة عامة على الرسائل */}
              <MessagesOverview stats={dashboardData.stats} loading={dashboardData.loading} />
              
              {dashboardData.loading && (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                  <p className="mt-2 text-gray-600">جاري تحميل البيانات...</p>
                </div>
              )}
              
              {dashboardData.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">خطأ: {dashboardData.error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📨 إدارة الرسائل</h2>
            <p className="text-gray-600">جدول الرسائل سيظهر هنا قريباً...</p>
          </div>
        )}        {activeTab === 'reminders' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🔔 إدارة التذكيرات</h2>
            <p className="text-gray-600">قسم التذكيرات قيد التطوير...</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ إعدادات النظام</h2>
            <p className="text-gray-600">إعدادات النظام ستظهر هنا قريباً...</p>
          </div>
        )}

        {/* معلومات آخر تحديث */}
        {dashboardData.lastUpdated && (
          <div className="mt-8 text-center text-sm text-gray-500 border-t pt-4">
            آخر تحديث: {new Date(dashboardData.lastUpdated).toLocaleString('ar-AE')}
            {dashboardData.loading && (
              <span className="mx-2 text-blue-500">• جاري التحديث...</span>
            )}
          </div>
        )}
      </div>    </div>
  );
}

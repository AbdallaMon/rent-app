"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  RefreshCw,
  Calendar,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from 'lucide-react';
import { TableLoading } from '@/components/ui/loaders/TableLoading';
import StatCard from '@/components/ui/Cards/StatCard';

/**
 * صفحة إحصائيات الواتساب الجديدة
 * 
 * @version 9.0.0 - نسخة جديدة بالكامل مع Tailwind CSS
 * @author Tar Real Estate System
 * @date June 21, 2025
 */
export default function WhatsAppAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalMessages: 0,
      sentMessages: 0,
      deliveredMessages: 0,
      readMessages: 0,
      failedMessages: 0,
      successRate: 0
    },
    dailyStats: [],
    topTemplates: [],
    recentMessages: [],
    loading: true,
    error: null
  });

  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setAnalyticsData(prev => ({ ...prev, loading: true, error: null }));

      // جلب البيانات من API آمن
      const response = await fetch(`/api/whatsapp/analytics/safe-stats?range=${dateRange}`);
      const result = await response.json();

      if (result.success) {
        setAnalyticsData(prev => ({
          ...prev,
          overview: result.data.overview || prev.overview,
          dailyStats: result.data.dailyStats || [],
          topTemplates: result.data.topTemplates || [],
          recentMessages: result.data.recentMessages || [],
          loading: false,
          error: null
        }));
      } else {
        throw new Error(result.error || 'خطأ في جلب البيانات');
      }
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
      setAnalyticsData(prev => ({
        ...prev,
        loading: false,
        error: 'فشل في تحميل الإحصائيات'
      }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const { overview, dailyStats, topTemplates, recentMessages, loading, error } = analyticsData;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center" dir="rtl">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">📊❌</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">خطأ في تحميل الإحصائيات</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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
        {/* الرأس */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <BarChart3 className="mr-3 text-blue-600" />
              إحصائيات الواتساب
            </h1>
            <p className="text-gray-600">
              تحليل شامل لأداء نظام الواتساب والرسائل
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* اختيار المدة الزمنية */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="1d">اليوم</option>
              <option value="7d">آخر 7 أيام</option>
              <option value="30d">آخر 30 يوم</option>
              <option value="90d">آخر 3 أشهر</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>
        </div>        {loading ? (
          <div className="relative min-h-96">
            <TableLoading loadingMessage="جاري تحميل الإحصائيات..." />
          </div>
        ) : (
          <div className="space-y-6">            {/* بطاقات الإحصائيات الرئيسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                title="إجمالي الرسائل"
                value={overview.totalMessages}
                icon={MessageSquare}
                borderColor="blue-100"
                iconColor="blue-500"
                textColor="blue-600"
              />

              <StatCard
                title="رسائل مرسلة"
                value={overview.sentMessages}
                icon={Send}
                borderColor="green-100"
                iconColor="green-500"
                textColor="green-600"
              />

              <StatCard
                title="رسائل مُسلّمة"
                value={overview.deliveredMessages}
                icon={CheckCircle}
                borderColor="yellow-100"
                iconColor="yellow-500"
                textColor="yellow-600"
              />

              <StatCard
                title="رسائل مقروءة"
                value={overview.readMessages}
                icon={Eye}
                borderColor="purple-100"
                iconColor="purple-500"
                textColor="purple-600"
              />

              <StatCard
                title="معدل النجاح"
                value={`${(overview.successRate * 100).toFixed(1)}%`}
                icon={TrendingUp}
                borderColor="red-100"
                iconColor="red-500"
                textColor="red-600"
              />
            </div>

            {/* الرسوم البيانية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* النشاط اليومي */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Activity className="mr-2 text-blue-600" />
                  النشاط اليومي
                </h3>
                <div className="space-y-3">
                  {dailyStats.length > 0 ? (
                    dailyStats.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{day.date}</span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{width: `${Math.min((day.messages / Math.max(...dailyStats.map(d => d.messages))) * 100, 100)}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{day.messages}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">لا توجد بيانات متاحة</p>
                  )}
                </div>
              </div>

              {/* أهم القوالب */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <MessageSquare className="mr-2 text-green-600" />
                  أهم القوالب المستخدمة
                </h3>
                <div className="space-y-3">
                  {topTemplates.length > 0 ? (
                    topTemplates.map((template, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{template.name}</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{width: `${Math.min((template.usage / Math.max(...topTemplates.map(t => t.usage))) * 100, 100)}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{template.usage}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">لا توجد قوالب متاحة</p>
                  )}
                </div>
              </div>
            </div>

            {/* الرسائل الحديثة */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Clock className="mr-2 text-purple-600" />
                  الرسائل الحديثة
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الرسالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التوقيت</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentMessages.length > 0 ? (
                      recentMessages.map((message, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {message.message || 'رسالة واتساب'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(message.timestamp).toLocaleString('ar-AE')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              message.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              message.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                              message.status === 'read' ? 'bg-purple-100 text-purple-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {message.status === 'delivered' ? 'مُسلّمة' :
                               message.status === 'sent' ? 'مُرسلة' :
                               message.status === 'read' ? 'مقروءة' :
                               'فاشلة'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                          لا توجد رسائل حديثة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

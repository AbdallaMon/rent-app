/**
 * لوحة التذكيرات - نسخة جديدة ومحدثة
 * 
 * @version 8.0.0 - مع APIs حقيقية
 * @author Tar Real Estate System
 * @date June 20, 2025
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Filter,
  Plus,
  Send,
  Pause,
  Play
} from 'lucide-react';

export default function RemindersPanel() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, completed, failed
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0
  });

  // جلب بيانات التذكيرات من API
  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/whatsapp/reminders');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setReminders(data.reminders || []);
      setStats(data.stats || {
        total: data.reminders?.length || 0,
        pending: data.reminders?.filter(r => r.status === 'pending')?.length || 0,
        completed: data.reminders?.filter(r => r.status === 'completed')?.length || 0,
        failed: data.reminders?.filter(r => r.status === 'failed')?.length || 0
      });
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // تحديث حالة تذكير
  const updateReminderStatus = async (reminderId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/whatsapp/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchReminders(); // إعادة تحميل البيانات
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  // تشغيل تذكيرات اليوم
  const runTodayReminders = async () => {
    try {
      const response = await fetch('/api/admin/whatsapp/reminders/run-today', {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchReminders(); // إعادة تحميل البيانات
        alert('تم تشغيل تذكيرات اليوم بنجاح');
      }
    } catch (error) {
      console.error('Error running today reminders:', error);
      alert('خطأ في تشغيل التذكيرات');
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  // تصفية التذكيرات حسب الفلتر المحدد
  const filteredReminders = reminders.filter(reminder => {
    if (filter === 'all') return true;
    return reminder.status === filter;
  });

  // تنسيق الوقت
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('ar-SA');
  };

  // اختيار اللون حسب الحالة
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="mr-2 text-gray-600">جاري تحميل التذكيرات...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">خطأ في تحميل التذكيرات</p>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <button 
              onClick={fetchReminders}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات التذكيرات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Bell className="w-8 h-8 text-blue-500" />
            <div className="mr-3">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-gray-600 text-sm">إجمالي التذكيرات</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div className="mr-3">
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-gray-600 text-sm">في الانتظار</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="mr-3">
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-gray-600 text-sm">مكتملة</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500" />
            <div className="mr-3">
              <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
              <p className="text-gray-600 text-sm">فاشلة</p>
            </div>
          </div>
        </div>
      </div>

      {/* أدوات التحكم */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h3 className="text-lg font-semibold text-gray-900">إدارة التذكيرات</h3>
            
            {/* فلتر */}
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع التذكيرات</option>
              <option value="pending">في الانتظار</option>
              <option value="completed">مكتملة</option>
              <option value="failed">فاشلة</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={runTodayReminders}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
            >
              <Play className="w-4 h-4 ml-2" />
              تشغيل تذكيرات اليوم
            </button>
            
            <button
              onClick={fetchReminders}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث
            </button>
          </div>
        </div>
      </div>

      {/* قائمة التذكيرات */}
      <div className="bg-white rounded-lg shadow-sm">
        {filteredReminders.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد تذكيرات للعرض</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العميل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الرسالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    موعد الإرسال
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReminders.map((reminder) => (
                  <tr key={reminder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 ml-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reminder.customer_name || 'غير محدد'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="w-4 h-4 ml-1" />
                            {reminder.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={reminder.message}>
                        {reminder.message}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reminder.message_type || 'رسالة عادية'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 ml-1" />
                        {formatTime(reminder.scheduled_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reminder.status)}`}>
                        {getStatusIcon(reminder.status)}
                        <span className="mr-1">
                          {reminder.status === 'pending' && 'في الانتظار'}
                          {reminder.status === 'completed' && 'مكتملة'}
                          {reminder.status === 'failed' && 'فاشلة'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {reminder.status === 'pending' && (
                          <button
                            onClick={() => updateReminderStatus(reminder.id, 'completed')}
                            className="text-green-600 hover:text-green-800"
                            title="تعليم كمكتملة"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {reminder.status !== 'failed' && (
                          <button
                            onClick={() => updateReminderStatus(reminder.id, 'failed')}
                            className="text-red-600 hover:text-red-800"
                            title="تعليم كفاشلة"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

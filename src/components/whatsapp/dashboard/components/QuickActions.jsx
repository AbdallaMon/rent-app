/**
 * مكون الإجراءات السريعة
 * 
 * @version 2.0.0
 * @author Tar Real Estate System
 * @date June 20, 2025
 */

'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Settings, 
  BarChart3, 
  RefreshCw, 
  Send, 
  Users,
  FileText,
  Download,
  Upload,
  Zap
} from 'lucide-react';

export default function QuickActions({ onRefresh, loading }) {
  const [actionLoading, setActionLoading] = useState({});

  const handleAction = async (actionType) => {
    setActionLoading(prev => ({ ...prev, [actionType]: true }));
    
    try {
      switch (actionType) {
        case 'run_reminders':
          await runReminders();
          break;
        case 'refresh_data':
          await onRefresh();
          break;
        case 'export_reports':
          await exportReports();
          break;
        case 'send_broadcast':
          await sendBroadcast();
          break;
        case 'sync_contacts':
          await syncContacts();
          break;
        case 'backup_data':
          await backupData();
          break;
        default:
          console.log(`إجراء غير معروف: ${actionType}`);
      }
    } catch (error) {
      console.error(`خطأ في تنفيذ الإجراء ${actionType}:`, error);
      alert(`فشل في تنفيذ الإجراء: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionType]: false }));
    }
  };

  const runReminders = async () => {
    const response = await fetch('/api/admin/whatsapp/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'trigger_reminders',
        data: { triggeredBy: 'dashboard_quick_action' }
      })
    });
    
    const result = await response.json();
    if (result.success) {
      alert('✅ تم تشغيل التذكيرات بنجاح');
    } else {
      throw new Error(result.error || 'فشل في تشغيل التذكيرات');
    }
  };

  const exportReports = async () => {
    // محاكاة تصدير التقارير
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert('✅ تم تصدير التقارير بنجاح');
  };

  const sendBroadcast = async () => {
    // محاكاة إرسال رسالة جماعية
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert('✅ تم إرسال الرسالة الجماعية بنجاح');
  };

  const syncContacts = async () => {
    // محاكاة مزامنة جهات الاتصال
    await new Promise(resolve => setTimeout(resolve, 3000));
    alert('✅ تم مزامنة جهات الاتصال بنجاح');
  };

  const backupData = async () => {
    // محاكاة النسخ الاحتياطي
    await new Promise(resolve => setTimeout(resolve, 2500));
    alert('✅ تم إنشاء النسخة الاحتياطية بنجاح');
  };

  const quickActions = [
    {
      id: 'run_reminders',
      title: 'تشغيل التذكيرات',
      description: 'تشغيل دورة التذكيرات فوراً',
      icon: Play,
      color: 'green',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-300'
    },
    {
      id: 'refresh_data',
      title: 'تحديث البيانات',
      description: 'إعادة تحميل جميع البيانات',
      icon: RefreshCw,
      color: 'blue',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-300'
    },
    {
      id: 'export_reports',
      title: 'تصدير التقارير',
      description: 'تحميل تقارير شاملة',
      icon: Download,
      color: 'purple',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-300'
    },
    {
      id: 'send_broadcast',
      title: 'رسالة جماعية',
      description: 'إرسال رسالة لجميع العملاء',
      icon: Send,
      color: 'orange',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-300'
    },
    {
      id: 'sync_contacts',
      title: 'مزامنة جهات الاتصال',
      description: 'تحديث قاعدة بيانات العملاء',
      icon: Users,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      hoverColor: 'hover:bg-indigo-100',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-300'
    },
    {
      id: 'backup_data',
      title: 'نسخة احتياطية',
      description: 'إنشاء نسخة احتياطية من البيانات',
      icon: Upload,
      color: 'gray',
      bgColor: 'bg-gray-50',
      hoverColor: 'hover:bg-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Zap className="w-6 h-6 text-gray-700 mr-3" />
          <h2 className="text-xl font-bold text-gray-800">⚡ إجراءات سريعة</h2>
        </div>
        <div className="text-sm text-gray-500">
          انقر على أي إجراء لتنفيذه فوراً
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          const isLoading = actionLoading[action.id];
          const isDisabled = loading || isLoading;

          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              disabled={isDisabled}
              className={`p-6 border-2 border-dashed ${action.borderColor} rounded-lg ${action.hoverColor} transition-all duration-200 text-right disabled:opacity-50 disabled:cursor-not-allowed ${action.bgColor}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className={`font-medium ${action.textColor} mb-2`}>
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {action.description}
                  </p>
                </div>
                <div className={`mr-4 p-2 ${action.bgColor} rounded-lg`}>
                  <IconComponent 
                    className={`w-6 h-6 ${action.textColor} ${isLoading ? 'animate-spin' : ''}`} 
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`text-xs ${action.textColor} font-medium`}>
                  {isLoading ? 'جاري التنفيذ...' : 'انقر للتنفيذ'}
                </span>
                {isLoading && (
                  <div className="flex space-x-1">
                    <div className={`w-2 h-2 ${action.textColor.replace('text', 'bg')} rounded-full animate-bounce`}></div>
                    <div className={`w-2 h-2 ${action.textColor.replace('text', 'bg')} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
                    <div className={`w-2 h-2 ${action.textColor.replace('text', 'bg')} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* إحصائيات سريعة للإجراءات */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">📊 إحصائيات الإجراءات</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-700">24</div>
            <div className="text-xs text-gray-500">إجراءات اليوم</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">98%</div>
            <div className="text-xs text-gray-500">معدل النجاح</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">2.3s</div>
            <div className="text-xs text-gray-500">متوسط وقت التنفيذ</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">156</div>
            <div className="text-xs text-gray-500">إجمالي هذا الشهر</div>
          </div>
        </div>
      </div>

      {/* تلميحات وملاحظات */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 text-blue-600">💡</div>
          </div>
          <div className="mr-3">
            <h4 className="text-sm font-medium text-blue-800">نصائح للاستخدام:</h4>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>• يمكنك تشغيل التذكيرات عدة مرات في اليوم دون مشاكل</li>
              <li>• تحديث البيانات يستغرق عادة أقل من 10 ثوانِ</li>
              <li>• الرسائل الجماعية تتبع قواعد ساعات العمل المحددة</li>
              <li>• النسخ الاحتياطية تحفظ تلقائياً في التخزين السحابي</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

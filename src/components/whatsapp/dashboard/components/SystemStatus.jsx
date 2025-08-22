/**
 * مكون لعرض حالة النظام
 */

import React from 'react';
import { getStatusColor, getStatusText, formatDateTime } from '../utils/helpers';

const SystemStatus = ({ 
  botStatus,
  loading = false,
  onRefresh
}) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border rounded">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statusItems = [
    {
      label: 'حالة البوت',
      status: botStatus.isActive,
      details: botStatus.isActive ? 'يعمل بشكل طبيعي' : 'غير نشط'
    },
    {
      label: 'قاعدة البيانات',
      status: botStatus.databaseStatus,
      details: botStatus.databaseStatus ? 'متصلة' : 'غير متصلة'
    },
    {
      label: 'الـ Webhook',
      status: botStatus.webhookStatus,
      details: botStatus.webhookStatus ? 'يعمل' : 'غير مفعل'
    },
    {
      label: 'نظام التذكيرات',
      status: botStatus.reminderStatus,
      details: botStatus.reminderDetails
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">حالة النظام</h2>
        <div className="flex items-center gap-2">
          {botStatus.lastActivity && (
            <span className="text-sm text-gray-500">
              آخر تحديث: {formatDateTime(botStatus.lastActivity)}
            </span>
          )}
          <button
            onClick={onRefresh}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            disabled={loading}
          >
            {loading ? 'جاري التحديث...' : 'تحديث'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusItems.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700">{item.label}</h3>
              <span className={`w-3 h-3 rounded-full ${
                item.status === true ? 'bg-green-500' : 
                item.status === false ? 'bg-red-500' : 'bg-yellow-500'
              }`}></span>
            </div>
            <p className={`text-sm font-medium ${getStatusColor(item.status)}`}>
              {getStatusText(item.status)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{item.details}</p>
          </div>
        ))}
      </div>
      
      {/* مؤشر الحالة العامة */}
      <div className="mt-4 p-3 rounded-lg bg-gray-50">
        <div className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded-full ${
            botStatus.isActive ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          <span className="font-medium">
            {botStatus.isActive ? 'النظام يعمل بشكل طبيعي' : 'النظام غير نشط'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;

/**
 * مكون نشاط اليوم
 * 
 * @version 2.0.0
 * @author Tar Real Estate System
 * @date June 20, 2025
 */

'use client';

import React from 'react';
import { 
  Calendar, 
  MessageCircle, 
  Wrench, 
  AlertCircle,
  TrendingUp,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export default function TodayActivity({ todayActivity, loading }) {
  const activities = [
    {
      label: 'إجمالي النشاط',
      value: todayActivity?.totalToday || 0,
      icon: Calendar,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      change: '+15',
      changeType: 'increase'
    },
    {
      label: 'رسائل واردة',
      value: todayActivity?.incomingToday || 0,
      icon: MessageCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
      change: '+8',
      changeType: 'increase'
    },
    {
      label: 'طلبات صيانة',
      value: todayActivity?.maintenanceToday || 0,
      icon: Wrench,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      change: '+3',
      changeType: 'increase'
    },
    {
      label: 'شكاوى مستلمة',
      value: todayActivity?.complaintsToday || 0,
      icon: AlertCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
      change: '-2',
      changeType: 'decrease'
    }
  ];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-6">
          <div className="w-6 h-6 bg-gray-300 rounded animate-pulse mr-3"></div>
          <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-12 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // حساب إجمالي النشاط
  const totalActivity = Object.values(todayActivity || {}).reduce((sum, value) => {
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="w-6 h-6 text-gray-700 mr-3" />
          <h2 className="text-xl font-bold text-gray-800">📈 نشاط اليوم</h2>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('ar-AE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {activities.map((activity, index) => {
          const IconComponent = activity.icon;
          const formattedValue = activity.value.toLocaleString('ar-AE');

          return (
            <div 
              key={index}
              className={`p-4 ${activity.bgColor} border ${activity.borderColor} rounded-lg hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`text-2xl font-bold ${activity.textColor}`}>
                  {formattedValue}
                </div>
                <IconComponent className={`w-6 h-6 ${activity.textColor}`} />
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">
                  {activity.label}
                </div>
                <div className="flex items-center space-x-1">
                  {activity.changeType === 'increase' ? (
                    <ArrowUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${
                    activity.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {activity.change}
                  </span>
                  <span className="text-xs text-gray-500">من أمس</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ملخص النشاط */}
      <div className="border-t border-gray-200 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* إجمالي النشاط */}
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {totalActivity.toLocaleString('ar-AE')}
            </div>
            <div className="text-sm text-gray-600 mb-2">إجمالي الأنشطة اليوم</div>
            <div className="flex items-center justify-center space-x-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">+24%</span>
              <span className="text-xs text-gray-500">مقارنة بالأمس</span>
            </div>
          </div>

          {/* النشاط الأكثر */}
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {Math.max(...activities.map(a => a.value)).toLocaleString('ar-AE')}
            </div>
            <div className="text-sm text-gray-600 mb-2">أعلى نشاط</div>
            <div className="text-xs text-gray-500">
              {activities.find(a => a.value === Math.max(...activities.map(act => act.value)))?.label || 'غير محدد'}
            </div>
          </div>

          {/* متوسط النشاط في الساعة */}
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {Math.round(totalActivity / 24).toLocaleString('ar-AE')}
            </div>
            <div className="text-sm text-gray-600 mb-2">متوسط/ساعة</div>
            <div className="text-xs text-gray-500">
              توزيع النشاط خلال اليوم
            </div>
          </div>
        </div>
      </div>

      {/* رسم بياني بسيط للاتجاه */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">📊 اتجاه النشاط</h3>
        <div className="flex items-end space-x-2 h-20">
          {[12, 8, 15, 22, 18, 25, 30, 28, 20, 15, 18, 24].map((height, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-400"
                style={{ height: `${height * 2}px` }}
              ></div>
              <div className="text-xs text-gray-500 mt-1">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center text-xs text-gray-500 mt-2">
          توزيع النشاط على مدار 12 ساعة الأخيرة
        </div>
      </div>
    </div>
  );
}

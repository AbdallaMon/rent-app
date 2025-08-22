/**
 * مكون نظرة عامة على الرسائل
 * 
 * @version 2.0.0
 * @author Tar Real Estate System
 * @date June 20, 2025
 */

'use client';

import React from 'react';
import { 
  Send, 
  CheckCircle, 
  Eye, 
  XCircle, 
  Clock,
  MessageSquare 
} from 'lucide-react';

export default function MessagesOverview({ stats, loading }) {
  const messageStats = [
    {
      label: 'رسائل مرسلة',
      value: stats?.sentMessages || 0,
      icon: Send,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      label: 'رسائل مُستلمة',
      value: stats?.deliveredMessages || 0,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      label: 'رسائل مقروءة',
      value: stats?.readMessages || 0,
      icon: Eye,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      label: 'رسائل فاشلة',
      value: stats?.failedMessages || 0,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      label: 'وقت الاستجابة',
      value: stats?.responseTime || '...',
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    }
  ];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-6">
          <div className="w-6 h-6 bg-gray-300 rounded animate-pulse mr-3"></div>
          <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-12 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <MessageSquare className="w-6 h-6 text-gray-700 mr-3" />
        <h2 className="text-xl font-bold text-gray-800">📊 إحصائيات الرسائل التفصيلية</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {messageStats.map((stat, index) => {
          const IconComponent = stat.icon;
          const formattedValue = typeof stat.value === 'number' 
            ? stat.value.toLocaleString('ar-AE')
            : stat.value;

          return (
            <div 
              key={index}
              className={`p-4 ${stat.bgColor} rounded-lg hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`text-2xl font-bold ${stat.textColor}`}>
                  {formattedValue}
                </div>
                <IconComponent className={`w-5 h-5 ${stat.textColor}`} />
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* نسب الأداء */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">📈 نسب الأداء</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* معدل التسليم */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">معدل التسليم</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats?.totalMessages > 0 
                ? ((stats.deliveredMessages / stats.totalMessages) * 100).toFixed(1) + '%'
                : '0%'
              }
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: stats?.totalMessages > 0 
                    ? `${(stats.deliveredMessages / stats.totalMessages) * 100}%`
                    : '0%'
                }}
              ></div>
            </div>
          </div>

          {/* معدل القراءة */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">معدل القراءة</span>
              <Eye className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              {stats?.deliveredMessages > 0 
                ? ((stats.readMessages / stats.deliveredMessages) * 100).toFixed(1) + '%'
                : '0%'
              }
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: stats?.deliveredMessages > 0 
                    ? `${(stats.readMessages / stats.deliveredMessages) * 100}%`
                    : '0%'
                }}
              ></div>
            </div>
          </div>

          {/* معدل الفشل */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">معدل الفشل</span>
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats?.totalMessages > 0 
                ? ((stats.failedMessages / stats.totalMessages) * 100).toFixed(1) + '%'
                : '0%'
              }
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: stats?.totalMessages > 0 
                    ? `${(stats.failedMessages / stats.totalMessages) * 100}%`
                    : '0%'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

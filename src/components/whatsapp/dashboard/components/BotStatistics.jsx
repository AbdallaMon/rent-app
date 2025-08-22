/**
 * مكون لعرض إحصائيات البوت
 */

import React from 'react';
import { formatNumber, getStatusColor, getStatusText } from '../utils/helpers';

const BotStatistics = ({ 
  messagesCount = 0, 
  requestsCount = 0, 
  complaintsCount = 0,
  loading = false 
}) => {
  const stats = [
    {
      title: 'إجمالي الرسائل',
      value: messagesCount,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'طلبات الصيانة',
      value: requestsCount,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'الشكاوى',
      value: complaintsCount,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className={`bg-white p-6 rounded-lg shadow-md ${stat.bgColor} border-r-4 border-r-current`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>
                {formatNumber(stat.value)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <div className={`w-6 h-6 ${stat.color}`}>
                {/* يمكن إضافة أيقونات هنا */}
                <div className="w-full h-full rounded bg-current opacity-20"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BotStatistics;

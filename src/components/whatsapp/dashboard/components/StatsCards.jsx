/**
 * مكون البطاقات الإحصائية - نسخة محدثة
 * 
 * @version 2.0.0
 * @author Tar Real Estate System
 * @date June 20, 2025
 */

'use client';

import React from 'react';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  Activity
} from 'lucide-react';

export default function StatsCards({ stats, loading }) {
  const cards = [
    {
      title: 'إجمالي العملاء',
      value: stats?.totalClients || 0,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-500',
      trend: '+12%',
      description: 'من الشهر الماضي'
    },
    {
      title: 'العقود النشطة', 
      value: stats?.activeContracts || 0,
      icon: FileText,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-500',
      trend: '+8%',
      description: 'عقد جديد هذا الأسبوع'
    },
    {
      title: 'إجمالي الرسائل',
      value: stats?.totalMessages || 0,
      icon: MessageSquare,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-500',
      trend: '+25%',
      description: 'رسالة اليوم'
    },
    {
      title: 'معدل النجاح',
      value: `${((stats?.successRate || 0) * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-500',
      trend: '+5%',
      description: 'تحسن في الأداء'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-8 bg-gray-300 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="h-3 bg-gray-300 rounded w-12"></div>
              <div className="h-3 bg-gray-300 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        const formattedValue = typeof card.value === 'number' 
          ? card.value.toLocaleString('ar-AE')
          : card.value;

        return (
          <div 
            key={index}
            className={`bg-white p-6 rounded-lg shadow-lg border-r-4 ${card.borderColor} hover:shadow-xl transition-shadow duration-300`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${card.iconColor}`}>
                  {formattedValue}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <IconComponent className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-green-600">
                  {card.trend}
                </span>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">
                {card.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

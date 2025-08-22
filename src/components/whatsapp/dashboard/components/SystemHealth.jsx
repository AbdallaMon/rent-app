/**
 * مكون صحة النظام
 * 
 * @version 2.0.0
 * @author Tar Real Estate System
 * @date June 20, 2025
 */

'use client';

import React from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Smartphone, 
  Webhook,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';

export default function SystemHealth({ systemHealth, loading }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-300',
          dot: 'bg-green-500',
          icon: '✅'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          border: 'border-yellow-300',
          dot: 'bg-yellow-500',
          icon: '⚠️'
        };
      case 'error':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-300',
          dot: 'bg-red-500',
          icon: '❌'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-300',
          dot: 'bg-gray-500',
          icon: '🔄'
        };
    }
  };

  const services = [
    {
      name: 'واتساب API',
      status: systemHealth?.whatsappApi?.status || 'loading',
      latency: systemHealth?.whatsappApi?.latency || '...',
      icon: Smartphone,
      description: 'اتصال مع API واتساب',
      details: 'Business API Status'
    },
    {
      name: 'Webhook',
      status: systemHealth?.webhook?.status || 'loading',
      latency: systemHealth?.webhook?.latency || '...',
      icon: Webhook,
      description: 'استقبال الرسائل الواردة',
      details: 'Incoming Messages'
    },
    {
      name: 'قاعدة البيانات',
      status: systemHealth?.database?.status || 'loading',
      latency: systemHealth?.database?.latency || '...',
      icon: Database,
      description: 'اتصال قاعدة البيانات',
      details: 'MySQL Connection'
    },
    {
      name: 'محرك البوت',
      status: systemHealth?.botEngine?.status || 'loading',
      latency: `CPU: ${systemHealth?.botEngine?.cpu || '...'} | RAM: ${systemHealth?.botEngine?.memory || '...'}`,
      icon: Cpu,
      description: 'أداء نظام البوت',
      details: 'Bot Performance'
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
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </div>
              <div className="h-3 bg-gray-300 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <Activity className="w-6 h-6 text-gray-700 mr-3" />
        <h2 className="text-xl font-bold text-gray-800">⚡ مراقبة صحة النظام</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service, index) => {
          const IconComponent = service.icon;
          const statusStyle = getStatusColor(service.status);

          return (
            <div 
              key={index}
              className={`p-4 ${statusStyle.bg} border ${statusStyle.border} rounded-lg hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${statusStyle.dot} animate-pulse`}></div>
                  <span className={`font-medium ${statusStyle.text}`}>
                    {service.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <IconComponent className={`w-5 h-5 ${statusStyle.text}`} />
                  <span className="text-xl">{statusStyle.icon}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className={`text-sm ${statusStyle.text} font-medium`}>
                  {service.latency}
                </div>
                <div className="text-xs text-gray-600">
                  {service.description}
                </div>
                <div className="text-xs text-gray-500">
                  {service.details}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ملخص الحالة العامة */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* الحالة العامة */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">الحالة العامة</span>
              <Server className="w-4 h-4 text-gray-600" />
            </div>
            <div className="text-lg font-bold text-green-600">
              {getOverallStatus(systemHealth)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              جميع الخدمات تعمل بشكل طبيعي
            </div>
          </div>

          {/* وقت التشغيل */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">وقت التشغيل</span>
              <Activity className="w-4 h-4 text-gray-600" />
            </div>
            <div className="text-lg font-bold text-blue-600">
              99.9%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              آخر 30 يوم
            </div>
          </div>

          {/* متوسط الاستجابة */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">متوسط الاستجابة</span>
              <Wifi className="w-4 h-4 text-gray-600" />
            </div>
            <div className="text-lg font-bold text-indigo-600">
              {getAverageLatency(systemHealth)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              جميع الخدمات
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// دالة مساعدة لحساب الحالة العامة
function getOverallStatus(systemHealth) {
  if (!systemHealth) return 'غير محدد';
  
  const services = Object.values(systemHealth);
  const healthyCount = services.filter(service => service?.status === 'healthy').length;
  const totalCount = services.length;
  
  if (healthyCount === totalCount) return 'ممتاز';
  if (healthyCount >= totalCount * 0.75) return 'جيد';
  if (healthyCount >= totalCount * 0.5) return 'متوسط';
  return 'يحتاج انتباه';
}

// دالة مساعدة لحساب متوسط وقت الاستجابة
function getAverageLatency(systemHealth) {
  if (!systemHealth) return '...';
  
  const latencies = [];
  
  if (systemHealth.whatsappApi?.latency) {
    const latency = parseFloat(systemHealth.whatsappApi.latency.replace('ms', ''));
    if (!isNaN(latency)) latencies.push(latency);
  }
  
  if (systemHealth.webhook?.latency) {
    const latency = parseFloat(systemHealth.webhook.latency.replace('ms', ''));
    if (!isNaN(latency)) latencies.push(latency);
  }
  
  if (systemHealth.database?.latency) {
    const latency = parseFloat(systemHealth.database.latency.replace('ms', ''));
    if (!isNaN(latency)) latencies.push(latency);
  }
  
  if (latencies.length === 0) return '...';
  
  const average = latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
  return `${Math.round(average)}ms`;
}

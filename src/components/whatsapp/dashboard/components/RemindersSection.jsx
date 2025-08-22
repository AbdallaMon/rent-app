'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Settings, 
  Play,
  Calendar,
  MessageSquare,
  Users,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function RemindersSection() {
  const [remindersData, setRemindersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchRemindersData();
  }, []);

  const fetchRemindersData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/whatsapp/reminders?type=dashboard');
      const data = await response.json();
      
      if (data.success) {
        setRemindersData(data.data);
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات التذكيرات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRemindersData();
    setRefreshing(false);
  };

  const handleRunReminders = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/whatsapp/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'trigger_reminders',
          data: { triggeredBy: 'admin' }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('تم تشغيل التذكيرات بنجاح');
        await fetchRemindersData();
      } else {
        alert('فشل في تشغيل التذكيرات');
      }
    } catch (error) {
      console.error('خطأ في تشغيل التذكيرات:', error);
      alert('حدث خطأ أثناء تشغيل التذكيرات');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const summary = remindersData?.summary || {};
  const todaySummary = remindersData?.todaySummary || {};
  const successRate = parseFloat(remindersData?.deliveryStats?.successRate || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">نظام التذكيرات</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className={`h-4 w-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleRunReminders}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            تشغيل التذكيرات
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="إعدادات التذكيرات"
          >
            <Settings className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="التذكيرات اليوم"
          value={todaySummary.total || 0}
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          title="💰 تذكيرات الدفع"
          value={summary.byType?.payment || 0}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="📋 انتهاء العقود"
          value={summary.byType?.contract || 0}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="🔧 تذكيرات الصيانة"
          value={summary.byType?.maintenance || 0}
          icon={Settings}
          color="orange"
        />
        <StatCard
          title="تم الاستلام ✅"
          value={summary.byStatus?.delivered || 0}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="معدل الاستلام"
          value={`${successRate}%`}
          icon={TrendingUp}
          color={successRate > 80 ? "green" : successRate > 50 ? "yellow" : "red"}
        />
      </div>

      {/* Recent Reminders */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            آخر التذكيرات المُرسلة ({remindersData?.reminders?.length || 0})
          </h4>
        </div>
        <div className="p-4">
          {remindersData?.reminders?.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {remindersData.reminders.slice(0, 10).map((reminder, index) => (
                <ReminderCard key={reminder.id || index} reminder={reminder} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد تذكيرات حديثة</p>
          )}
        </div>
      </div>
    </div>
  );
}

// مكون الإحصائية الفردية
function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-6 w-6 opacity-60" />
      </div>
    </div>
  );
}

// مكون عرض التذكير الفردي
function ReminderCard({ reminder }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'delivered': return 'text-green-600 bg-green-50 border-green-200';
      case 'read': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'sent': return 'مُرسل';
      case 'delivered': return 'مُستلم ✅';
      case 'read': return 'مقروء ✅✅';
      case 'failed': return 'فشل ❌';
      default: return 'غير محدد';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'payment_reminder': return '💰 تذكير دفع';
      case 'contract_expiry_reminder': return '📋 تذكير انتهاء عقد';
      case 'maintenance_reminder': return '🔧 تذكير صيانة';
      default: return '📨 تذكير عام';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'read': return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  // استخراج معلومات العقار والوحدة
  const getPropertyInfo = (client) => {
    if (!client) return null;
    
    // البحث في الوحدات المرتبطة بالعميل
    if (client.units && client.units.length > 0) {
      const unit = client.units[0]; // أخذ أول وحدة
      return {
        propertyName: unit.property?.name || 'عقار غير محدد',
        propertyId: unit.property?.propertyId || '',
        unitNumber: unit.number || unit.unitId || 'غير محدد',
        floor: unit.floor ? `الطابق ${unit.floor}` : ''
      };
    }
    
    // البحث في العقارات المملوكة
    if (client.properties && client.properties.length > 0) {
      const property = client.properties[0];
      const unit = property.units && property.units.length > 0 ? property.units[0] : null;
      return {
        propertyName: property.name || 'عقار غير محدد',
        propertyId: property.propertyId || '',
        unitNumber: unit ? (unit.number || unit.unitId || 'غير محدد') : 'غير محدد',
        floor: unit && unit.floor ? `الطابق ${unit.floor}` : ''
      };
    }
    
    return null;
  };

  const propertyInfo = getPropertyInfo(reminder.client);
  const isDelivered = ['delivered', 'read'].includes(reminder.status);

  return (
    <div className={`p-4 border-2 rounded-lg hover:bg-gray-50 transition-all ${getStatusColor(reminder.status)}`}>
      {/* Header with status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${getStatusColor(reminder.status)}`}>
            {getStatusIcon(reminder.status)}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(reminder.status)}`}>
              {getStatusText(reminder.status)}
            </span>
            {isDelivered && (
              <span className="text-xs text-green-600 font-medium">
                ✅ تم الاستلام
              </span>
            )}
          </div>
        </div>        <span className="text-xs text-gray-500">
          {new Date(reminder.sentAt).toLocaleDateString('en-US', { 
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })} {new Date(reminder.sentAt).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
          })}
        </span>
      </div>

      {/* Client Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-900">
            {reminder.client?.name || 'عميل غير معروف'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-mono">
            {reminder.recipient}
          </span>
          {reminder.client?.phone && reminder.client.phone !== reminder.recipient && (
            <span className="text-xs text-gray-400">
              (هاتف العميل: {reminder.client.phone})
            </span>
          )}
        </div>

        {propertyInfo && (
          <>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                🏢 {propertyInfo.propertyName}
                {propertyInfo.propertyId && (
                  <span className="text-xs text-gray-400 ml-1">
                    ({propertyInfo.propertyId})
                  </span>
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                🏠 وحدة: {propertyInfo.unitNumber}
                {propertyInfo.floor && (
                  <span className="text-xs text-gray-400 ml-1">
                    - {propertyInfo.floor}
                  </span>
                )}
              </span>
            </div>
          </>
        )}        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {getTypeText(reminder.messageType)}
          </span>
        </div>

        {/* معلومات إضافية من metadata */}
        {reminder.metadata && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            {reminder.messageType === 'payment_reminder' && (
              <div className="space-y-1">                {reminder.metadata.amount && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">💰 قيمة القسط:</span>
                    <span className="text-sm font-bold text-green-600">
                      {parseFloat(reminder.metadata.amount).toLocaleString('en-US')} AED
                    </span>
                  </div>
                )}
                {reminder.metadata.dueDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">📅 تاريخ الاستحقاق:</span>
                    <span className="text-sm font-medium text-orange-600">
                      {reminder.metadata.dueDate}
                    </span>
                  </div>
                )}
                {reminder.metadata.daysUntilDue && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">⏰ أيام متبقية:</span>
                    <span className={`text-sm font-medium ${parseInt(reminder.metadata.daysUntilDue) <= 3 ? 'text-red-600' : 'text-blue-600'}`}>
                      {reminder.metadata.daysUntilDue} يوم
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {reminder.messageType === 'contract_expiry_reminder' && (
              <div className="space-y-1">                {reminder.metadata.totalValue && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">💵 قيمة العقد:</span>
                    <span className="text-sm font-bold text-green-600">
                      {parseFloat(reminder.metadata.totalValue).toLocaleString('en-US')} AED
                    </span>
                  </div>
                )}
                {reminder.metadata.endDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">📅 تاريخ الانتهاء:</span>
                    <span className="text-sm font-medium text-red-600">
                      {reminder.metadata.endDate}
                    </span>
                  </div>
                )}
                {reminder.metadata.daysUntilExpiry && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">⏰ أيام متبقية:</span>
                    <span className={`text-sm font-medium ${parseInt(reminder.metadata.daysUntilExpiry) <= 7 ? 'text-red-600' : 'text-orange-600'}`}>
                      {reminder.metadata.daysUntilExpiry} يوم
                    </span>
                  </div>
                )}
                {reminder.metadata.contractNumber && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">📋 رقم العقد:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {reminder.metadata.contractNumber}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message ID for debugging */}
      {reminder.messageId && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-400 font-mono">
            ID: {reminder.messageId.slice(-8)}
          </span>
        </div>
      )}
    </div>
  );
}

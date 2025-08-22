'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Clock, 
  Users, 
  Phone, 
  Bell, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  User,
  Headphones
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('reminders');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // إعدادات التذكيرات
  const [reminderSettings, setReminderSettings] = useState({
    paymentReminderDays: [7, 3, 1],
    contractReminderDays: [60, 30, 15, 7],
    maintenanceFollowupDays: [3, 7, 14],
    maxRetries: 3,
    messageDelay: 2000,
    enableAutoReminders: true,
    workingHoursStart: '09:00:00',
    workingHoursEnd: '18:00:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    enabledReminderTypes: ['payment_reminder', 'contract_expiry_reminder'],
    highPriorityThreshold: 3,
    mediumPriorityThreshold: 7,
    defaultLanguage: 'ar_AE',
    includeCompanySignature: true,
    isActive: true
  });

  // إعدادات فريق العمل
  const [teamSettings, setTeamSettings] = useState({
    technicianPhone: '',
    technicianName: '',
    notifyTechnicianForMaintenance: true,
    technicianWorkingHours: 'من 8:00 صباحاً إلى 5:00 مساءً',
    customerServicePhone: '',
    customerServiceName: '',
    notifyCustomerServiceForComplaints: true,
    notifyCustomerServiceForContacts: true,
    customerServiceWorkingHours: 'من 9:00 صباحاً إلى 6:00 مساءً',
    maxDailyNotifications: 10,
    notificationDelay: 5,
    enableUrgentNotifications: true,
    enableBackupNotifications: false,
    customNotificationMessage: ''
  });

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/whatsapp/settings');
      
      if (response.ok) {
        const data = await response.json();
        if (data.reminderSettings) {
          setReminderSettings(data.reminderSettings);
        }
        if (data.teamSettings) {
          setTeamSettings(data.teamSettings);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب الإعدادات:', error);
      showNotification('خطأ في جلب الإعدادات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/whatsapp/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminderSettings,
          teamSettings
        }),
      });

      if (response.ok) {
        showNotification('تم حفظ الإعدادات بنجاح!', 'success');
      } else {
        throw new Error('فشل في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      showNotification('خطأ في حفظ الإعدادات', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // تحديث أيام التذكيرات
  const updateReminderDays = (type, days) => {
    setReminderSettings(prev => ({
      ...prev,
      [type]: days.split(',').map(day => parseInt(day.trim())).filter(day => day > 0)
    }));
  };

  // تحديث أيام العمل
  const updateWorkingDays = (day, checked) => {
    setReminderSettings(prev => ({
      ...prev,
      workingDays: checked 
        ? [...prev.workingDays, day]
        : prev.workingDays.filter(d => d !== day)
    }));
  };

  // التحقق من صحة رقم الهاتف
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^971[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">جاري تحميل الإعدادات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* العنوان الرئيسي */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إعدادات الواتساب</h1>
                <p className="text-gray-600">إدارة إعدادات التذكيرات وفريق العمل</p>
              </div>
            </div>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
            </button>
          </div>
        </div>

        {/* إشعار النجاح/الخطأ */}
        {notification.show && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* التبويبات */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('reminders')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'reminders'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span>إعدادات التذكيرات</span>
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'system'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span>إعدادات النظام</span>
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'team'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>فريق العمل</span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* تبويب إعدادات التذكيرات */}
            {activeTab === 'reminders' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">أيام التذكيرات</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تذكيرات الدفع (أيام قبل الاستحقاق)
                      </label>
                      <input
                        type="text"
                        value={reminderSettings.paymentReminderDays.join(', ')}
                        onChange={(e) => updateReminderDays('paymentReminderDays', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="7, 3, 1"
                      />
                      <p className="text-xs text-gray-500 mt-1">مثال: 7, 3, 1 (أسبوع، 3 أيام، يوم واحد)</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تذكيرات العقود (أيام قبل انتهاء العقد)
                      </label>
                      <input
                        type="text"
                        value={reminderSettings.contractReminderDays.join(', ')}
                        onChange={(e) => updateReminderDays('contractReminderDays', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="60, 30, 15, 7"
                      />
                      <p className="text-xs text-gray-500 mt-1">مثال: 60, 30, 15, 7 (شهرين، شهر، أسبوعين، أسبوع)</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        متابعة الصيانة (أيام بعد الطلب)
                      </label>
                      <input
                        type="text"
                        value={reminderSettings.maintenanceFollowupDays.join(', ')}
                        onChange={(e) => updateReminderDays('maintenanceFollowupDays', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="3, 7, 14"
                      />
                      <p className="text-xs text-gray-500 mt-1">مثال: 3, 7, 14 (3 أيام، أسبوع، أسبوعين)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">خيارات التفعيل</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reminderSettings.enableAutoReminders}
                        onChange={(e) => setReminderSettings(prev => ({
                          ...prev,
                          enableAutoReminders: e.target.checked
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="mr-2 text-sm text-gray-700">
                        تفعيل التذكيرات التلقائية
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reminderSettings.includeCompanySignature}
                        onChange={(e) => setReminderSettings(prev => ({
                          ...prev,
                          includeCompanySignature: e.target.checked
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="mr-2 text-sm text-gray-700">
                        إدراج توقيع الشركة في الرسائل
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* تبويب إعدادات النظام */}
            {activeTab === 'system' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">إعدادات الإرسال</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عدد محاولات الإعادة
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={reminderSettings.maxRetries}
                        onChange={(e) => setReminderSettings(prev => ({
                          ...prev,
                          maxRetries: parseInt(e.target.value)
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">عدد المحاولات عند فشل إرسال الرسالة</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        التأخير بين الرسائل (بالميلي ثانية)
                      </label>
                      <input
                        type="number"
                        min="1000"
                        max="10000"
                        step="500"
                        value={reminderSettings.messageDelay}
                        onChange={(e) => setReminderSettings(prev => ({
                          ...prev,
                          messageDelay: parseInt(e.target.value)
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">التأخير لتجنب Rate Limiting (موصى به: 2000ms)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ساعات العمل</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        وقت البداية
                      </label>
                      <input
                        type="time"
                        value={reminderSettings.workingHoursStart}
                        onChange={(e) => setReminderSettings(prev => ({
                          ...prev,
                          workingHoursStart: e.target.value
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        وقت النهاية
                      </label>
                      <input
                        type="time"
                        value={reminderSettings.workingHoursEnd}
                        onChange={(e) => setReminderSettings(prev => ({
                          ...prev,
                          workingHoursEnd: e.target.value
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">أيام العمل</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'Sunday', label: 'الأحد' },
                      { key: 'Monday', label: 'الاثنين' },
                      { key: 'Tuesday', label: 'الثلاثاء' },
                      { key: 'Wednesday', label: 'الأربعاء' },
                      { key: 'Thursday', label: 'الخميس' },
                      { key: 'Friday', label: 'الجمعة' },
                      { key: 'Saturday', label: 'السبت' }
                    ].map(day => (
                      <div key={day.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={reminderSettings.workingDays.includes(day.key)}
                          onChange={(e) => updateWorkingDays(day.key, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="mr-2 text-sm text-gray-700">
                          {day.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* تبويب فريق العمل */}
            {activeTab === 'team' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    إعدادات الفني
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم هاتف الفني
                      </label>
                      <input
                        type="tel"
                        value={teamSettings.technicianPhone}
                        onChange={(e) => setTeamSettings(prev => ({
                          ...prev,
                          technicianPhone: e.target.value
                        }))}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          teamSettings.technicianPhone && !validatePhoneNumber(teamSettings.technicianPhone)
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                        }`}
                        placeholder="971501234567"
                      />
                      {teamSettings.technicianPhone && !validatePhoneNumber(teamSettings.technicianPhone) && (
                        <p className="text-xs text-red-500 mt-1">يجب أن يبدأ الرقم بـ 971 ويتكون من 12 رقماً</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم الفني
                      </label>
                      <input
                        type="text"
                        value={teamSettings.technicianName}
                        onChange={(e) => setTeamSettings(prev => ({
                          ...prev,
                          technicianName: e.target.value
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="أدخل اسم الفني"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ساعات عمل الفني
                      </label>
                      <input
                        type="text"
                        value={teamSettings.technicianWorkingHours}
                        onChange={(e) => setTeamSettings(prev => ({
                          ...prev,
                          technicianWorkingHours: e.target.value
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="من 8:00 صباحاً إلى 5:00 مساءً"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={teamSettings.notifyTechnicianForMaintenance}
                        onChange={(e) => setTeamSettings(prev => ({
                          ...prev,
                          notifyTechnicianForMaintenance: e.target.checked
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="mr-2 text-sm text-gray-700">
                        إرسال تنبيهات الصيانة للفني
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Headphones className="w-5 h-5 mr-2 text-green-600" />
                    إعدادات خدمة العملاء
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم هاتف خدمة العملاء
                      </label>
                      <input
                        type="tel"
                        value={teamSettings.customerServicePhone}
                        onChange={(e) => setTeamSettings(prev => ({
                          ...prev,
                          customerServicePhone: e.target.value
                        }))}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          teamSettings.customerServicePhone && !validatePhoneNumber(teamSettings.customerServicePhone)
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                        }`}
                        placeholder="971501234567"
                      />
                      {teamSettings.customerServicePhone && !validatePhoneNumber(teamSettings.customerServicePhone) && (
                        <p className="text-xs text-red-500 mt-1">يجب أن يبدأ الرقم بـ 971 ويتكون من 12 رقماً</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم خدمة العملاء
                      </label>
                      <input
                        type="text"
                        value={teamSettings.customerServiceName}
                        onChange={(e) => setTeamSettings(prev => ({
                          ...prev,
                          customerServiceName: e.target.value
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="أدخل اسم خدمة العملاء"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ساعات عمل خدمة العملاء
                      </label>
                      <input
                        type="text"
                        value={teamSettings.customerServiceWorkingHours}
                        onChange={(e) => setTeamSettings(prev => ({
                          ...prev,
                          customerServiceWorkingHours: e.target.value
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="من 9:00 صباحاً إلى 6:00 مساءً"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={teamSettings.notifyCustomerServiceForComplaints}
                          onChange={(e) => setTeamSettings(prev => ({
                            ...prev,
                            notifyCustomerServiceForComplaints: e.target.checked
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="mr-2 text-sm text-gray-700">
                          إرسال تنبيهات الشكاوى
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={teamSettings.notifyCustomerServiceForContacts}
                          onChange={(e) => setTeamSettings(prev => ({
                            ...prev,
                            notifyCustomerServiceForContacts: e.target.checked
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="mr-2 text-sm text-gray-700">
                          إرسال تنبيهات التواصل
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-orange-600" />
                    إعدادات التنبيهات
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الحد الأقصى للتنبيهات اليومية
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={teamSettings.maxDailyNotifications}
                        onChange={(e) => setTeamSettings(prev => ({
                          ...prev,
                          maxDailyNotifications: parseInt(e.target.value)
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تأخير التنبيهات (بالدقائق)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={teamSettings.notificationDelay}
                        onChange={(e) => setTeamSettings(prev => ({
                          ...prev,
                          notificationDelay: parseInt(e.target.value)
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={teamSettings.enableUrgentNotifications}
                        onChange={(e) => setTeamSettings(prev => ({
                          ...prev,
                          enableUrgentNotifications: e.target.checked
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="mr-2 text-sm text-gray-700">
                        تفعيل التنبيهات العاجلة
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={teamSettings.enableBackupNotifications}
                        onChange={(e) => setTeamSettings(prev => ({
                          ...prev,
                          enableBackupNotifications: e.target.checked
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="mr-2 text-sm text-gray-700">
                        تفعيل التنبيهات الاحتياطية
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رسالة تنبيه مخصصة
                  </label>
                  <textarea
                    value={teamSettings.customNotificationMessage}
                    onChange={(e) => setTeamSettings(prev => ({
                      ...prev,
                      customNotificationMessage: e.target.value
                    }))}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="أدخل رسالة تنبيه مخصصة (اختياري)"
                  />
                  <p className="text-xs text-gray-500 mt-1">ستُستخدم هذه الرسالة في التنبيهات الخاصة</p>
                </div>
              </div>
            )}
          </div>        </div>      </div>
    </div>
  );
}

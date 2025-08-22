/**
 * لوحة إعدادات الواتساب - نسخة جديدة ومحدثة
 * 
 * @version 8.0.0 - مع APIs حقيقية
 * @author Tar Real Estate System
 * @date June 20, 2025
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Smartphone, 
  MessageSquare, 
  Bell, 
  Shield, 
  Key,
  Link,
  Database,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  TestTube,
  Zap
} from 'lucide-react';

export default function SettingsPanel() {
  const [settings, setSettings] = useState({
    bot_status: false,
    webhook_url: '',
    phone_number: '',
    api_token: '',
    auto_reminders: true,
    reminder_time: '10:00',
    max_retries: 3,
    timeout_seconds: 30,
    debug_mode: false,
    backup_enabled: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showApiToken, setShowApiToken] = useState(false);
  const [testResults, setTestResults] = useState({});

  // جلب الإعدادات من API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/whatsapp/settings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSettings(data.settings || settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // حفظ الإعدادات
  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/whatsapp/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSuccess('تم حفظ الإعدادات بنجاح');
      
      // إخفاء رسالة النجاح بعد 3 ثوان
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // اختبار الاتصال
  const testConnection = async (type) => {
    try {
      setTestResults(prev => ({ ...prev, [type]: 'testing' }));

      let endpoint = '';
      switch (type) {
        case 'api':
          endpoint = '/api/admin/whatsapp/test/api';
          break;
        case 'webhook':
          endpoint = '/api/admin/whatsapp/test/webhook';
          break;
        case 'database':
          endpoint = '/api/admin/whatsapp/test/database';
          break;
        default:
          endpoint = '/api/admin/whatsapp/test/general';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      setTestResults(prev => ({ 
        ...prev, 
        [type]: response.ok ? 'success' : 'error'
      }));
    } catch (error) {
      console.error(`Error testing ${type}:`, error);
      setTestResults(prev => ({ ...prev, [type]: 'error' }));
    }
  };

  // تبديل حالة البوت
  const toggleBotStatus = async () => {
    const newStatus = !settings.bot_status;
    setSettings(prev => ({ ...prev, bot_status: newStatus }));
    
    try {
      const response = await fetch('/api/admin/whatsapp/bot/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        // إذا فشل، إرجاع الحالة السابقة
        setSettings(prev => ({ ...prev, bot_status: !newStatus }));
        throw new Error('فشل في تغيير حالة البوت');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const getTestIcon = (status) => {
    switch (status) {
      case 'testing': return <RefreshCw className="w-4 h-4 animate-spin text-yellow-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <TestTube className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="mr-2 text-gray-600">جاري تحميل الإعدادات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رسائل التنبيه */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 ml-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* إعدادات عامة */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 ml-2" />
            الإعدادات العامة
          </h3>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-sm text-gray-600">حالة البوت:</span>
            <button
              onClick={toggleBotStatus}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.bot_status ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.bot_status ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${settings.bot_status ? 'text-green-600' : 'text-gray-500'}`}>
              {settings.bot_status ? 'مفعل' : 'معطل'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* رقم الهاتف */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Smartphone className="w-4 h-4 inline ml-1" />
              رقم هاتف الواتساب
            </label>
            <input
              type="text"
              value={settings.phone_number}
              onChange={(e) => setSettings(prev => ({ ...prev, phone_number: e.target.value }))}
              placeholder="+966xxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* رابط الـ Webhook */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Link className="w-4 h-4 inline ml-1" />
              رابط الـ Webhook
            </label>
            <input
              type="url"
              value={settings.webhook_url}
              onChange={(e) => setSettings(prev => ({ ...prev, webhook_url: e.target.value }))}
              placeholder="https://yourapp.com/api/webhook"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* API Token */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="w-4 h-4 inline ml-1" />
              رمز API
            </label>
            <div className="relative">
              <input
                type={showApiToken ? "text" : "password"}
                value={settings.api_token}
                onChange={(e) => setSettings(prev => ({ ...prev, api_token: e.target.value }))}
                placeholder="أدخل رمز API الخاص بالواتساب"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowApiToken(!showApiToken)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* إعدادات التذكيرات */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Bell className="w-5 h-5 ml-2" />
          إعدادات التذكيرات
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* تفعيل التذكيرات التلقائية */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              التذكيرات التلقائية
            </label>
            <button
              onClick={() => setSettings(prev => ({ ...prev, auto_reminders: !prev.auto_reminders }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.auto_reminders ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.auto_reminders ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* وقت الإرسال */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وقت إرسال التذكيرات
            </label>
            <input
              type="time"
              value={settings.reminder_time}
              onChange={(e) => setSettings(prev => ({ ...prev, reminder_time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* عدد المحاولات */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحد الأقصى للمحاولات
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.max_retries}
              onChange={(e) => setSettings(prev => ({ ...prev, max_retries: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* مهلة الانتظار */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مهلة الانتظار (ثانية)
            </label>
            <input
              type="number"
              min="10"
              max="120"
              value={settings.timeout_seconds}
              onChange={(e) => setSettings(prev => ({ ...prev, timeout_seconds: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* إعدادات النظام */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Shield className="w-5 h-5 ml-2" />
          إعدادات النظام
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* وضع التطوير */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              وضع التطوير (Debug Mode)
            </label>
            <button
              onClick={() => setSettings(prev => ({ ...prev, debug_mode: !prev.debug_mode }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.debug_mode ? 'bg-yellow-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.debug_mode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* النسخ الاحتياطي */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              النسخ الاحتياطي التلقائي
            </label>
            <button
              onClick={() => setSettings(prev => ({ ...prev, backup_enabled: !prev.backup_enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.backup_enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.backup_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* اختبار الاتصال */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <TestTube className="w-5 h-5 ml-2" />
          اختبار الاتصال
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => testConnection('api')}
            disabled={testResults.api === 'testing'}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {getTestIcon(testResults.api)}
            <span className="mr-2">اختبار API</span>
          </button>

          <button
            onClick={() => testConnection('webhook')}
            disabled={testResults.webhook === 'testing'}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {getTestIcon(testResults.webhook)}
            <span className="mr-2">اختبار Webhook</span>
          </button>

          <button
            onClick={() => testConnection('database')}
            disabled={testResults.database === 'testing'}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {getTestIcon(testResults.database)}
            <span className="mr-2">اختبار قاعدة البيانات</span>
          </button>
        </div>
      </div>

      {/* أزرار الحفظ */}
      <div className="flex items-center justify-between">
        <button
          onClick={fetchSettings}
          className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          إعادة التحميل
        </button>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin ml-2" />
          ) : (
            <Save className="w-4 h-4 ml-2" />
          )}
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  );
}

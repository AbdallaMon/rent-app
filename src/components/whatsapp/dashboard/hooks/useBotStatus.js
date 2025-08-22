/**
 * Hook لإدارة حالة البوت
 * يتعامل مع فحص حالة البوت وتحديث البيانات
 */

import { useState, useEffect, useCallback } from 'react';

export const useBotStatus = () => {
  const [botStatus, setBotStatus] = useState({
    isActive: null,
    lastActivity: null,
    loading: true,
    webhookStatus: null,
    databaseStatus: null,
    reminderStatus: null,
    reminderDetails: 'غير معروف'
  });

  const checkBotStatus = useCallback(async () => {
    try {
      setBotStatus(prev => ({ ...prev, loading: true }));
      
      // فحص APIs مختلفة للحصول على الحالة الفعلي
      const apiChecks = await Promise.allSettled([
        fetch('/api/admin/whatsapp/messages?limit=1'),
        fetch('/api/admin/whatsapp/requests?limit=1'),
        fetch('/api/admin/whatsapp/complaints?limit=1'),
        fetch('/api/admin/whatsapp/dashboard'),
      ]);

      // فحص الـ webhook
      let webhookStatus = false;
      try {
        const webhookCheck = await fetch('/api/notifications/whatsapp/webhook', {
          method: 'GET'
        });
        webhookStatus = webhookCheck.status !== 404;
      } catch (e) {
        webhookStatus = false;
      }

      // فحص قاعدة البيانات
      let databaseStatus = false;
      try {
        const dbCheck = await fetch('/api/admin/whatsapp/messages?limit=1');
        databaseStatus = dbCheck.status < 500;
      } catch (e) {
        databaseStatus = false;
      }

      // فحص نظام التذكيرات
      let reminderStatus = false;
      let reminderDetails = 'غير معروف';
      
      try {
        const reminderApiCheck = await fetch('/api/admin/whatsapp/reminders');
        if (reminderApiCheck.status < 500) {
          reminderStatus = true;
          reminderDetails = 'API يعمل';
        }
      } catch (e) {
        try {
          const cronCheck = await fetch('/api/admin/whatsapp/dashboard?type=reminders');
          if (cronCheck.status < 500) {
            const cronData = await cronCheck.json();
            if (cronData.success) {
              reminderStatus = true;
              reminderDetails = 'نظام التذكيرات نشط';
            } else {
              reminderDetails = 'نظام التذكيرات غير نشط';
            }
          }
        } catch (e2) {
          reminderDetails = 'خطأ في فحص النظام';
        }
      }

      // تحديد حالة البوت
      const workingApis = apiChecks.filter(result => 
        result.status === 'fulfilled' && result.value.status < 500
      ).length;

      const isActive = workingApis >= 2 && databaseStatus;

      setBotStatus({
        isActive,
        lastActivity: new Date().toISOString(),
        loading: false,
        webhookStatus,
        databaseStatus,
        reminderStatus,
        reminderDetails
      });
    } catch (error) {
      console.error('Error checking bot status:', error);
      setBotStatus(prev => ({
        ...prev,
        isActive: false,
        loading: false,
        webhookStatus: false,
        databaseStatus: false,
        reminderStatus: false,
        reminderDetails: 'خطأ في الفحص'
      }));
    }
  }, []);

  useEffect(() => {
    checkBotStatus();
    // تحديث حالة البوت كل 30 ثانية
    const interval = setInterval(checkBotStatus, 30000);
    return () => clearInterval(interval);
  }, [checkBotStatus]);

  return {
    botStatus,
    refreshStatus: checkBotStatus
  };
};

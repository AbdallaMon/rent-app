# Webhook API (الهيكل الجديد)

**الوصف:** API البوت الأساسي في الهيكل الجديد
**المسار القديم:** `src/app/api/notifications/whatsapp/webhook`
**المسار الجديد:** `src/app/api/whatsapp/webhook`
**تاريخ الإنشاء:** ٢٠‏/٦‏/٢٠٢٥، ٢:٤٧:٠٦ ص

## الاستخدام

هذا الـ route يعمل بالتوازي مع المسار القديم. يمكنك استخدام:

- **المسار القديم:** `src/app/api/notifications/whatsapp/webhook` (يعمل كما هو)
- **المسار الجديد:** `src/app/api/whatsapp/webhook` (الهيكل المنظم)

## الاختبار

```bash
# اختبار المسار الجديد
curl -X GET "http://localhost:3000/api/whatsapp/..."
```

---
*تم إنشاؤه تلقائياً من سكريپت تطبيق الهيكل الجديد*

# 📱 إعداد النماذج الجاهزة في WhatsApp Business API
## WhatsApp Templates Setup Guide

## 🎯 النماذج المطلوبة:

تحتاج إلى إنشاء 4 نماذج في WhatsApp Business Manager:

### 1. تذكير الدفعة - عربي (`payment_reminder_ar`)
```
Category: UTILITY
Language: Arabic (ar)
Template Name: payment_reminder_ar

Header: 
🏢 شركة تار العقارية
💰 تذكير بقسط مستحق

Body:
عزيزي {{1}}،

لديك قسط بقيمة {{2}} درهم مستحق بتاريخ {{3}} (خلال {{4}} أيام).

يرجى التواصل معنا لترتيب عملية الدفع.

📱 للتواصل: +971547333111
🌐 شركة تار العقارية

Footer:
رسالة تلقائية من نظام إدارة العقارات
```

### 2. تذكير الدفعة - إنجليزي (`payment_reminder_en`)
```
Category: UTILITY
Language: English (en)
Template Name: payment_reminder_en

Header:
🏢 TAR Real Estate Company
💰 Payment Reminder

Body:
Dear {{1}},

You have a payment of {{2}} AED due on {{3}} (in {{4}} days).

Please contact us to arrange the payment.

📱 Contact: +971547333111
🌐 TAR Real Estate Company

Footer:
Automated message from property management system
```

### 3. تذكير انتهاء العقد - عربي (`contract_expiry_ar`)
```
Category: UTILITY
Language: Arabic (ar)
Template Name: contract_expiry_ar

Header:
🏢 شركة تار العقارية
📋 تذكير بانتهاء العقد

Body:
عزيزي {{1}}،

عقدك رقم {{2}} سينتهي بتاريخ {{3}} (خلال {{4}} أيام).

قيمة العقد: {{5}} درهم

يرجى التواصل معنا لتجديد العقد أو ترتيب تسليم الوحدة.

📱 للتجديد والاستفسار: +971547333111
🌐 شركة تار العقارية

Footer:
رسالة تلقائية من نظام إدارة العقارات
```

### 4. تذكير انتهاء العقد - إنجليزي (`contract_expiry_en`)
```
Category: UTILITY
Language: English (en)
Template Name: contract_expiry_en

Header:
🏢 TAR Real Estate Company
📋 Contract Expiry Reminder

Body:
Dear {{1}},

Your contract {{2}} will expire on {{3}} (in {{4}} days).

Contract value: {{5}} AED

Please contact us for contract renewal or unit handover arrangements.

📱 For renewal & inquiries: +971547333111
🌐 TAR Real Estate Company

Footer:
Automated message from property management system
```

## 🔧 خطوات الإعداد:

### 1. الدخول إلى WhatsApp Business Manager:
1. اذهب إلى https://business.facebook.com
2. اختر حسابك التجاري
3. من القائمة الجانبية، اختر "WhatsApp" → "Message Templates"

### 2. إنشاء النماذج:
1. انقر على "Create Template"
2. اختر "UTILITY" كفئة النموذج
3. أدخل اسم النموذج (مثل: payment_reminder_ar)
4. اختر اللغة (العربية أو الإنجليزية)
5. أدخل محتوى النموذج كما هو موضح أعلاه
6. تأكد من استخدام {{1}}, {{2}}, {{3}}, {{4}}, {{5}} للمتغيرات
7. أرسل النموذج للمراجعة

### 3. انتظار الموافقة:
- عادة تستغرق المراجعة 24-48 ساعة
- ستحصل على إشعار عند الموافقة أو الرفض
- في حالة الرفض، راجع الملاحظات وأعد التقديم

## 📋 معاملات النماذج:

### تذكيرات الدفعات:
- **{{1}}**: اسم العميل (رقم القسط + اسم العميل)
- **{{2}}**: مبلغ الدفعة (بالدرهم)
- **{{3}}**: تاريخ الاستحقاق (DD/MM/YYYY)
- **{{4}}**: عدد الأيام المتبقية

### تذكيرات العقود:
- **{{1}}**: اسم العميل
- **{{2}}**: رقم العقد
- **{{3}}**: تاريخ انتهاء العقد (DD/MM/YYYY)
- **{{4}}**: عدد الأيام المتبقية
- **{{5}}**: قيمة العقد الإجمالية (بالدرهم)

## 🧪 اختبار النماذج:

بعد الموافقة على النماذج، يمكنك اختبارها باستخدام:

```bash
# اختبار جميع النماذج
node scripts/test-contracts-payments-templates.js

# اختبار نموذج محدد
node scripts/test-single-template.js payment_reminder_ar
```

## ⚠️ ملاحظات مهمة:

### شروط الموافقة:
1. **المحتوى**: يجب أن يكون مفيداً وغير مزعج
2. **التصنيف**: استخدم UTILITY للتذكيرات
3. **المتغيرات**: لا تزيد عن 5 متغيرات لكل نموذج
4. **اللغة**: يجب أن تكون صحيحة نحوياً
5. **العلامة التجارية**: تأكد من ذكر اسم الشركة

### نصائح للموافقة السريعة:
- ✅ استخدم لغة واضحة ومهذبة
- ✅ اذكر الغرض من الرسالة بوضوح
- ✅ أضف معلومات الاتصال
- ✅ تجنب الكلمات التحفيزية المبالغ فيها
- ❌ لا تستخدم رموز تعبيرية كثيرة
- ❌ تجنب الكلمات التي قد تعتبر "سبام"

## 🔄 تحديث النظام:

بعد موافقة النماذج:

1. **تفعيل النماذج في النظام:**
   ```javascript
   // في automated-reminder-cron-job.js
   // النماذج جاهزة للاستخدام فوراً
   ```

2. **إضافة لغة العميل:**
   ```sql
   -- إضافة عمود اللغة لجدول العملاء
   ALTER TABLE Client ADD COLUMN preferredLanguage VARCHAR(5) DEFAULT 'ar';
   ALTER TABLE Renter ADD COLUMN preferredLanguage VARCHAR(5) DEFAULT 'ar';
   ```

3. **اختبار الإرسال:**
   ```bash
   # تشغيل النظام للمرة الأولى
   node scripts/automated-reminder-cron-job.js
   ```

## 📊 مراقبة الأداء:

بعد التفعيل، راقب:
- ✅ معدل التسليم (Delivery Rate)
- ✅ معدل القراءة (Read Rate)  
- ✅ معدل الاستجابة (Response Rate)
- ✅ شكاوى العملاء
- ✅ إحصائيات WhatsApp Business

---

**جميع النماذج جاهزة للتطبيق! 🚀**

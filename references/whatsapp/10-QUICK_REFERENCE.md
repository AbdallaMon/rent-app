# ⚡ مرجع سريع - نظام الواتساب

## 🚀 بدء سريع

### فحص النظام
```bash
npm run system:check
```

### فتح المراجع
```bash
npm run references:open
```

### فتح README المراجع
```bash
npm run references:readme
```

## 📁 الملفات الأساسية

### APIs
- `src/app/api/whatsapp/route.js` - API موحد
- `src/app/api/whatsapp/webhook/route.js` - البوت
- `src/app/api/whatsapp/reminders/route.js` - التذكيرات
- `src/app/api/whatsapp/settings/route.js` - الإعدادات

### واجهات المستخدم
- `src/app/whatsapp/dashboard/page.jsx` - لوحة التحكم
- `src/app/whatsapp/reminders/page.jsx` - التذكيرات
- `src/app/whatsapp/settings/page.jsx` - الإعدادات

### المكونات
- `src/app/UiComponents/Navigation/Navbar/Navbar.js` - القائمة
- `src/app/context/AuthProvider/AuthProvider.js` - الصلاحيات

## 🔧 أوامر npm مفيدة

### النظام
```bash
npm run system:check          # فحص النظام
npm run system:report         # عرض التقرير
npm run pre-dev              # فحص ما قبل التطوير
```

### المراجع  
```bash
npm run references:open       # فتح مجلد المراجع
npm run references:readme     # فتح README المراجع
npm run docs:whatsapp        # فتح دليل المستخدم
```

### التطوير
```bash
npm run dev                  # تشغيل الخادم
npm run build               # بناء المشروع
npm run start               # تشغيل الإنتاج
```

## 📊 حالة النظام الحالية

- **الملفات:** ✅ 11/11 (100%)
- **APIs:** ✅ 3/3 (100%) 
- **قاعدة البيانات:** ⚠️ 2/4 (50%)
- **روابط القائمة:** ✅ 6/6 (100%)
- **الهيكل:** ✅ 4/4 (100%)
- **الإجمالي:** ✅ 87.5% - جاهز للتطوير

## 🔗 روابط نظام الواتساب الصحيحة

### في القائمة الجانبية:
- `/whatsapp/dashboard` - لوحة تحكم الواتساب
- `/whatsapp/reminders` - تذكيرات الواتساب  
- `/whatsapp/settings` - إعدادات الواتساب

### تم إزالة الروابط القديمة:
- ❌ `/whatsapp-api` (لم تعد مستخدمة)
- ❌ `/whatsapp-new` (لم تعد مستخدمة)
- ❌ `/whatsapp-dashboard` (تم استبدالها بـ `/whatsapp/dashboard`)

## ⚠️ نقاط تحتاج انتباه

1. **schema.prisma** - غير موجود
2. **.env.local** - غير موجود
3. تحقق من إعدادات قاعدة البيانات

## 📚 مراجع سريعة

### قبل التطوير
1. `references/whatsapp/02-PRE_DEVELOPMENT_REVIEW_GUIDE.md`
2. شغل `npm run system:check`
3. راجع التقرير

### للمراجعة الشاملة
- `references/whatsapp/01-COMPREHENSIVE_SYSTEM_REFERENCE.md`

### دليل المستخدم
- `references/whatsapp/04-WHATSAPP_README.md`

## 🔍 البحث السريع

### العثور على ملف
```bash
# البحث في الكود
grep -r "function_name" src/

# البحث في المراجع
grep -r "keyword" references/whatsapp/
```

### فحص API معين
```bash
# فحص API الواتساب
curl http://localhost:3000/api/whatsapp

# فحص API التذكيرات  
curl http://localhost:3000/api/whatsapp/reminders
```

## 🎯 نصائح سريعة

1. **دائماً فحص النظام قبل التطوير**
2. **راجع المراجع عند الشك**
3. **حدث التقارير بعد التغييرات الكبيرة**
4. **استخدم npm scripts المعدة مسبقاً**
5. **احتفظ بنسخ احتياطية من قاعدة البيانات**

---
**آخر تحديث:** ${new Date().toLocaleDateString('ar-SA')}

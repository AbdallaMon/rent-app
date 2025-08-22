#!/bin/bash
# سكريبت نشر Vercel

echo "🚀 نشر التطبيق على Vercel..."

# 1. تحديث قاعدة البيانات
echo "📊 تحديث قاعدة البيانات..."
npx prisma generate
npx prisma db push

# 2. بناء التطبيق
echo "🔨 بناء التطبيق..."
npm run build

# 3. نشر على Vercel
echo "☁️ نشر على Vercel..."
vercel --prod

echo "✅ تم النشر بنجاح!"
echo ""
echo "📋 لا تنس:"
echo "1. تحديث متغيرات البيئة في Vercel Dashboard"
echo "2. تحديث Webhook URL في Facebook Developer Console"
echo "3. اختبار تسجيل الدخول والصلاحيات"

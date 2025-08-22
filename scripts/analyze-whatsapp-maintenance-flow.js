/**
 * تحليل شامل لمنطق طلبات الصيانة عبر WhatsApp
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function analyzeWhatsAppMaintenanceSystem() {
    console.log('🔍 تحليل شامل لنظام طلبات الصيانة عبر WhatsApp');
    console.log('=' .repeat(70));

    const prisma = new PrismaClient();

    try {
        // 1. فحص ملفات النظام المرتبطة بـ WhatsApp
        console.log('\n📁 فحص ملفات النظام:');
        
        const filesToCheck = [
            'src/lib/whatsapp.js',
            'src/lib/notifications.js',
            'src/app/api/whatsapp',
            'src/app/api/main',
            'src/app/api/request'
        ];

        for (const file of filesToCheck) {
            const fullPath = path.join(process.cwd(), file);
            if (fs.existsSync(fullPath)) {
                const stats = fs.statSync(fullPath);
                console.log(`   ✅ ${file} - ${stats.isDirectory() ? 'مجلد' : 'ملف'}`);
            } else {
                console.log(`   ❌ ${file} - غير موجود`);
            }
        }

        // 2. فحص API endpoints المرتبطة بطلبات الصيانة
        console.log('\n🔌 فحص API endpoints:');
        
        const apiPaths = [
            'src/app/api/main/maintenance-request',
            'src/app/api/request',
            'src/app/api/whatsapp',
            'src/app/api/handler.js'
        ];

        for (const apiPath of apiPaths) {
            const fullPath = path.join(process.cwd(), apiPath);
            if (fs.existsSync(fullPath)) {
                console.log(`   ✅ ${apiPath} موجود`);
            } else {
                console.log(`   ❌ ${apiPath} غير موجود`);
            }
        }

        // 3. فحص جداول قاعدة البيانات المرتبطة
        console.log('\n🗄️ فحص جداول قاعدة البيانات:');
        
        // جدول MaintenanceRequest
        const maintenanceRequests = await prisma.maintenanceRequest.findMany({
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        
        console.log(`   📋 MaintenanceRequest: ${maintenanceRequests.length} طلب حديث`);
        maintenanceRequests.forEach((req, index) => {
            console.log(`      ${index + 1}. العميل: ${req.client?.name} (${req.client?.phone})`);
            console.log(`         الوصف: ${req.description.substring(0, 50)}...`);
            console.log(`         التاريخ: ${req.createdAt}`);
        });

        // جدول WhatsApp Messages
        const whatsappMessages = await prisma.whatsappMessageLog.findMany({
            orderBy: { sentAt: 'desc' },
            take: 5
        });
        
        console.log(`\n   💬 WhatsappMessageLog: ${whatsappMessages.length} رسالة حديثة`);
        whatsappMessages.forEach((msg, index) => {
            console.log(`      ${index + 1}. إلى: ${msg.phoneNumber || 'غير محدد'}`);
            console.log(`         النوع: ${msg.messageType}`);
            console.log(`         التاريخ: ${msg.sentAt}`);
        });

        // فحص إذا كان هناك جدول للرسائل الواردة
        try {
            const incomingMessages = await prisma.whatsappIncomingMessage.findMany({
                take: 5,
                orderBy: { receivedAt: 'desc' }
            });
            console.log(`\n   📥 WhatsappIncomingMessage: ${incomingMessages.length} رسالة واردة`);
        } catch (error) {
            console.log(`\n   ❌ WhatsappIncomingMessage: جدول غير موجود`);
        }

        // 4. فحص آلية ربط العملاء بأرقام الهواتف
        console.log('\n📱 فحص آلية ربط العملاء بأرقام الهواتف:');
        
        const clientsWithPhones = await prisma.client.findMany({
            where: {
                phone: {
                    not: null
                }
            },
            select: {
                id: true,
                name: true,
                phone: true,
                _count: {
                    select: {
                        maintenanceRequests: true
                    }
                }
            },
            take: 10
        });

        console.log(`   👥 عملاء لديهم أرقام هواتف: ${clientsWithPhones.length}`);
        clientsWithPhones.forEach(client => {
            console.log(`      - ${client.name}: ${client.phone} (${client._count.maintenanceRequests} طلب صيانة)`);
        });

        // 5. تحليل تدفق العمل المتوقع
        console.log('\n🔄 تحليل تدفق العمل المتوقع:');
        console.log('   1️⃣ العميل يرسل رسالة واتساب للنظام');
        console.log('   2️⃣ النظام يستقبل الرسالة ويحدد رقم المرسل');
        console.log('   3️⃣ البحث عن العميل في قاعدة البيانات باستخدام رقم الهاتف');
        console.log('   4️⃣ تحليل محتوى الرسالة لتحديد نوع الطلب');
        console.log('   5️⃣ إنشاء طلب صيانة جديد في قاعدة البيانات');
        console.log('   6️⃣ إرسال رد تأكيدي للعميل');
        console.log('   7️⃣ إشعار الإدارة بالطلب الجديد');

        // 6. فحص الحالة الحالية للنظام
        console.log('\n⚙️ فحص الحالة الحالية:');
        
        // فحص إذا كان هناك webhook أو API لاستقبال رسائل WhatsApp
        const webhookFiles = [
            'src/app/api/whatsapp/webhook',
            'src/app/api/whatsapp/incoming',
            'src/app/api/webhook'
        ];

        console.log('   🎣 فحص Webhooks:');
        for (const webhook of webhookFiles) {
            const fullPath = path.join(process.cwd(), webhook);
            if (fs.existsSync(fullPath)) {
                console.log(`      ✅ ${webhook} موجود`);
            } else {
                console.log(`      ❌ ${webhook} غير موجود`);
            }
        }

        // 7. فحص إعدادات WhatsApp
        console.log('\n🔧 فحص إعدادات WhatsApp:');
        
        try {
            const whatsappConfig = process.env;
            const whatsappVars = Object.keys(whatsappConfig)
                .filter(key => key.includes('WHATSAPP') || key.includes('TWILIO'))
                .map(key => `${key}: ${whatsappConfig[key] ? 'موجود' : 'غير موجود'}`);
            
            if (whatsappVars.length > 0) {
                console.log('   📋 متغيرات البيئة:');
                whatsappVars.forEach(variable => {
                    console.log(`      ${variable}`);
                });
            } else {
                console.log('   ⚠️ لا توجد متغيرات بيئة واضحة لـ WhatsApp');
            }
        } catch (error) {
            console.log('   ❌ خطأ في قراءة متغيرات البيئة');
        }

    } catch (error) {
        console.error('❌ خطأ في التحليل:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeWhatsAppMaintenanceSystem().catch(console.error);

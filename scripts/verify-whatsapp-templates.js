// ملف التحقق من قوالب WhatsApp Business API
// WhatsApp Business API Templates Verification Script

const axios = require('axios');
require('dotenv').config();

/**
 * التحقق من وجود القوالب في WhatsApp Business API
 */
async function verifyWhatsAppTemplates() {
    console.log('🔍 بدء التحقق من قوالب WhatsApp Business API...\n');    // التحقق من وجود متغيرات البيئة المطلوبة
    const WHATSAPP_BUSINESS_API_TOKEN = process.env.WHATSAPP_BUSINESS_API_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID;
    const BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    
    if (!WHATSAPP_BUSINESS_API_TOKEN) {
        console.error('❌ خطأ: WHATSAPP_BUSINESS_API_TOKEN غير موجود في متغيرات البيئة');
        console.log('💡 تأكد من وجود WHATSAPP_BUSINESS_API_TOKEN في ملف .env');
        return false;
    }
    
    if (!BUSINESS_ACCOUNT_ID) {
        console.error('❌ خطأ: WHATSAPP_BUSINESS_ACCOUNT_ID غير موجود في متغيرات البيئة');
        console.log('💡 تأكد من وجود WHATSAPP_BUSINESS_ACCOUNT_ID في ملف .env');
        return false;
    }
    
    console.log(`🔑 استخدام Business Account ID: ${BUSINESS_ACCOUNT_ID}`);
    console.log(`🔑 Token متوفر: ${WHATSAPP_BUSINESS_API_TOKEN.substring(0, 20)}...`);
      try {
        // أولاً، نحاول الحصول على Business Account ID من Phone Number ID
        console.log('🔍 محاولة الحصول على Business Account ID...');
        
        let businessAccountId = WABA_ID;
          if (!businessAccountId) {
            try {
                const phoneInfoResponse = await axios.get(
                    `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${WHATSAPP_BUSINESS_API_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        params: {
                            fields: 'business_account_id,name,owner_business_info'
                        }
                    }
                );
                
                console.log('📋 معلومات Phone Number:', phoneInfoResponse.data);
                businessAccountId = phoneInfoResponse.data.business_account_id;
                
                if (businessAccountId) {
                    console.log(`✅ تم الحصول على Business Account ID: ${businessAccountId}`);
                } else {
                    console.log('⚠️ لم يتم العثور على business_account_id في الاستجابة');
                    
                    // نحاول طريقة أخرى - البحث عن Business Accounts المرتبطة بالتطبيق
                    console.log('🔍 محاولة البحث عن Business Accounts...');
                    const meResponse = await axios.get(
                        `https://graph.facebook.com/v22.0/me/businesses`,
                        {
                            headers: {
                                'Authorization': `Bearer ${WHATSAPP_BUSINESS_API_TOKEN}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    
                    console.log('📋 Business Accounts المتاحة:', meResponse.data);
                    
                    if (meResponse.data.data && meResponse.data.data.length > 0) {
                        businessAccountId = meResponse.data.data[0].id;
                        console.log(`✅ استخدام Business Account الأول: ${businessAccountId}`);
                    }
                }
                
            } catch (error) {
                console.log('⚠️ خطأ في الحصول على Business Account ID:', error.response?.data || error.message);
                console.log('📋 سنحاول استخدام أساليب بديلة...');
                
                // نحاول مباشرة مع Phone Number ID (قد لا يعمل لكن سنجرب)
                businessAccountId = PHONE_NUMBER_ID;
            }
        }
        
        // الآن نحاول الحصول على القوالب
        console.log(`🔍 محاولة الحصول على القوالب من ID: ${businessAccountId}...`);
        
        const response = await axios.get(
            `https://graph.facebook.com/v22.0/${businessAccountId}/message_templates`,
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_BUSINESS_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    fields: 'name,status,language,category,components'
                }
            }
        );
        
        const templates = response.data.data || [];
        console.log(`📋 تم العثور على ${templates.length} قالب مُسجل في WhatsApp Business API\n`);
        
        // البحث عن القوالب المطلوبة لعقود الإيجار
        const requiredTemplates = [
            'rent_agreement_creation',      // القالب العربي
            'rent_agreement_creation_en'    // القالب الإنجليزي
        ];
        
        const foundTemplates = {};
        const missingTemplates = [];
        
        // التحقق من كل قالب مطلوب
        requiredTemplates.forEach(templateName => {
            const found = templates.find(template => 
                template.name === templateName && 
                template.status === 'APPROVED'
            );
            
            if (found) {
                foundTemplates[templateName] = found;
                console.log(`✅ ${templateName}`);
                console.log(`   📍 اللغة: ${found.language}`);
                console.log(`   📍 الحالة: ${found.status}`);
                console.log(`   📍 الفئة: ${found.category}`);
                if (found.components) {
                    console.log(`   📍 المكونات: ${found.components.length} مكون`);
                }
                console.log('');
            } else {
                missingTemplates.push(templateName);
                console.log(`❌ ${templateName} - غير موجود أو غير مُوافق عليه`);
                console.log('');
            }
        });
        
        // البحث عن قوالب أخرى قد تكون ذات صلة
        console.log('🔍 البحث عن قوالب أخرى ذات صلة بعقود الإيجار:');
        const relatedTemplates = templates.filter(template => 
            (template.name.includes('rent') || 
             template.name.includes('agreement') || 
             template.name.includes('contract')) &&
            !requiredTemplates.includes(template.name)
        );
        
        if (relatedTemplates.length > 0) {
            relatedTemplates.forEach(template => {
                console.log(`🔄 ${template.name} (${template.language}) - ${template.status}`);
            });
        } else {
            console.log('   لا توجد قوالب أخرى ذات صلة');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 ملخص النتائج:');
        console.log('='.repeat(60));
        
        if (missingTemplates.length === 0) {
            console.log('🎉 جميع القوالب المطلوبة موجودة ومُوافق عليها!');
            console.log('✅ النظام جاهز للعمل');
            return true;
        } else {
            console.log('⚠️  قوالب مفقودة أو غير مُوافق عليها:');
            missingTemplates.forEach(template => {
                console.log(`   ❌ ${template}`);
            });
            console.log('\n💡 الإجراءات المطلوبة:');
            console.log('1. إنشاء القوالب المفقودة في WhatsApp Business Manager');
            console.log('2. انتظار الموافقة من Meta على القوالب');
            console.log('3. إعادة تشغيل هذا الاختبار');
            return false;
        }
        
    } catch (error) {
        console.error('❌ خطأ في التحقق من القوالب:');
        console.error('📍 رسالة الخطأ:', error.message);
        
        if (error.response) {
            console.error('📍 كود الحالة:', error.response.status);
            console.error('📍 تفاصيل الخطأ:', error.response.data);
            
            if (error.response.status === 401) {
                console.log('\n💡 حل المشكلة:');
                console.log('- تحقق من صحة WHATSAPP_BUSINESS_API_TOKEN');
                console.log('- تأكد من أن الـ token له صلاحيات الوصول للقوالب');            } else if (error.response.status === 400) {
                console.log('\n💡 حل المشكلة:');
                console.log('- تحقق من صحة Business Account ID أو Phone Number ID');
                console.log('- تأكد من أن الحساب التجاري مُفعل');
                console.log('- تأكد من أن التطبيق له صلاحيات الوصول للقوالب');
            }
        }
        
        return false;
    }
}

/**
 * اختبار إضافي: التحقق من إمكانية إرسال رسالة اختبارية
 */
async function testTemplateSending() {
    console.log('\n🧪 اختبار إرسال القوالب (اختياري)');
    console.log('ملاحظة: هذا يتطلب رقم هاتف مُتحقق منه');
    
    // يمكن إضافة اختبار إرسال هنا إذا لزم الأمر
    // لكن نتجنبه لتجنب إرسال رسائل غير مرغوب فيها
}

// تشغيل التحقق
if (require.main === module) {
    verifyWhatsAppTemplates()
        .then(success => {
            if (success) {
                console.log('\n🎯 التحقق مكتمل بنجاح!');
                process.exit(0);
            } else {
                console.log('\n⚠️ التحقق فشل - يلزم إجراءات إضافية');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 خطأ غير متوقع:', error.message);
            process.exit(1);
        });
}

module.exports = { verifyWhatsAppTemplates };

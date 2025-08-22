// اختبار جميع أسماء القوالب المحتملة للعثور على الأسماء الصحيحة
const axios = require('axios');
require('dotenv').config();

async function findAllTemplates() {
    console.log('🔍 البحث عن جميع القوالب المحتملة...\n');
    
    const token = process.env.WHATSAPP_BUSINESS_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID;
    const testRecipient = process.env.WHATSAPP_RECIPIENT_NUMBER;
    
    // جميع أسماء القوالب المحتملة من الكود والاستخدام الشائع
    const possibleTemplates = [
        // من الكود الموجود
        'rent_agreement_creation',
        'rent_agreement_creation_en', 
        'rent_agreement',
        'rent_agreement_en',
        
        // أسماء بديلة محتملة
        'rental_agreement',
        'rental_agreement_en',
        'rental_contract',
        'rental_contract_en',
        'contract_creation',
        'contract_creation_en',
        'lease_agreement',
        'lease_agreement_en',
        'property_contract',
        'property_contract_en',
        
        // أسماء مختصرة
        'rent_notification',
        'lease_notification',
        'contract_notification',
        'property_notification',
        
        // أسماء افتراضية شائعة
        'hello_world', // نعرف أنه موجود
        'sample_template',
        'test_template',
        'welcome_message',
        'notification_template',
        'default_template',
        
        // أسماء بناءً على الصيانة والشكاوى (من الكود)
        'maintenance_request',
        'maintenance_request_en',
        'complaint_notification',
        'complaint_notification_en',
        'technician_notification',
        'status_update',
        'status_update_en',
        
        // أسماء أخرى محتملة
        'rent_info',
        'rental_info',
        'property_info',
        'tenant_notification',
        'landlord_notification'
    ];
    
    const foundTemplates = [];
    const missingTemplates = [];
    
    console.log(`📋 سيتم اختبار ${possibleTemplates.length} قالب...\n`);
    
    for (let i = 0; i < possibleTemplates.length; i++) {
        const templateName = possibleTemplates[i];
        
        // نختبر بلغتين
        const languages = ['en_US', 'ar'];
        
        for (const lang of languages) {
            const displayName = `${templateName} (${lang})`;
            
            try {
                const response = await axios.post(
                    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
                    {
                        messaging_product: 'whatsapp',
                        to: testRecipient,
                        type: 'template',
                        template: {
                            name: templateName,
                            language: { code: lang }
                        }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                foundTemplates.push({
                    name: templateName,
                    language: lang,
                    messageId: response.data.messages[0].id
                });
                
                console.log(`✅ وُجد: ${displayName}`);
                
            } catch (error) {
                const errorMsg = error.response?.data?.error?.message || error.message;
                
                if (errorMsg.includes('Template name does not exist')) {
                    missingTemplates.push(displayName);
                    // لا نطبع هذا لتوفير المساحة
                } else if (errorMsg.includes('parameters does not match')) {
                    foundTemplates.push({
                        name: templateName,
                        language: lang,
                        note: 'موجود لكن يحتاج بارامترات'
                    });
                    console.log(`⚠️ موجود مع بارامترات: ${displayName}`);
                } else {
                    console.log(`❓ خطأ غير متوقع في ${displayName}: ${errorMsg}`);
                }
            }
            
            // انتظار قصير بين كل اختبار
            if (i % 10 === 0 && i > 0) {
                console.log(`⏳ تم اختبار ${i * 2}/${possibleTemplates.length * 2}...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 ملخص النتائج:');
    console.log('='.repeat(60));
    
    if (foundTemplates.length > 0) {
        console.log(`\n✅ القوالب الموجودة (${foundTemplates.length}):`);
        foundTemplates.forEach(template => {
            const note = template.note ? ` - ${template.note}` : '';
            console.log(`   📋 ${template.name} (${template.language})${note}`);
        });
    }
    
    console.log(`\n❌ القوالب المفقودة: ${missingTemplates.length}`);
    
    if (foundTemplates.length === 0) {
        console.log('\n🚨 لم يتم العثور على أي قوالب للعقارات أو الإيجار!');
        console.log('💡 يجب إنشاؤها في WhatsApp Business Manager');
    } else {
        console.log('\n🎯 يمكن استخدام القوالب الموجودة أو إنشاء قوالب جديدة');
    }
    
    return foundTemplates;
}

findAllTemplates().catch(console.error);

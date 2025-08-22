/**
 * 🔄 مهمة Cron Job لإرسال التذكيرات التلقائية - النسخة المصححة
 * ⏰ يُشغّل يومياً في الساعة 9:00 صباحاً لإرسال التذكيرات
 * 📱 يرسل تذكيرات للأقساط المستحقة والعقود المنتهية
 * 📊 يسجل جميع العمليات في قاعدة البيانات
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

// 📅 إعدادات التذكيرات الافتراضية (تُستخدم إذا لم تكن متوفرة في قاعدة البيانات)
const DEFAULT_REMINDER_CONFIG = {
    // التذكير بالأقساط قبل X أيام من الاستحقاق
    paymentReminderDays: [14, 7, 3, 1], // 14 أيام، 7 أيام، 3 أيام، يوم واحد
    
    // التذكير بانتهاء العقد قبل X أيام
    contractReminderDays: [90, 60, 30, 15, 7], // 3 أشهر، شهرين، شهر، 15 يوم، أسبوع
    
    // الحد الأقصى لمحاولات إعادة الإرسال
    maxRetries: 3,
    
    // فترة انتظار بين الرسائل (milliseconds)
    messageDelay: 2000
};

// 📱 إرسال رسالة WhatsApp
async function sendWhatsAppMessage(phoneNumber, message, messageType = 'reminder', metadata = null) {
    try {
        let requestBody;
        
        // تحديد اللغة المفضلة للعميل (من metadata أو افتراضياً عربي)
        const clientLanguage = metadata?.language || metadata?.clientLanguage || 'ar';
        const isEnglish = clientLanguage === 'en' || clientLanguage === 'english';
        
        // استخدام نماذج واتساب للتذكيرات مع دعم اللغتين
        if (messageType === 'payment_reminder' && metadata) {
            requestBody = {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'template',
                template: {
                    name: isEnglish ? 'payment_due_reminder_en' : 'payment_due_reminder',
                    language: {
                        code: isEnglish ? 'en' : 'ar_AE'
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                {
                                    type: 'text',
                                    text: metadata.renterName || (isEnglish ? 'Client' : 'العميل')
                                },
                                {
                                    type: 'text',
                                    text: metadata.amount || '0'
                                },
                                {
                                    type: 'text',
                                    text: metadata.dueDate || (isEnglish ? 'Not specified' : 'غير محدد')
                                },
                                {
                                    type: 'text',
                                    text: metadata.daysUntilDue || '0'
                                }
                            ]
                        }
                    ]
                }
            };
        } else if (messageType === 'contract_expiry_reminder' && metadata) {
            requestBody = {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'template',
                template: {
                    name: isEnglish ? 'contract_expiration_reminder_en' : 'contract_expiration',
                    language: {
                        code: isEnglish ? 'en' : 'ar_AE'
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                {
                                    type: 'text',
                                    text: metadata.renterName || (isEnglish ? 'Client' : 'العميل')
                                },
                                {
                                    type: 'text',
                                    text: metadata.contractNumber || (isEnglish ? 'Not specified' : 'غير محدد')
                                },
                                {
                                    type: 'text',
                                    text: metadata.endDate || (isEnglish ? 'Not specified' : 'غير محدد')
                                },
                                {
                                    type: 'text',
                                    text: metadata.daysUntilExpiry || '0'
                                },
                                {
                                    type: 'text',
                                    text: metadata.totalValue || '0'
                                }
                            ]
                        }
                    ]
                }
            };
        } else {
            // استخدام رسالة نصية عادية للرسائل الأخرى
            requestBody = {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: {
                    body: message
                }
            };
        }

        const response = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_BUSINESS_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ تم إرسال ${messageType} للرقم ${phoneNumber}`);
            
            // تسجيل في قاعدة البيانات - إزالة responseTime المُسبب للخطأ
            await prisma.whatsappMessageLog.create({
                data: {
                    messageId: data.messages[0].id,
                    recipient: phoneNumber,
                    messageType: messageType,
                    templateName: requestBody.type === 'template' ? requestBody.template.name : null,
                    language: requestBody.type === 'template' ? requestBody.template.language.code : null,
                    status: 'sent',
                    sentAt: new Date(),
                    metadata: metadata || null
                }
            });

            return { success: true, messageId: data.messages[0].id };
        } else {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
    } catch (error) {
        console.error(`❌ خطأ في إرسال ${messageType} للرقم ${phoneNumber}:`, error.message);
        
        // في حالة فشل النموذج، جرب الرسالة النصية
        if (messageType.includes('reminder') && metadata) {
            console.log(`🔄 محاولة إرسال رسالة نصية بدلاً من النموذج...`);
            return await sendTextMessage(phoneNumber, message, messageType, metadata);
        }
        
        return { success: false, error: error.message };
    }
}

// دالة مساعدة لإرسال رسالة نصية عند فشل النموذج - مصححة
async function sendTextMessage(phoneNumber, message, messageType, metadata) {
    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_BUSINESS_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: {
                    body: message
                }
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ تم إرسال ${messageType} كرسالة نصية للرقم ${phoneNumber}`);
            
            await prisma.whatsappMessageLog.create({
                data: {
                    messageId: data.messages[0].id,
                    recipient: phoneNumber,
                    messageType: messageType,
                    status: 'sent',
                    sentAt: new Date(),
                    metadata: metadata || null
                }
            });

            return { success: true, messageId: data.messages[0].id };
        } else {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
    } catch (error) {
        console.error(`❌ فشل في إرسال الرسالة النصية للرقم ${phoneNumber}:`, error.message);
        return { success: false, error: error.message };
    }
}

// جلب معلومات التواصل من قاعدة البيانات
async function getContactInfo(teamSettings) {
    return {
        customerServicePhone: teamSettings?.customerServicePhone || '971506111139',
        technicianPhone: teamSettings?.technicianPhone || '971506677779',
        customerServiceName: teamSettings?.customerServiceName || 'خدمة العملاء',
        technicianName: teamSettings?.technicianName || 'الفني'
    };
}

// إنشاء رسالة تذكير بالدفع - محدثة
function createPaymentReminderMessage(installment, daysUntilDue, contactInfo = null) {
    const renter = installment.rentAgreement.renter;
    const endDate = new Date(installment.endDate).toLocaleDateString('en-GB');
    
    // استخدام رقم خدمة العملاء من قاعدة البيانات
    const customerServicePhone = contactInfo?.customerServicePhone || '971506111139';
    
    let urgencyMessage = '';
    if (daysUntilDue <= 1) {
        urgencyMessage = '🚨 *عاجل - مستحق اليوم!*\n\n';
    } else if (daysUntilDue <= 3) {
        urgencyMessage = '⚠️ *تذكير هام*\n\n';
    } else {
        urgencyMessage = '📅 *تذكير مسبق*\n\n';
    }

    return `🏢 *شركة تار العقارية*

${urgencyMessage}عزيزي ${renter.firstName} ${renter.lastName}،

💰 *تذكير بقسط مستحق*
📅 تاريخ الاستحقاق: ${endDate} (خلال ${daysUntilDue} ${daysUntilDue === 1 ? 'يوم' : 'أيام'})
🏠 رقم العقد: ${installment.rentAgreement.rentAgreementNumber}

${daysUntilDue <= 1 ? 
'⏰ يُرجى التواصل معنا فوراً لتجنب أي رسوم إضافية.' : 
'📞 يُرجى التواصل معنا لترتيب عملية الدفع.'}

📱 للتواصل: +${customerServicePhone}
🌐 شركة تار العقارية

_رسالة تلقائية من نظام إدارة العقارات_`;
}

// إنشاء رسالة تذكير بانتهاء العقد - محدثة
function createContractExpiryReminderMessage(contract, daysUntilExpiry, contactInfo = null) {
    const renter = contract.renter;
    const endDate = new Date(contract.endDate).toLocaleDateString('en-GB');
    
    // استخدام رقم خدمة العملاء من قاعدة البيانات
    const customerServicePhone = contactInfo?.customerServicePhone || '971506111139';
    
    let actionMessage = '';
    if (daysUntilExpiry <= 7) {
        actionMessage = '🚨 *عاجل - يُرجى التواصل فوراً!*';
    } else if (daysUntilExpiry <= 30) {
        actionMessage = '⚠️ *يُرجى التواصل قريباً لتجديد العقد*';
    } else {
        actionMessage = '📞 *يُرجى التفكير في تجديد العقد*';
    }

    return `🏢 *شركة تار العقارية*

📋 *تذكير بانتهاء العقد*

عزيزي ${renter.firstName} ${renter.lastName}،

⏰ عقدك سينتهي خلال ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'يوم' : 'أيام'}
📅 تاريخ الانتهاء: ${endDate}
🏠 رقم العقد: ${contract.rentAgreementNumber}

${actionMessage}

📱 للتجديد والاستفسار: +${customerServicePhone}
🌐 شركة تار العقارية

_رسالة تلقائية من نظام إدارة العقارات_`;
}

// البحث عن الدفعات المستحقة - محدث ومُحسن
async function findDuePayments(reminderSettings) {
    console.log('🔍 البحث عن الدفعات المستحقة والمستحقة قريباً...');
    
    if (!reminderSettings.enableAutoReminders) {
        console.log('⚠️ التذكيرات التلقائية معطلة في الإعدادات');
        return [];
    }
    
    const duePayments = [];
    const now = new Date();
    
    // استخدام فترات التذكير المحدثة - شاملة أكثر
    const paymentReminderDays = [14, 7, 5, 3, 1]; // تضمين 5 أيام أيضاً
    
    console.log(`📅 البحث عن الدفعات خلال: ${paymentReminderDays} أيام`);

    // 1️⃣ البحث عن الدفعات المتأخرة (overdue)
    const overduePayments = await prisma.payment.findMany({
        where: {
            dueDate: { lt: now },
            status: { in: ['PENDING', 'OVERDUE'] },
            installmentId: { not: null },
            installment: {
                rentAgreement: {
                    status: 'ACTIVE',
                    renter: {
                        phone: { not: null }
                    }
                }
            }
        },
        include: {
            installment: {
                include: {
                    rentAgreement: {
                        include: {
                            renter: true
                        }
                    }
                }
            }
        },
        take: 20
    });

    console.log(`🚨 تم العثور على ${overduePayments.length} دفعة متأخرة`);

    overduePayments.forEach(payment => {
        const daysPastDue = Math.floor((now - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24));
        duePayments.push({
            ...payment,
            daysUntilDue: -daysPastDue,
            isOverdue: true,
            priority: daysPastDue > 30 ? 'critical' : 'high',
            rentAgreement: payment.installment.rentAgreement,
            endDate: payment.dueDate
        });
    });

    // 2️⃣ البحث عن الدفعات المستحقة قريباً
    for (const days of paymentReminderDays) {
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + days);
        
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
        
        const upcomingPayments = await prisma.payment.findMany({
            where: {
                dueDate: {
                    gte: startOfDay,
                    lt: endOfDay
                },
                status: 'PENDING',
                installmentId: { not: null },
                installment: {
                    rentAgreement: {
                        status: 'ACTIVE',
                        renter: {
                            phone: { not: null }
                        }
                    }
                }
            },
            include: {
                installment: {
                    include: {
                        rentAgreement: {
                            include: {
                                renter: true
                            }
                        }
                    }
                }
            }
        });

        console.log(`📅 خلال ${days} أيام: ${upcomingPayments.length} دفعة`);

        upcomingPayments.forEach(payment => {
            const exists = duePayments.find(existing => existing.id === payment.id);
            if (!exists) {
                duePayments.push({
                    ...payment,
                    daysUntilDue: days,
                    isOverdue: false,
                    priority: days <= 3 ? 'high' : 'normal',
                    rentAgreement: payment.installment.rentAgreement,
                    endDate: payment.dueDate
                });
            }
        });
    }

    console.log(`📊 إجمالي الدفعات للمعالجة: ${duePayments.length}`);
    return duePayments;
}

// معالجة إرسال التذكيرات مع إعادة المحاولة
async function sendReminderWithRetry(phoneNumber, message, messageType, metadata = null, reminderSettings) {
    const maxRetries = reminderSettings?.maxRetries || DEFAULT_REMINDER_CONFIG.maxRetries;
    let attempts = 0;
    
    while (attempts < maxRetries) {
        attempts++;
        
        const result = await sendWhatsAppMessage(phoneNumber, message, messageType, metadata);
        
        if (result.success) {
            return result;
        }
        
        if (attempts < maxRetries) {
            console.log(`⏳ إعادة المحاولة ${attempts + 1}/${maxRetries} للرقم ${phoneNumber}`);
            const delay = reminderSettings?.messageDelay || DEFAULT_REMINDER_CONFIG.messageDelay;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    console.error(`💥 فشل إرسال ${messageType} للرقم ${phoneNumber} بعد ${maxRetries} محاولات`);
    return { success: false, error: 'Max retries exceeded' };
}

// دالة لجلب إعدادات التذكيرات وفريق العمل
async function fetchAllSettings() {
    console.log('📋 جلب إعدادات التذكيرات من قاعدة البيانات...');
    
    let reminderSettings = await prisma.reminderSettings.findFirst({ 
        where: { id: 'default_reminder_settings' } 
    });
    
    if (!reminderSettings) {
        console.log('⚠️ إنشاء إعدادات افتراضية...');
        reminderSettings = await prisma.reminderSettings.create({
            data: {
                id: 'default_reminder_settings',
                paymentReminderDays: DEFAULT_REMINDER_CONFIG.paymentReminderDays,
                contractReminderDays: DEFAULT_REMINDER_CONFIG.contractReminderDays,
                maxRetries: DEFAULT_REMINDER_CONFIG.maxRetries,
                messageDelay: DEFAULT_REMINDER_CONFIG.messageDelay,
                enableAutoReminders: true,
                isActive: true,
                enabledReminderTypes: ["payment_reminder", "contract_expiry_reminder"]
            }
        });
    }
    
    let teamSettings = await prisma.whatsAppTeamSettings.findFirst({ 
        where: { id: 'default_team_settings' } 
    });
    
    if (!teamSettings) {
        console.log('⚠️ إنشاء إعدادات فريق عمل افتراضية...');
        teamSettings = await prisma.whatsAppTeamSettings.create({
            data: {
                id: 'default_team_settings',
                technicianPhone: '971506677779',
                customerServicePhone: '971506111139',
                isActive: true
            }
        });
    }
    
    return { reminderSettings, teamSettings };
}

// تشغيل مهمة التذكيرات الرئيسية
async function runReminderJob() {
    console.log('🚀 بدء مهمة التذكيرات التلقائية المُحسنة...');
    console.log(`⏰ الوقت: ${new Date().toLocaleString('ar-SA')}`);
    
    const results = {
        paymentReminders: { sent: 0, failed: 0 },
        contractReminders: { sent: 0, failed: 0 },
        errors: []
    };

    try {
        // جلب الإعدادات
        const settingsData = await fetchAllSettings();
        const reminderSettings = settingsData.reminderSettings;
        const teamSettings = settingsData.teamSettings;
        
        if (!reminderSettings.enableAutoReminders) {
            console.log('⚠️ التذكيرات التلقائية معطلة');
            return results;
        }
        
        console.log('✅ التذكيرات مفعلة - بدء المعالجة...');
        
        // معالجة تذكيرات الدفع
        console.log('\n💰 معالجة تذكيرات الأقساط...');
        const duePayments = await findDuePayments(reminderSettings);
        
        for (const payment of duePayments) {
            const renter = payment.installment.rentAgreement.renter;
            
            if (!renter.phone) {
                console.log(`⚠️ لا يوجد رقم هاتف للعميل: ${renter.firstName} ${renter.lastName}`);
                continue;
            }
            
            const formattedPhone = renter.phone.startsWith('971') ? renter.phone : `971${renter.phone.replace(/^0+/, '')}`;
            
            // تحقق من عدم الإرسال المتكرر
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setDate(today.getDate() + 1);
            
            const existingReminder = await prisma.whatsappMessageLog.findFirst({
                where: {
                    recipient: formattedPhone,
                    messageType: { in: ['payment_reminder', 'payment_reminder_test'] },
                    status: { in: ['sent', 'delivered', 'read'] },
                    sentAt: {
                        gte: today,
                        lt: endOfDay
                    }
                }
            });
            
            if (existingReminder) {
                console.log(`⏭️ تم إرسال تذكير مسبقاً اليوم للرقم ${formattedPhone} - تخطي`);
                continue;
            }
            
            // إعداد معلومات التواصل والرسالة
            const contactInfo = await getContactInfo(teamSettings);
            const message = createPaymentReminderMessage(payment, payment.daysUntilDue, contactInfo);
            
            const metadata = {
                paymentId: payment.id,
                renterName: `${renter.firstName || ''} ${renter.lastName || ''}`.trim() || 'العميل',
                amount: payment.amount.toString(),
                dueDate: new Date(payment.dueDate).toLocaleDateString('en-GB'),
                daysUntilDue: (payment.daysUntilDue || 0).toString(),
                contractNumber: payment.installment.rentAgreement?.rentAgreementNumber || 'غير محدد',
                reminderType: 'payment_reminder',
                priority: payment.priority || 'normal'
            };
            
            console.log(`📤 إرسال تذكير للدفع ${payment.id} - ${metadata.renterName} - خلال ${payment.daysUntilDue} أيام`);
            
            const result = await sendReminderWithRetry(formattedPhone, message, 'payment_reminder', metadata, reminderSettings);
            
            if (result.success) {
                results.paymentReminders.sent++;
                console.log(`✅ تم إرسال تذكير الدفع بنجاح للرقم ${formattedPhone}`);
            } else {
                results.paymentReminders.failed++;
                results.errors.push(`Payment reminder failed for ${formattedPhone}: ${result.error}`);
                console.error(`❌ فشل إرسال تذكير الدفع للرقم ${formattedPhone}: ${result.error}`);
            }
            
            // انتظار بين الرسائل
            const delay = reminderSettings.messageDelay || DEFAULT_REMINDER_CONFIG.messageDelay;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.log(`\n📊 نتائج تذكيرات الدفع: ${results.paymentReminders.sent} نجح، ${results.paymentReminders.failed} فشل`);
        
    } catch (error) {
        console.error('💥 خطأ في مهمة التذكيرات:', error);
        results.errors.push(`Job error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 تقرير مهمة التذكيرات');
    console.log('='.repeat(50));
    console.log(`💰 تذكيرات الأقساط: ${results.paymentReminders.sent} نجح، ${results.paymentReminders.failed} فشل`);
    console.log(`📋 تذكيرات العقود: ${results.contractReminders.sent} نجح، ${results.contractReminders.failed} فشل`);
    
    const totalSent = results.paymentReminders.sent + results.contractReminders.sent;
    const totalFailed = results.paymentReminders.failed + results.contractReminders.failed;
    
    console.log(`📈 الإجمالي: ${totalSent} نجح، ${totalFailed} فشل`);
    
    if (results.errors.length > 0) {
        console.log('\n❌ الأخطاء:');
        results.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    console.log('='.repeat(50));
    
    await prisma.$disconnect();
    return results;
}

// تشغيل المهمة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    runReminderJob()
        .then(results => {
            const totalSent = results.paymentReminders.sent + results.contractReminders.sent;
            console.log(`\n🏁 انتهت المهمة: تم إرسال ${totalSent} تذكير`);
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 خطأ فادح في المهمة:', error);
            process.exit(1);
        });
}

module.exports = {
    runReminderJob,
    DEFAULT_REMINDER_CONFIG
};

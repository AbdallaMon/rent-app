/**
 * 🔄 مهمة Cron Job لإرسال التذكيرات التلقائية
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
    const sendStartTime = Date.now(); // بداية قياس الوقت
    
    try {
        let requestBody;
        
        // تحديد اللغة المفضلة للعميل (من metadata أو افتراضياً عربي)
        const clientLanguage = metadata?.language || metadata?.clientLanguage || 'ar';
        const isEnglish = clientLanguage === 'en' || clientLanguage === 'english';
        
        // استخدام نماذج واتساب للتذكيرات مع دعم اللغتين
        // تم اعتماد نماذج الدفع - تفعيلها الآن
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
            
            // تسجيل في قاعدة البيانات مع حفظ metadata وتوقيت دقيق
            await prisma.whatsappMessageLog.create({
                data: {
                    messageId: data.messages[0].id,
                    recipient: phoneNumber,
                    messageType: messageType,
                    templateName: requestBody.type === 'template' ? requestBody.template.name : null,
                    language: requestBody.type === 'template' ? requestBody.template.language.code : null,
                    status: 'sent',
                    sentAt: new Date(),
                    responseTime: Date.now() - sendStartTime, // حساب زمن الاستجابة
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

// دالة مساعدة لإرسال رسالة نصية عند فشل النموذج
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
                    responseTime: Date.now() - sendStartTime, // حساب زمن الاستجابة
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

// � جلب معلومات التواصل من قاعدة البيانات
async function getContactInfo(teamSettings) {
    return {
        customerServicePhone: teamSettings?.customerServicePhone || '971506111139',
        technicianPhone: teamSettings?.technicianPhone || '971506677779',
        customerServiceName: teamSettings?.customerServiceName || 'خدمة العملاء',
        technicianName: teamSettings?.technicianName || 'الفني'
    };
}

// �💰 إنشاء رسالة تذكير بالدفع
function createPaymentReminderMessage(installment, daysUntilDue, contactInfo = null) {
    const renter = installment.rentAgreement.renter;
    const endDate = new Date(installment.endDate).toLocaleDateString('en-GB'); // تنسيق إنجليزي
    
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

// 📋 إنشاء رسالة تذكير بانتهاء العقد
function createContractExpiryReminderMessage(contract, daysUntilExpiry, contactInfo = null) {
    const renter = contract.renter;
    const endDate = new Date(contract.endDate).toLocaleDateString('en-GB'); // تنسيق إنجليزي
    
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

// 📋 إنشاء رسالة إشعار انتهاء العقد لخدمة العملاء (نسخة داخلية)
function createContractExpiryNotificationForCustomerService(contract, daysUntilExpiry) {
    const renter = contract.renter;
    const endDate = new Date(contract.endDate).toLocaleDateString('en-GB');
    const unitInfo = contract.unit?.number ? `وحدة رقم ${contract.unit.number}` : 'غير محدد';
    const propertyInfo = contract.unit?.property?.name || contract.unit?.property?.propertyName || 'غير محدد';
    
    let urgencyLevel = '';
    if (daysUntilExpiry <= 7) {
        urgencyLevel = '🚨 *عاجل جداً*';
    } else if (daysUntilExpiry <= 30) {
        urgencyLevel = '⚠️ *عاجل*';
    } else {
        urgencyLevel = '📅 *تنبيه*';
    }

    return `🏢 *شركة تار العقارية - خدمة العملاء*

📋 *إشعار انتهاء عقد* ${urgencyLevel}

👤 *بيانات العميل:*
الاسم: ${renter.firstName} ${renter.lastName}
الهاتف: ${renter.phone || 'غير محدد'}

🏠 *بيانات العقار:*
العقار: ${propertyInfo}
الوحدة: ${unitInfo}
رقم العقد: ${contract.rentAgreementNumber || 'غير محدد'}

⏰ *تفاصيل الانتهاء:*
سينتهي خلال: ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'يوم' : 'أيام'}
تاريخ الانتهاء: ${endDate}
قيمة العقد: ${contract.totalPrice || contract.totalContractPrice || 'غير محدد'} درهم

📋 *المطلوب:*
• التواصل مع العميل لترتيب التجديد
• تحديث بيانات العقد في النظام
• متابعة حالة التجديد

_إشعار تلقائي من نظام إدارة العقارات_`;
}

// 🔍 البحث عن الدفعات المستحقة (محدث ليستخدم جدول Payment)
async function findDuePayments(reminderSettings) {
    console.log('🔍 البحث عن الدفعات المستحقة والمستحقة قريباً...');
    
    // التحقق من تفعيل التذكيرات التلقائية
    if (!reminderSettings.enableAutoReminders) {
        console.log('⚠️ التذكيرات التلقائية معطلة في الإعدادات');
        return [];
    }
    
    const duePayments = [];
    const now = new Date();
    
    // استخدام فترات التذكير من قاعدة البيانات
    const paymentReminderDays = reminderSettings.paymentReminderDays || DEFAULT_REMINDER_CONFIG.paymentReminderDays;
    
    console.log(`📅 البحث عن الدفعات التي تستحق خلال: ${paymentReminderDays} أيام`);

    // 1️⃣ البحث عن الدفعات المتأخرة (overdue) - الأولوية العليا
    const overduePayments = await prisma.payment.findMany({
        where: {
            dueDate: { lt: now },
            status: { in: ['PENDING', 'OVERDUE'] }, // الدفعات غير المدفوعة
            installmentId: { not: null }, // فقط دفعات الأقساط
            installment: {
                rentAgreement: {
                    status: 'ACTIVE'
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
        take: 50 // تحديد العدد لتجنب إرسال آلاف التذكيرات
    });

    overduePayments.forEach(payment => {
        const daysPastDue = Math.floor((now - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24));
        duePayments.push({
            ...payment,
            daysUntilDue: -daysPastDue, // سالب لأنه متأخر
            isOverdue: true,
            priority: daysPastDue > 30 ? 'critical' : 'high', // أولوية حرجة للمتأخر أكثر من شهر
            // إضافة بيانات القسط للتوافق مع باقي الكود
            rentAgreement: payment.installment.rentAgreement,
            endDate: payment.dueDate,
            invoices: [] // سنحصل على المبلغ من payment.amount مباشرة
        });
    });

    // 2️⃣ البحث عن الدفعات المستحقة قريباً (upcoming) - حسب فترات التذكير
    for (const days of paymentReminderDays) {
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + days);
        
        // تحديد نطاق التاريخ (يوم كامل)
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
        
        console.log(`🔍 البحث عن الدفعات المستحقة في ${targetDate.toLocaleDateString('ar-SA')} (خلال ${days} أيام)`);
        
        const upcomingPayments = await prisma.payment.findMany({
            where: {
                dueDate: {
                    gte: startOfDay,
                    lt: endOfDay
                },
                status: 'PENDING', // فقط الدفعات المعلقة
                installmentId: { not: null }, // فقط دفعات الأقساط
                installment: {
                    rentAgreement: {
                        status: 'ACTIVE'
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

        console.log(`📊 تم العثور على ${upcomingPayments.length} دفعة ستستحق خلال ${days} أيام`);

        upcomingPayments.forEach(payment => {
            // تجنب التكرار - تحقق من عدم وجود الدفعة مسبقاً
            const exists = duePayments.find(existing => existing.id === payment.id);
            if (!exists) {
                duePayments.push({
                    ...payment,
                    daysUntilDue: days,
                    isOverdue: false,
                    priority: days <= 3 ? 'high' : days <= 7 ? 'medium' : 'normal',
                    // إضافة بيانات القسط للتوافق مع باقي الكود
                    rentAgreement: payment.installment.rentAgreement,
                    endDate: payment.dueDate,
                    invoices: [] // سنحصل على المبلغ من payment.amount مباشرة
                });
            }
        });
    }

    console.log(`📊 إجمالي الدفعات المطلوب إرسال تذكيرات لها: ${duePayments.length}`);
    console.log(`   🚨 دفعات متأخرة: ${overduePayments.length}`);
    console.log(`   📅 دفعات مستحقة قريباً: ${duePayments.length - overduePayments.length}`);
    
    return duePayments;
}

// الدالة القديمة للتوافق مع الكود الموجود
async function findDueInstallments(reminderSettings) {
    return await findDuePayments(reminderSettings);
}

// 🔍 البحث عن العقود المنتهية قريباً
async function findExpiringContracts(reminderSettings) {
    console.log('🔍 البحث عن العقود المنتهية قريباً...');
    
    // التحقق من تفعيل التذكيرات التلقائية
    if (!reminderSettings.enableAutoReminders) {
        console.log('⚠️ التذكيرات التلقائية معطلة في الإعدادات');
        return [];
    }
    
    const expiringContracts = [];
    const now = new Date();
    
    // استخدام فترات التذكير من قاعدة البيانات
    const contractReminderDays = reminderSettings.contractReminderDays || DEFAULT_REMINDER_CONFIG.contractReminderDays;
    
    console.log(`📅 البحث عن العقود التي ستنتهي خلال: ${contractReminderDays} أيام`);

    for (const days of contractReminderDays) {
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + days);
        
        // تحديد نطاق التاريخ (يوم كامل)
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
        
        console.log(`🔍 البحث عن العقود التي ستنتهي في ${targetDate.toLocaleDateString('ar-SA')} (خلال ${days} أيام)`);
        
        // البحث عن العقود المنتهية في التاريخ المحدد
        const contracts = await prisma.rentAgreement.findMany({
            where: {
                endDate: {
                    gte: startOfDay,
                    lt: endOfDay
                },
                status: 'ACTIVE'
            },
            include: {
                renter: true,
                unit: {
                    include: {
                        property: true
                    }
                }
            }
        });

        console.log(`📊 تم العثور على ${contracts.length} عقد سينتهي خلال ${days} أيام`);

        contracts.forEach(contract => {
            // تجنب التكرار - تحقق من عدم وجود العقد مسبقاً
            const exists = expiringContracts.find(existing => existing.id === contract.id);
            if (!exists) {
                expiringContracts.push({
                    ...contract,
                    daysUntilExpiry: days,
                    priority: days <= 7 ? 'high' : days <= 30 ? 'medium' : 'normal'
                });
            }
        });
    }

    console.log(`📊 إجمالي العقود المطلوب إرسال تذكيرات لها: ${expiringContracts.length}`);
    return expiringContracts;
}

// 📱 معالجة إرسال التذكيرات مع إعادة المحاولة
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

// دالة لجلب إعدادات التذكيرات وفريق العمل من قاعدة البيانات
async function fetchAllSettings() {
    console.log('📋 جلب إعدادات التذكيرات من قاعدة البيانات...');
    
    // جلب إعدادات التذكيرات
    let reminderSettings = await prisma.reminderSettings.findFirst({ 
        where: { id: 'default_reminder_settings' } 
    });
    
    // إذا لم تكن الإعدادات موجودة، إنشاء إعدادات افتراضية
    if (!reminderSettings) {
        console.log('⚠️ إعدادات التذكيرات غير موجودة، سيتم إنشاء إعدادات افتراضية...');
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
        console.log('✅ تم إنشاء إعدادات التذكيرات الافتراضية');
    }
    
    console.log(`📊 إعدادات التذكيرات:
    - تذكيرات الأقساط: ${reminderSettings.paymentReminderDays} أيام قبل الاستحقاق
    - تذكيرات العقود: ${reminderSettings.contractReminderDays} أيام قبل الانتهاء
    - التذكيرات التلقائية: ${reminderSettings.enableAutoReminders ? 'مفعلة' : 'معطلة'}
    - فترة الانتظار: ${reminderSettings.messageDelay}ms`);
    
    // جلب إعدادات فريق العمل
    let teamSettings = await prisma.whatsAppTeamSettings.findFirst({ 
        where: { id: 'default_team_settings' } 
    });
    
    // إذا لم تكن الإعدادات موجودة، إنشاء إعدادات افتراضية
    if (!teamSettings) {
        console.log('⚠️ إعدادات فريق العمل غير موجودة، سيتم إنشاء إعدادات افتراضية...');
        teamSettings = await prisma.whatsAppTeamSettings.create({
            data: {
                id: 'default_team_settings',
                notifyTechnicianForMaintenance: false,
                notifyCustomerServiceForComplaints: false,
                notifyCustomerServiceForContacts: false,
                notificationDelay: 5,
                isActive: true
            }
        });
        console.log('✅ تم إنشاء إعدادات فريق العمل الافتراضية');
    }
    
    return { reminderSettings, teamSettings };
}

// 🔧 إنشاء رسالة إشعار صيانة للفني
function createMaintenanceNotificationMessage(maintenanceRequest) {
    const renter = maintenanceRequest.renter || maintenanceRequest.client;
    const property = maintenanceRequest.property;
    const unit = maintenanceRequest.unit;
    
    return `🏢 *شركة تار العقارية*
🔧 *طلب صيانة جديد*

📋 *تفاصيل الطلب:*
👤 العميل: ${renter?.firstName || 'غير محدد'} ${renter?.lastName || ''}
🏠 العقار: ${property?.name || 'غير محدد'}
🚪 الوحدة: ${unit?.number || 'غير محدد'}
📝 نوع الصيانة: ${maintenanceRequest.type || 'غير محدد'}
📋 الوصف: ${maintenanceRequest.description || 'لا يوجد وصف'}
📅 تاريخ الطلب: ${new Date(maintenanceRequest.createdAt).toLocaleDateString('ar-SA')}
⚡ الأولوية: ${maintenanceRequest.priority || 'عادية'}

📱 يُرجى التواصل مع العميل في أقرب وقت ممكن.

_رسالة تلقائية من نظام إدارة العقارات_`;
}

// 📞 إنشاء رسالة إشعار شكوى لخدمة العملاء
function createComplaintNotificationMessage(complaint) {
    const renter = complaint.renter || complaint.client;
    const property = complaint.property;
    
    return `🏢 *شركة تار العقارية*
📞 *شكوى جديدة*

📋 *تفاصيل الشكوى:*
👤 العميل: ${renter?.firstName || 'غير محدد'} ${renter?.lastName || ''}
🏠 العقار: ${property?.name || 'غير محدد'}
📝 نوع الشكوى: ${complaint.category || 'غير محدد'}
📋 الموضوع: ${complaint.subject || 'غير محدد'}
📄 التفاصيل: ${complaint.description || 'لا توجد تفاصيل'}
📅 تاريخ الشكوى: ${new Date(complaint.createdAt).toLocaleDateString('ar-SA')}
⚡ الأولوية: ${complaint.priority || 'عادية'}

📱 يُرجى المتابعة مع العميل بأسرع وقت ممكن.

_رسالة تلقائية من نظام إدارة العقارات_`;
}

// 📧 إنشاء رسالة إشعار طلب اتصال لخدمة العملاء
function createContactRequestNotificationMessage(contactRequest) {
    return `🏢 *شركة تار العقارية*
📧 *طلب تواصل جديد*

📋 *تفاصيل الطلب:*
👤 الاسم: ${contactRequest.name || 'غير محدد'}
📱 الهاتف: ${contactRequest.phone || 'غير محدد'}
� الوصف: ${contactRequest.description || 'لا توجد تفاصيل'}
📅 تاريخ الطلب: ${new Date(contactRequest.createdAt).toLocaleDateString('ar-SA')}

📱 يُرجى التواصل مع العميل في أقرب وقت ممكن.

_رسالة تلقائية من نظام إدارة العقارات_`;
}

// 🔧 فحص طلبات الصيانة الجديدة وإرسال إشعارات للفني
async function checkAndNotifyNewMaintenanceRequests(teamSettings) {
    if (!teamSettings.notifyTechnicianForMaintenance || !teamSettings.technicianPhone) {
        console.log('⚠️ إشعارات الصيانة للفني معطلة أو لا يوجد رقم فني');
        return;
    }

    console.log('🔧 فحص طلبات الصيانة الجديدة...');
    
    // البحث عن طلبات الصيانة الجديدة (آخر ساعة)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const newMaintenanceRequests = await prisma.maintenanceRequest.findMany({
        where: {
            createdAt: {
                gte: oneHourAgo
            },
            status: 'PENDING'
        },        include: {
            client: true,
            property: true,
            unit: true
        }
    });

    console.log(`📊 تم العثور على ${newMaintenanceRequests.length} طلب صيانة جديد`);

    for (const request of newMaintenanceRequests) {
        const message = createMaintenanceNotificationMessage(request);
        const formattedPhone = teamSettings.technicianPhone.startsWith('971') 
            ? teamSettings.technicianPhone 
            : `971${teamSettings.technicianPhone.replace(/^0+/, '')}`;
          const metadata = {
            requestId: request.id,
            requestType: 'maintenance',
            renterName: request.client?.name || 'غير محدد',
            propertyName: request.property?.name || 'غير محدد',
            maintenanceType: request.type || 'غير محدد'
        };
        
        const result = await sendWhatsAppMessage(formattedPhone, message, 'maintenance_notification', metadata);
        
        if (result.success) {
            console.log(`✅ تم إرسال إشعار صيانة للفني - طلب #${request.id}`);
        } else {
            console.error(`❌ فشل إرسال إشعار صيانة للفني - طلب #${request.id}`);
        }
        
        // انتظار بين الرسائل
        await new Promise(resolve => setTimeout(resolve, teamSettings.notificationDelay * 1000));
    }
}

// 📞 فحص الشكاوى الجديدة وإرسال إشعارات لخدمة العملاء
async function checkAndNotifyNewComplaints(teamSettings) {
    if (!teamSettings.notifyCustomerServiceForComplaints || !teamSettings.customerServicePhone) {
        console.log('⚠️ إشعارات الشكاوى لخدمة العملاء معطلة أو لا يوجد رقم خدمة عملاء');
        return;
    }

    console.log('📞 فحص الشكاوى الجديدة...');
    
    // البحث عن الشكاوى الجديدة (آخر ساعة)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const newComplaints = await prisma.complaint.findMany({
        where: {
            createdAt: {
                gte: oneHourAgo
            }
        },        include: {
            client: true,
            property: true
        }
    });

    console.log(`📊 تم العثور على ${newComplaints.length} شكوى جديدة`);

    for (const complaint of newComplaints) {
        const message = createComplaintNotificationMessage(complaint);
        const formattedPhone = teamSettings.customerServicePhone.startsWith('971') 
            ? teamSettings.customerServicePhone 
            : `971${teamSettings.customerServicePhone.replace(/^0+/, '')}`;
          const metadata = {
            complaintId: complaint.id,
            requestType: 'complaint',
            renterName: complaint.client?.name || 'غير محدد',
            propertyName: complaint.property?.name || 'غير محدد',
            complaintCategory: complaint.type || 'غير محدد'
        };
        
        const result = await sendWhatsAppMessage(formattedPhone, message, 'complaint_notification', metadata);
        
        if (result.success) {
            console.log(`✅ تم إرسال إشعار شكوى لخدمة العملاء - شكوى #${complaint.id}`);
        } else {
            console.error(`❌ فشل إرسال إشعار شكوى لخدمة العملاء - شكوى #${complaint.id}`);
        }
        
        // انتظار بين الرسائل
        await new Promise(resolve => setTimeout(resolve, teamSettings.notificationDelay * 1000));
    }
}

// 📧 فحص طلبات الاتصال الجديدة وإرسال إشعارات لخدمة العملاء
async function checkAndNotifyNewContactRequests(teamSettings) {
    if (!teamSettings.notifyCustomerServiceForContacts || !teamSettings.customerServicePhone) {
        console.log('⚠️ إشعارات طلبات الاتصال لخدمة العملاء معطلة أو لا يوجد رقم خدمة عملاء');
        return;
    }

    console.log('📧 فحص طلبات الاتصال الجديدة...');
    
    // البحث عن طلبات الاتصال الجديدة (آخر ساعة)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    // البحث في جدول Contact إذا كان موجوداً
    try {
        const newContactRequests = await prisma.contact.findMany({
            where: {
                createdAt: {
                    gte: oneHourAgo
                }
            }
        });

        console.log(`📊 تم العثور على ${newContactRequests.length} طلب اتصال جديد`);

        for (const contact of newContactRequests) {
            const message = createContactRequestNotificationMessage(contact);
            const formattedPhone = teamSettings.customerServicePhone.startsWith('971') 
                ? teamSettings.customerServicePhone 
                : `971${teamSettings.customerServicePhone.replace(/^0+/, '')}`;
              const metadata = {
                contactId: contact.id,
                requestType: 'contact',
                contactName: contact.name || 'غير محدد',
                contactPhone: contact.phone || 'غير محدد',
                contactDescription: contact.description || 'غير محدد'
            };
            
            const result = await sendWhatsAppMessage(formattedPhone, message, 'contact_notification', metadata);
            
            if (result.success) {
                console.log(`✅ تم إرسال إشعار طلب اتصال لخدمة العملاء - طلب #${contact.id}`);
            } else {
                console.error(`❌ فشل إرسال إشعار طلب اتصال لخدمة العملاء - طلب #${contact.id}`);
            }
            
            // انتظار بين الرسائل
            await new Promise(resolve => setTimeout(resolve, teamSettings.notificationDelay * 1000));
        }
    } catch (error) {
        console.log('⚠️ جدول Contact غير موجود أو لا يمكن الوصول إليه');
    }
}

// 🚀 تشغيل مهمة التذكيرات
async function runReminderJob() {
    console.log('🚀 بدء مهمة التذكيرات التلقائية...');
    console.log(`⏰ الوقت: ${new Date().toLocaleString('ar-SA')}`);
    
    const results = {
        paymentReminders: { sent: 0, failed: 0 },
        contractReminders: { sent: 0, failed: 0 },
        errors: []
    };    try {
        // جلب جميع الإعدادات من قاعدة البيانات
        const settingsData = await fetchAllSettings();
        const reminderSettings = settingsData.reminderSettings;
        const teamSettings = settingsData.teamSettings;
        
        if (!reminderSettings) throw new Error('تعذر جلب إعدادات التذكيرات من قاعدة البيانات');
        if (!teamSettings) throw new Error('تعذر جلب إعدادات فريق العمل من قاعدة البيانات');
        
        // التحقق من تفعيل التذكيرات التلقائية
        if (!reminderSettings.enableAutoReminders) {
            console.log('⚠️ التذكيرات التلقائية معطلة في الإعدادات. يتم إنهاء المهمة.');
            return results;
        }
        
        console.log('✅ التذكيرات التلقائية مفعلة. بدء معالجة التذكيرات...');
        
        // 💰 معالجة تذكيرات الأقساط
        console.log('\n💰 معالجة تذكيرات الأقساط...');
        const duePayments = await findDuePayments(reminderSettings);
        
        for (const payment of duePayments) {
            const renter = payment.installment.rentAgreement.renter;
            const phoneNumber = renter.phone;
            
            if (!phoneNumber) {
                console.log(`⚠️ لا يوجد رقم هاتف للعميل: ${renter.firstName} ${renter.lastName}`);
                continue;
            }
            
            // تنسيق رقم الهاتف
            const formattedPhone = phoneNumber.startsWith('971') ? phoneNumber : `971${phoneNumber.replace(/^0+/, '')}`;            // التحقق من تكرار التذكير (تجنب الإرسال المتكرر في نفس اليوم)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setDate(today.getDate() + 1);
            
            // البحث عن تذكير مجدول لهذا الدفع في هذا الوقت
            const scheduledReminder = await prisma.whatsappMessageLog.findFirst({
                where: {
                    recipient: formattedPhone,
                    messageType: 'payment_reminder',
                    status: 'scheduled',
                    sentAt: {
                        gte: today,
                        lt: endOfDay
                    },
                    metadata: {
                        path: 'paymentId',
                        equals: payment.id.toString()
                    }
                }
            });
            
            // إذا وُجد تذكير مجدول، قم بتحديثه وإرساله
            let shouldSend = false;
            let reminderRecord = null;
            
            if (scheduledReminder) {
                console.log(`📋 وُجد تذكير مجدول للدفع ${payment.id}`);
                reminderRecord = scheduledReminder;
                shouldSend = true;
            } else {
                // إذا لم يوجد تذكير مجدول، تحقق من عدم الإرسال المسبق
                const existingReminder = await prisma.whatsappMessageLog.findFirst({
                    where: {
                        recipient: formattedPhone,
                        messageType: 'payment_reminder',
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
                
                shouldSend = true;
            }
            
            if (!shouldSend) {
                continue;
            }
            
            // إعداد أرقام التواصل من قاعدة البيانات
            const contactInfo = await getContactInfo(teamSettings);
            
            const message = createPaymentReminderMessage(payment, payment.daysUntilDue, contactInfo);
            
            // إعداد metadata للتذكير
            const metadata = {
                paymentId: payment.id,
                renterName: renter.name || `${renter.firstName || ''} ${renter.lastName || ''}`.trim() || 'العميل',
                amount: payment.amount.toString(),
                dueDate: new Date(payment.dueDate).toLocaleDateString('en-GB'), // تنسيق إنجليزي
                daysUntilDue: (payment.daysUntilDue || 0).toString(),
                contractNumber: payment.installment.rentAgreement?.rentAgreementNumber || 'غير محدد',
                reminderType: 'payment_reminder',
                priority: payment.priority || 'normal',
                // إضافة أرقام فريق العمل للنموذج
                technicianPhone: teamSettings.technicianPhone ? 
                    (teamSettings.technicianPhone.startsWith('971') ? teamSettings.technicianPhone : `971${teamSettings.technicianPhone.replace(/^0+/, '')}`) : 
                    '971547333111', // رقم افتراضي
                customerServicePhone: teamSettings.customerServicePhone ? 
                    (teamSettings.customerServicePhone.startsWith('971') ? teamSettings.customerServicePhone : `971${teamSettings.customerServicePhone.replace(/^0+/, '')}`) : 
                    '971547333111' // رقم افتراضي
            };
            
            console.log(`📤 إرسال تذكير للدفع ${payment.id} - ${metadata.renterName} - خلال ${payment.daysUntilDue} أيام`);
              const result = await sendReminderWithRetry(formattedPhone, message, 'payment_reminder', metadata, reminderSettings);
            
            if (result.success) {
                results.paymentReminders.sent++;
                console.log(`✅ تم إرسال تذكير الدفع بنجاح للرقم ${formattedPhone}`);
                
                // إذا كان هناك تذكير مجدول، قم بتحديث حالته
                if (reminderRecord) {
                    await prisma.whatsappMessageLog.update({
                        where: { id: reminderRecord.id },
                        data: {
                            status: 'sent',
                            sentAt: new Date(),
                            messageId: result.messageId || reminderRecord.messageId
                        }
                    });
                    console.log(`📝 تم تحديث حالة التذكير المجدول إلى "مرسل"`);
                }
                
            } else {
                results.paymentReminders.failed++;
                results.errors.push(`Payment reminder failed for ${formattedPhone}: ${result.error}`);
                console.error(`❌ فشل إرسال تذكير الدفع للرقم ${formattedPhone}: ${result.error}`);
                
                // إذا كان هناك تذكير مجدول، قم بتحديث حالته إلى فاشل
                if (reminderRecord) {
                    await prisma.whatsappMessageLog.update({
                        where: { id: reminderRecord.id },
                        data: {
                            status: 'failed',
                            sentAt: new Date()
                        }
                    });
                    console.log(`📝 تم تحديث حالة التذكير المجدول إلى "فاشل"`);
                }
            }
            
            // انتظار بين الرسائل لتجنب Rate Limiting
            const delay = reminderSettings.messageDelay || DEFAULT_REMINDER_CONFIG.messageDelay;
            await new Promise(resolve => setTimeout(resolve, delay));
        }        // 📋 معالجة تذكيرات انتهاء العقود
        console.log('\n📋 معالجة تذكيرات انتهاء العقود...');
        const expiringContracts = await findExpiringContracts(reminderSettings);
        
        for (const contract of expiringContracts) {
            const renter = contract.renter;
            const phoneNumber = renter.phone;
            
            if (!phoneNumber) {
                console.log(`⚠️ لا يوجد رقم هاتف للعميل: ${renter.firstName} ${renter.lastName}`);
                continue;
            }
            
            // تنسيق رقم الهاتف
            const formattedPhone = phoneNumber.startsWith('971') ? phoneNumber : `971${phoneNumber.replace(/^0+/, '')}`;            // التحقق من تكرار التذكير (تجنب الإرسال المتكرر في نفس اليوم)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setDate(today.getDate() + 1);
            
            // البحث عن تذكير مجدول لهذا العقد في هذا الوقت
            const scheduledReminder = await prisma.whatsappMessageLog.findFirst({
                where: {
                    recipient: formattedPhone,
                    messageType: 'contract_expiry_reminder',
                    status: 'scheduled',
                    sentAt: {
                        gte: today,
                        lt: endOfDay
                    }
                    // إزالة التحقق من metadata مؤقتاً لتجنب التعقيد
                }
            });
            
            // إذا وُجد تذكير مجدول، قم بتحديثه وإرساله
            let shouldSend = false;
            let reminderRecord = null;
            
            if (scheduledReminder) {
                console.log(`📋 وُجد تذكير مجدول للعقد ${contract.id}`);
                reminderRecord = scheduledReminder;
                shouldSend = true;
            } else {
                // إذا لم يوجد تذكير مجدول، تحقق من عدم الإرسال المسبق
                const existingReminder = await prisma.whatsappMessageLog.findFirst({
                    where: {
                        recipient: formattedPhone,
                        messageType: 'contract_expiry_reminder',
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
                
                shouldSend = true;
            }
            
            if (!shouldSend) {
                continue;
            }
            
            // إعداد أرقام التواصل من قاعدة البيانات
            const contactInfo = await getContactInfo(teamSettings);
            
            const message = createContractExpiryReminderMessage(contract, contract.daysUntilExpiry, contactInfo);
            
            // إعداد metadata للتذكير
            const metadata = {
                contractId: contract.id,
                renterName: renter.name || `${renter.firstName || ''} ${renter.lastName || ''}`.trim() || 'العميل',
                contractNumber: contract.rentAgreementNumber || 'غير محدد',
                endDate: new Date(contract.endDate).toLocaleDateString('en-GB'), // تنسيق إنجليزي
                daysUntilExpiry: (contract.daysUntilExpiry || 0).toString(),
                totalValue: (contract.totalPrice || contract.totalContractPrice || 0).toString(),
                propertyName: contract.unit?.property?.name || contract.unit?.property?.propertyName || 'غير محدد',
                unitName: contract.unit?.number ? `وحدة رقم ${contract.unit.number}` : 'غير محدد',
                reminderType: 'contract_expiry_reminder',
                priority: contract.priority || 'normal',
                // إضافة أرقام فريق العمل للنموذج
                technicianPhone: teamSettings.technicianPhone ? 
                    (teamSettings.technicianPhone.startsWith('971') ? teamSettings.technicianPhone : `971${teamSettings.technicianPhone.replace(/^0+/, '')}`) : 
                    '971547333111', // رقم افتراضي
                customerServicePhone: teamSettings.customerServicePhone ? 
                    (teamSettings.customerServicePhone.startsWith('971') ? teamSettings.customerServicePhone : `971${teamSettings.customerServicePhone.replace(/^0+/, '')}`) : 
                    '971547333111' // رقم افتراضي
            };
            
            console.log(`📤 إرسال تذكير للعقد ${contract.id} - ${metadata.renterName} - خلال ${contract.daysUntilExpiry} أيام`);
              const result = await sendReminderWithRetry(formattedPhone, message, 'contract_expiry_reminder', metadata, reminderSettings);
            
            if (result.success) {
                results.contractReminders.sent++;
                console.log(`✅ تم إرسال تذكير العقد بنجاح للرقم ${formattedPhone}`);
                
                // إرسال نسخة من تذكير انتهاء العقد لخدمة العملاء
                if (teamSettings.customerServicePhone) {
                    const customerServiceFormattedPhone = teamSettings.customerServicePhone.startsWith('971') 
                        ? teamSettings.customerServicePhone 
                        : `971${teamSettings.customerServicePhone.replace(/^0+/, '')}`;
                    
                    // إنشاء رسالة خاصة بخدمة العملاء
                    const customerServiceMessage = createContractExpiryNotificationForCustomerService(contract, contract.daysUntilExpiry);
                    const customerServiceMetadata = {
                        ...metadata,
                        notificationType: 'customer_service_copy',
                        originalRecipient: formattedPhone,
                        reminderType: 'contract_expiry_customer_service_notification'
                    };
                    
                    console.log(`📤 إرسال نسخة تذكير العقد لخدمة العملاء - العقد ${contract.id}`);
                    const customerServiceResult = await sendReminderWithRetry(
                        customerServiceFormattedPhone, 
                        customerServiceMessage, 
                        'contract_expiry_customer_service_notification', 
                        customerServiceMetadata, 
                        reminderSettings
                    );
                    
                    if (customerServiceResult.success) {
                        console.log(`✅ تم إرسال نسخة تذكير العقد لخدمة العملاء بنجاح`);
                    } else {
                        console.error(`❌ فشل إرسال نسخة تذكير العقد لخدمة العملاء: ${customerServiceResult.error}`);
                    }
                    
                    // انتظار قصير بين إرسال الرسالة للعميل وخدمة العملاء
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                // إذا كان هناك تذكير مجدول، قم بتحديث حالته
                if (reminderRecord) {
                    await prisma.whatsappMessageLog.update({
                        where: { id: reminderRecord.id },
                        data: {
                            status: 'sent',
                            sentAt: new Date(),
                            messageId: result.messageId || reminderRecord.messageId
                        }
                    });
                    console.log(`📝 تم تحديث حالة التذكير المجدول إلى "مرسل"`);
                }
                
            } else {
                results.contractReminders.failed++;
                results.errors.push(`Contract reminder failed for ${formattedPhone}: ${result.error}`);
                console.error(`❌ فشل إرسال تذكير العقد للرقم ${formattedPhone}: ${result.error}`);
                
                // إذا كان هناك تذكير مجدول، قم بتحديث حالته إلى فاشل
                if (reminderRecord) {
                    await prisma.whatsappMessageLog.update({
                        where: { id: reminderRecord.id },
                        data: {
                            status: 'failed',
                            sentAt: new Date()
                        }
                    });
                    console.log(`📝 تم تحديث حالة التذكير المجدول إلى "فاشل"`);
                }
            }
            
            // انتظار بين الرسائل
            const delay = reminderSettings.messageDelay || DEFAULT_REMINDER_CONFIG.messageDelay;
            await new Promise(resolve => setTimeout(resolve, delay));
        }        // التحقق من طلبات الصيانة الجديدة وإرسال إشعارات للفني
        await checkAndNotifyNewMaintenanceRequests(teamSettings);
        
        // التحقق من الشكاوى الجديدة وإرسال إشعارات لخدمة العملاء
        await checkAndNotifyNewComplaints(teamSettings);
        
        // التحقق من طلبات الاتصال الجديدة وإرسال إشعارات لخدمة العملاء
        await checkAndNotifyNewContactRequests(teamSettings);
        
        // حفظ تقرير المهمة
        const jobReport = {
            timestamp: new Date().toISOString(),
            results,
            config: {
                paymentReminderDays: reminderSettings?.paymentReminderDays || DEFAULT_REMINDER_CONFIG.paymentReminderDays,
                contractReminderDays: reminderSettings?.contractReminderDays || DEFAULT_REMINDER_CONFIG.contractReminderDays,
                enableAutoReminders: reminderSettings?.enableAutoReminders || false,
                messageDelay: reminderSettings?.messageDelay || DEFAULT_REMINDER_CONFIG.messageDelay
            }
        };
        
        require('fs').writeFileSync(
            `reminder-job-report-${Date.now()}.json`,
            JSON.stringify(jobReport, null, 2),
            'utf8'
        );
        
    } catch (error) {
        console.error('💥 خطأ في مهمة التذكيرات:', error);
        results.errors.push(`Job error: ${error.message}`);
    }

    // 📊 إنشاء تقرير النتائج
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

// 🔧 تشغيل المهمة إذا تم استدعاء الملف مباشرة
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

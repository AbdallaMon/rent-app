/**
 * سكربت حساب عمولة الإدارة للعقود النشطة من بداية 2025
 * 
 * المنطق:
 * 1. البحث عن العقود النشطة التي بدأت من 01/01/2025
 * 2. التحقق من عدم وجود دفعة عمولة إدارة سابقة لهذا العقد في جدول Payment
 * 3. حساب العمولة بناءً على نسبة العمولة في العقار والمبلغ الإجمالي للعقد
 * 4. إنشاء دفعة جديدة في جدول Payment بنوع MANAGEMENT_COMMISSION
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function calculateManagementCommissionsFor2025() {
    console.log("🚀 بدء حساب عمولة الإدارة للعقود من بداية 2025...");
    
    try {
        // تاريخ بداية 2025
        const startDate2025 = new Date('2025-01-01T00:00:00.000Z');
        const now = new Date();
        
        console.log(`📅 البحث عن العقود من ${startDate2025.toLocaleDateString('ar-SA')} إلى اليوم`);
        
        // 1. جلب العقود النشطة التي بدأت من 2025
        const activeContracts = await prisma.rentAgreement.findMany({
            where: {
                startDate: {
                    gte: startDate2025
                },
                status: 'ACTIVE', // العقود النشطة فقط
            },
            include: {
                unit: {
                    include: {
                        property: {
                            include: {
                                client: true // مالك العقار
                            }
                        }
                    }
                },
                renter: true // المستأجر
            },
            orderBy: {
                startDate: 'asc'
            }
        });

        console.log(`📋 تم العثور على ${activeContracts.length} عقد نشط من بداية 2025`);

        if (activeContracts.length === 0) {
            console.log("✅ لا توجد عقود نشطة من بداية 2025 تحتاج لحساب عمولة إدارة");
            return;
        }

        let processedCount = 0;
        let skippedCount = 0;
        let createdPayments = [];

        for (const contract of activeContracts) {
            console.log(`\n🔍 معالجة العقد ID: ${contract.id}`);
            
            // التحقق من البيانات المطلوبة
            if (!contract.unit || !contract.unit.property || !contract.unit.property.client) {
                console.log(`   ⚠️  بيانات ناقصة - تم تجاهل العقد`);
                skippedCount++;
                continue;
            }

            console.log(`   📍 العقار: ${contract.unit.property.name} - الوحدة: ${contract.unit.name || 'غير محدد'}`);
            console.log(`   👤 المالك: ${contract.unit.property.client.firstName || ''} ${contract.unit.property.client.lastName || ''}`);
            
            if (contract.renter) {
                console.log(`   👥 المستأجر: ${contract.renter.firstName || ''} ${contract.renter.lastName || ''}`);
            }
            
            console.log(`   📅 تاريخ بداية العقد: ${contract.startDate.toLocaleDateString('ar-SA')}`);
            console.log(`   💰 قيمة العقد: ${contract.totalAmount || 0} ريال`);
            
            // 2. التحقق من وجود دفعة عمولة إدارة سابقة لهذا العقد في جدول Payment
            const existingPayment = await prisma.payment.findFirst({
                where: {
                    rentAgreementId: contract.id,
                    paymentType: 'MANAGEMENT_COMMISSION'
                }
            });

            if (existingPayment) {
                console.log(`   ⚠️  عمولة إدارة موجودة مسبقاً (Payment ID: ${existingPayment.id})`);
                skippedCount++;
                continue;
            }

            // 3. التحقق من وجود نسبة عمولة في العقار
            const commissionRate = contract.unit.property.managementCommission;
            if (!commissionRate || commissionRate <= 0) {
                console.log(`   ⚠️  لا توجد نسبة عمولة إدارة محددة للعقار (${commissionRate}%)`);
                skippedCount++;
                continue;
            }

            // 4. حساب قيمة العمولة
            const totalAmount = contract.totalAmount || contract.totalPrice || contract.totalContractPrice || 0;
            
            if (totalAmount <= 0) {
                console.log(`   ⚠️  قيمة العقد غير صالحة (${totalAmount} ريال) - سيتم تجاهل العقد`);
                skippedCount++;
                continue;
            }
            
            const commissionAmount = (totalAmount * commissionRate) / 100;
            
            console.log(`   📊 نسبة العمولة: ${commissionRate}%`);
            console.log(`   💰 قيمة العقد: ${totalAmount} ريال`);
            console.log(`   💵 قيمة العمولة المحسوبة: ${commissionAmount} ريال`);

            // 5. إنشاء دفعة عمولة الإدارة في جدول Payment
            const managementPayment = await prisma.payment.create({
                data: {
                    amount: commissionAmount,
                    paidAmount: 0, // غير مدفوعة في البداية
                    dueDate: contract.startDate, // تاريخ بداية العقد
                    timeOfPayment: contract.startDate, // تاريخ الدفع
                    paymentType: 'MANAGEMENT_COMMISSION',
                    status: 'PENDING', // معلقة وليس مدفوعة
                    title: `عمولة إدارة للعقد ${contract.id} - ${contract.unit.property.name} - الوحدة ${contract.unit.name || 'غير محدد'}`,
                    createdAt: now,
                    updatedAt: now,
                    // ربط الدفعة بالجهات المناسبة
                    rentAgreement: {
                        connect: { id: contract.id }
                    },
                    client: {
                        connect: { id: contract.unit.property.clientId }
                    },
                    property: {
                        connect: { id: contract.unit.propertyId }
                    },
                    unit: {
                        connect: { id: contract.unitId }
                    }
                }
            });

            // 6. إنشاء فاتورة لعمولة الإدارة
            const managementInvoice = await prisma.invoice.create({
                data: {
                    amount: commissionAmount,
                    paidAmount: 0,
                    dueDate: contract.startDate,
                    status: 'PENDING',
                    invoiceType: 'MANAGEMENT_COMMISSION',
                    description: `فاتورة عمولة إدارة للعقد ${contract.id}`,
                    createdAt: now,
                    updatedAt: now,
                    // ربط الفاتورة بالجهات المناسبة
                    rentAgreement: {
                        connect: { id: contract.id }
                    },
                    owner: {
                        connect: { id: contract.unit.property.clientId }
                    },
                    property: {
                        connect: { id: contract.unit.propertyId }
                    },
                    unit: {
                        connect: { id: contract.unitId }
                    },
                    payment: {
                        connect: { id: managementPayment.id }
                    }
                }
            });

            console.log(`   ✅ تم إنشاء دفعة عمولة الإدارة (Payment ID: ${managementPayment.id})`);
            console.log(`   📄 تم إنشاء فاتورة عمولة الإدارة (Invoice ID: ${managementInvoice.id})`);
            createdPayments.push({
                paymentId: managementPayment.id,
                invoiceId: managementInvoice.id,
                contractId: contract.id,
                propertyName: contract.unit.property.name,
                unitName: contract.unit.name,
                ownerName: `${contract.unit.property.client.firstName} ${contract.unit.property.client.lastName}`,
                tenantName: `${contract.renter.firstName} ${contract.renter.lastName}`,
                amount: commissionAmount,
                commissionRate: commissionRate
            });

            processedCount++;
        }

        // 6. عرض النتائج النهائية
        console.log("\n" + "=".repeat(60));
        console.log("📊 ملخص عملية حساب عمولة الإدارة للعقود من بداية 2025");
        console.log("=".repeat(60));
        console.log(`📋 إجمالي العقود المفحوصة: ${activeContracts.length}`);
        console.log(`✅ العقود المعالجة (تم إنشاء دفعات عمولة): ${processedCount}`);
        console.log(`⚠️  العقود المتجاهلة (عمولة موجودة أو لا توجد نسبة): ${skippedCount}`);

        if (createdPayments.length > 0) {
            console.log("\n📄 تفاصيل الدفعات المُنشأة:");
            console.log("-".repeat(60));
            
            let totalCommissions = 0;
            createdPayments.forEach((payment, index) => {
                console.log(`${index + 1}. Payment ID: ${payment.paymentId}`);
                console.log(`   العقد: ${payment.contractId}`);
                console.log(`   العقار: ${payment.propertyName} - ${payment.unitName}`);
                console.log(`   المالك: ${payment.ownerName}`);
                console.log(`   المستأجر: ${payment.tenantName}`);
                console.log(`   نسبة العمولة: ${payment.commissionRate}%`);
                console.log(`   قيمة العمولة: ${payment.amount} ريال`);
                console.log("");
                totalCommissions += payment.amount;
            });

            console.log(`💰 إجمالي عمولات الإدارة المُحسبة: ${totalCommissions.toFixed(2)} ريال`);
        }

        console.log("\n✅ تم الانتهاء من عملية حساب عمولة الإدارة بنجاح!");
        
        // اقتراح للتحقق من النتائج
        console.log("\n💡 للتحقق من النتائج:");
        console.log("1. تحقق من جدول Payment للعقود المعالجة");
        console.log("2. تأكد من ظهور الدفعات بنوع MANAGEMENT_COMMISSION");
        console.log("3. راجع المبالغ والتواريخ في قاعدة البيانات");

    } catch (error) {
        console.error("❌ خطأ في تنفيذ السكربت:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// تشغيل الدالة الرئيسية
calculateManagementCommissionsFor2025()
    .catch((error) => {
        console.error("❌ خطأ عام:", error);
        process.exit(1);
    });

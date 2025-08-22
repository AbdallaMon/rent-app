/**
 * سكربت إصلاح دفعات عمولة الإدارة التي تم إنشاؤها بدون فواتير
 * 
 * المشكلة: تم إنشاء دفعات عمولة إدارة بحالة PAID دون إنشاء فواتير
 * الحل: تحديث حالة الدفعات إلى PENDING وإنشاء فواتير مناسبة
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixManagementCommissionPayments() {
    console.log("🔧 بدء إصلاح دفعات عمولة الإدارة...");
    
    try {
        const now = new Date();
        
        // 1. البحث عن دفعات العمولة التي تم إنشاؤها مؤخراً (اليوم)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const managementPayments = await prisma.payment.findMany({
            where: {
                paymentType: 'MANAGEMENT_COMMISSION',
                createdAt: {
                    gte: today
                }
            },
            include: {
                rentAgreement: {
                    include: {
                        unit: {
                            include: {
                                property: {
                                    include: {
                                        client: true
                                    }
                                }
                            }
                        },
                        renter: true
                    }
                },
                invoices: true // للتحقق من وجود فواتير
            },
            orderBy: {
                id: 'asc'
            }
        });

        console.log(`📋 تم العثور على ${managementPayments.length} دفعة عمولة إدارة تم إنشاؤها اليوم`);

        if (managementPayments.length === 0) {
            console.log("✅ لا توجد دفعات عمولة إدارة تحتاج إصلاح");
            return;
        }

        let fixedCount = 0;
        let skippedCount = 0;

        for (const payment of managementPayments) {
            console.log(`\n🔍 معالجة الدفعة ID: ${payment.id}`);
            
            if (!payment.rentAgreement) {
                console.log(`   ⚠️  لا يوجد عقد مرتبط - تم تجاهل الدفعة`);
                skippedCount++;
                continue;
            }

            const contract = payment.rentAgreement;
            
            console.log(`   📍 العقد: ${contract.id}`);
            console.log(`   🏢 العقار: ${contract.unit.property.name} - الوحدة: ${contract.unit.name || 'غير محدد'}`);
            console.log(`   💰 قيمة العمولة: ${payment.amount} ريال`);
            console.log(`   📊 حالة الدفعة الحالية: ${payment.status}`);

            // التحقق من وجود فاتورة مرتبطة
            if (payment.invoices && payment.invoices.length > 0) {
                console.log(`   ✅ توجد فاتورة مرتبطة بالفعل - تم تجاهل الدفعة`);
                skippedCount++;
                continue;
            }

            try {
                // تحديث حالة الدفعة إلى PENDING وتصفير المبلغ المدفوع
                const updatedPayment = await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'PENDING',
                        paidAmount: 0,
                        updatedAt: now
                    }
                });

                // إنشاء فاتورة لعمولة الإدارة
                const managementInvoice = await prisma.invoice.create({
                    data: {
                        amount: payment.amount,
                        description: `فاتورة عمولة إدارة للعقد ${contract.id} - ${contract.unit.property.name}`,
                        invoiceType: 'MANAGEMENT_COMMISSION',
                        createdAt: now,
                        updatedAt: now,
                        // ربط الفاتورة بالدفعة
                        paymentId: payment.id,
                        // ربط الفاتورة بالعقد
                        rentAgreementId: contract.id,
                        // ربط الفاتورة بالمالك
                        ownerId: contract.unit.property.clientId,
                        // ربط الفاتورة بالعقار
                        propertyId: contract.unit.propertyId
                    }
                });

                console.log(`   ✅ تم تحديث الدفعة وإنشاء فاتورة (Invoice ID: ${managementInvoice.id})`);
                fixedCount++;

            } catch (error) {
                console.error(`   ❌ خطأ في معالجة الدفعة ${payment.id}:`, error.message);
                skippedCount++;
            }
        }

        // عرض النتائج النهائية
        console.log("\n" + "=".repeat(60));
        console.log("📊 ملخص عملية إصلاح دفعات عمولة الإدارة");
        console.log("=".repeat(60));
        console.log(`📋 إجمالي الدفعات المفحوصة: ${managementPayments.length}`);
        console.log(`✅ الدفعات المُصلحة (تم إنشاء فواتير): ${fixedCount}`);
        console.log(`⚠️  الدفعات المتجاهلة: ${skippedCount}`);

        console.log("\n✅ تم الانتهاء من عملية الإصلاح بنجاح!");
        
        console.log("\n💡 النتائج:");
        console.log("1. تم تحديث حالة الدفعات من PAID إلى PENDING");
        console.log("2. تم تصفير المبلغ المدفوع في الدفعات");
        console.log("3. تم إنشاء فواتير مناسبة لكل دفعة");
        console.log("4. يمكن الآن دفع الفواتير عبر النظام العادي");

    } catch (error) {
        console.error("❌ خطأ في تنفيذ السكربت:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// تشغيل الدالة الرئيسية
fixManagementCommissionPayments()
    .catch((error) => {
        console.error("❌ خطأ عام:", error);
        process.exit(1);
    });

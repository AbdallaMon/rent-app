/**
 * سكربت حساب عمولة الإدارة للعقود النشطة من بداية 2025
 * 
 * المنطق:
 * 1. البحث عن العقود النشطة التي بدأت من 01/01/2025
 * 2. التحقق من عدم وجود فاتورة عمولة إدارة سابقة لهذا العقد
 * 3. حساب العمولة بناءً على نسبة العمولة في العقار والمبلغ الإجمالي للعقد
 * 4. إنشاء فاتورة جديدة بنوع MANAGEMENT_COMMISSION
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
                renter: true, // المستأجر
                // التحقق من الدفعات الموجودة لتجنب التكرار
                payments: {
                    where: {
                        paymentType: 'MANAGEMENT_COMMISSION'
                    }
                }
            }
        });
        
        console.log(`📊 تم العثور على ${activeContracts.length} عقد نشط من بداية 2025`);
        
        let processedCount = 0;
        let skippedCount = 0;
        let totalCommissionAmount = 0;
        const results = [];
        
        for (const contract of activeContracts) {
            console.log(`\n🔍 معالجة العقد #${contract.id} - ${contract.rentAgreementNumber}`);
            
            // 2. التحقق من عدم وجود دفعة عمولة سابقة
            if (contract.payments && contract.payments.length > 0) {
                console.log(`⚠️  تم تخطي العقد #${contract.id} - يوجد دفعة عمولة إدارة سابقة`);
                skippedCount++;
                continue;
            }
            
            // 3. حساب عمولة الإدارة
            const property = contract.unit.property;
            const managementCommissionRate = property.managementCommission || 0; // نسبة العمولة من العقار
            const totalContractPrice = contract.totalContractPrice || contract.totalPrice;
            
            if (managementCommissionRate <= 0) {
                console.log(`⚠️  تم تخطي العقد #${contract.id} - نسبة العمولة غير محددة أو صفر`);
                skippedCount++;
                continue;
            }
            
            // حساب مبلغ العمولة
            const commissionAmount = (totalContractPrice * managementCommissionRate) / 100;
            
            console.log(`💰 تفاصيل العمولة:`);
            console.log(`   - مجموع العقد: ${totalContractPrice} درهم`);
            console.log(`   - نسبة العمولة: ${managementCommissionRate}%`);
            console.log(`   - مبلغ العمولة: ${commissionAmount} درهم`);
            
            // 4. إنشاء دفعة عمولة الإدارة في جدول Payment (ليتماشى مع النظام الحالي)
            // ملاحظة: النظام الحالي يضع عمولة الإدارة في جدول Payment وليس Invoice
            // هذا لأن عمولة الإدارة تُعتبر "دفعة مستحقة" للشركة من المالك
            try {
                const newPayment = await prisma.payment.create({
                    data: {
                        amount: commissionAmount,
                        title: `عمولة إدارة ${managementCommissionRate}% من إجمالي العقد`,
                        dueDate: contract.startDate, // تاريخ بداية العقد
                        status: "PENDING", // معلقة (لم تُدفع بعد)
                        paymentType: "MANAGEMENT_COMMISSION",
                        clientId: property.clientId, // مالك العقار (المدين)
                        propertyId: property.id, // العقار
                        unitId: contract.unitId, // الوحدة
                        rentAgreementId: contract.id, // العقد المرتبط
                        createdAt: contract.startDate, // تاريخ بداية العقد
                    },
                    include: {
                        property: {
                            select: {
                                name: true,
                                client: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        },
                        client: {
                            select: {
                                name: true
                            }
                        }
                    }
                });
                
                console.log(`✅ تم إنشاء دفعة عمولة الإدارة #${newPayment.id} بنجاح`);
                
                processedCount++;
                totalCommissionAmount += commissionAmount;
                
                results.push({
                    contractId: contract.id,
                    contractNumber: contract.rentAgreementNumber,
                    paymentId: newPayment.id, // معرف الدفعة وليس الفاتورة
                    propertyName: property.name,
                    ownerName: property.client.name,
                    renterName: contract.renter.name,
                    commissionRate: managementCommissionRate,
                    contractAmount: totalContractPrice,
                    commissionAmount: commissionAmount,
                    startDate: contract.startDate
                });
                
            } catch (error) {
                console.error(`❌ خطأ في إنشاء دفعة عمولة إدارة للعقد #${contract.id}:`, error.message);
                skippedCount++;
            }
        }
        
        // تقرير النتائج
        console.log(`\n📋 تقرير النتائج النهائي:`);
        console.log(`✅ تم معالجة: ${processedCount} عقد`);
        console.log(`⚠️  تم تخطي: ${skippedCount} عقد`);
        console.log(`💰 إجمالي مبلغ العمولات: ${totalCommissionAmount.toFixed(2)} درهم`);
        
        if (results.length > 0) {
            console.log(`\n📊 تفاصيل الدفعات المُنشأة:`);
            results.forEach((result, index) => {
                console.log(`${index + 1}. العقد ${result.contractNumber}`);
                console.log(`   - العقار: ${result.propertyName}`);
                console.log(`   - المالك: ${result.ownerName}`);
                console.log(`   - المستأجر: ${result.renterName}`);
                console.log(`   - مبلغ العقد: ${result.contractAmount} درهم`);
                console.log(`   - نسبة العمولة: ${result.commissionRate}%`);
                console.log(`   - مبلغ العمولة: ${result.commissionAmount} درهم`);
                console.log(`   - رقم الدفعة: #${result.paymentId}`);
                console.log(`   - تاريخ بداية العقد: ${result.startDate.toLocaleDateString('ar-SA')}`);
                console.log(`   ---`);
            });
        }
        
        // حفظ التقرير في ملف JSON
        const reportData = {
            processedDate: now,
            startDate: startDate2025,
            summary: {
                totalContracts: activeContracts.length,
                processedContracts: processedCount,
                skippedContracts: skippedCount,
                totalCommissionAmount: totalCommissionAmount
            },
            results: results
        };
        
        // يمكن حفظ التقرير في ملف
        // await fs.writeFile('management-commission-report.json', JSON.stringify(reportData, null, 2));
        
        return reportData;
        
    } catch (error) {
        console.error("❌ خطأ عام في المعالجة:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// تشغيل السكربت
if (require.main === module) {
    calculateManagementCommissionsFor2025()
        .then((report) => {
            console.log("\n🎉 تم الانتهاء من حساب عمولة الإدارة بنجاح!");
            console.log("📄 تقرير موجز:", JSON.stringify(report.summary, null, 2));
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 فشل في تنفيذ السكربت:", error);
            process.exit(1);
        });
}

export { calculateManagementCommissionsFor2025 };

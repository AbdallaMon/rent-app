// File:/api/notification/email/route.js
import { render } from '@react-email/render';

import { sendEmail } from '../../utlis/sendMail';
import RentAgreementEmail from '@/helpers/functions/sentEmail';

// Helper functions for rent collection type translation
function getRentCollectionTypeArabic(type) {
    const translations = {
        'ONE_MONTH': 'شهر واحد',
        'TWO_MONTHS': 'شهرين',
        'THREE_MONTHS': 'ثلاثة أشهر',
        'FOUR_MONTHS': 'أربعة أشهر',
        'SIX_MONTHS': 'ستة أشهر',
        'ONE_YEAR': 'سنة واحدة'
    };
    return translations[type] || type;
}

function getRentCollectionTypeEnglish(type) {
    const translations = {
        'ONE_MONTH': 'One Month',
        'TWO_MONTHS': 'Two Months',
        'THREE_MONTHS': 'Three Months',
        'FOUR_MONTHS': 'Four Months',
        'SIX_MONTHS': 'Six Months',
        'ONE_YEAR': 'One Year'
    };
    return translations[type] || type;
}

// Helper function to format dates in DD/MM/YYYY format
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    
    return {
        arabic: formattedDate,
        english: formattedDate,
        formatted: formattedDate
    };
}

// Helper function to format currency amounts
function formatCurrency(amount) {
    const numberAmount = Number(amount);
    // Use English locale for both to ensure English numbers
    const arabicFormatted = numberAmount.toLocaleString('en-US');
    const englishFormatted = numberAmount.toLocaleString('en-US');
    
    return {
        arabic: `${arabicFormatted} درهم`,
        english: `AED ${englishFormatted}`,
        formatted: `${arabicFormatted} درهم | AED ${englishFormatted}`
    };
}

// API route handler for rent agreement emails
export async function POST(request) {
    try {
        const data = await request.json();
       
        // Validate required fields
        const requiredFields = ['renterName', 'unitNumber', 'propertyName', 'startDate', 'endDate', 'totalContractPrice', 'rentCollectionType', 'renterEmail'];
        for (const field of requiredFields) {
            if (!data[field]) {
                console.error(`Missing required field: ${field}`);
                return Response.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Helper function to generate installments table
        function generateInstallmentsTable(installments) {
            if (!installments || installments.length === 0) {
                return `
            📋 جدول الأقساط - Installments Schedule:
               لا توجد أقساط محددة حالياً | No installments specified currently
                `;
            }

            let table = `
            📋 جدول الأقساط - Installments Schedule:
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `;

            installments.forEach((installment, index) => {
                const dueDate = formatDate(installment.dueDate);
                const amount = formatCurrency(installment.amount);
                table += `
            📅 القسط ${index + 1} - Installment ${index + 1}:
               � تاريخ الاستحقاق - Due Date: ${dueDate.formatted}
               � المبلغ - Amount: ${amount.formatted}
            `;
            });

            table += `
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `;

            return table;
        }
       
        // Create the email component
        const emailComponent = (
            <RentAgreementEmail
                renterName={data.renterName}
                unitNumber={data.unitNumber}
                propertyName={data.propertyName}
                startDate={data.startDate}
                endDate={data.endDate}
                totalPrice={data.totalContractPrice}
                rentCollectionType={data.rentCollectionType}
                installments={data.installments}
                language={data.language || 'ar'}
                rentAgreementNumber={data.rentAgreementNumber}
                tax={data.tax}
                registrationFees={data.registrationFees}
                insuranceFees={data.insuranceFees}
            />
        );
        
        // Render the email HTML and ensure it's resolved
        let emailHtml = render(emailComponent);
        // Make sure we await if it's a promise
        if (emailHtml instanceof Promise) {
            emailHtml = await emailHtml;
        }
        
        // Format dates and currency for better presentation
        const startDateFormatted = formatDate(data.startDate);
        const endDateFormatted = formatDate(data.endDate);
        const totalPriceFormatted = formatCurrency(data.totalContractPrice);
        
        // Generate installments table
        const installmentsTable = generateInstallmentsTable(data.installments);
        
        // Create a bilingual plain text version (Arabic and English)
        const plainText = `
            إشعار اتفاقية إيجار جديدة - New Rental Agreement Notification
            
            عزيزي/عزيزتي ${data.renterName}،
            Dear ${data.renterName},
            
            نود إعلامكم بأنه تم إنشاء اتفاقية إيجار جديدة للوحدة رقم ${data.unitNumber} في عقار ${data.propertyName}.
            We are pleased to inform you that a new rental agreement has been created for unit number ${data.unitNumber} in ${data.propertyName} property.
            
            تفاصيل الاتفاقية - Agreement Details:
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            � رقم العقد - Contract Number:
               ${data.rentAgreementNumber || 'غير محدد - Not specified'}
            
            �📅 تاريخ البدء - Start Date:
               ${startDateFormatted.formatted}
            
            📅 تاريخ الانتهاء - End Date:
               ${endDateFormatted.formatted}
            
            💰 إجمالي سعر العقد - Total Contract Price:
               ${totalPriceFormatted.formatted}
            
            🔄 دورة تحصيل الإيجار - Rent Collection Cycle:
               ${getRentCollectionTypeArabic(data.rentCollectionType)} | ${getRentCollectionTypeEnglish(data.rentCollectionType)}
            
            ${data.tax ? `💸 الضريبة - Tax: ${formatCurrency(data.tax).formatted}` : ''}
            ${data.registrationFees ? `📄 رسوم التسجيل - Registration Fees: ${formatCurrency(data.registrationFees).formatted}` : ''}
            ${data.insuranceFees ? `🛡️ رسوم التأمين - Insurance Fees: ${formatCurrency(data.insuranceFees).formatted}` : ''}
            
            ${installmentsTable}
            
            📌 ملاحظة مهمة - Important Note:
            يرجى الاحتفاظ بهذا الإيميل كمرجع لبيانات عقد الإيجار ومواعيد دفع الأقساط.
            Please keep this email as a reference for your rental agreement details and installment payment dates.
            
            نشكركم على ثقتكم بنا ونتطلع إلى خدمتكم بشكل مستمر.
            Thank you for your trust and we look forward to serving you continuously.
            
            مع أطيب التحيات - Best Regards,
            فريق إدارة العقارات - Property Management Team
            شركة تار العقارية - TAR Real Estate Company
        `;
        
        // Send the email with resolved content
        const result = await sendEmail(
            data.renterEmail,
            'تم إنشاء اتفاقية إيجار جديدة - New Rental Agreement Created',
            emailHtml,
            plainText
        );
        
        return Response.json({ success: true, messageId: result?.messageId });
    } catch (error) {
        console.error('Failed to send email:', error);
        return Response.json(
            { error: 'Failed to send email', details: error.message },
            { status: 500 }
        );
    }
}

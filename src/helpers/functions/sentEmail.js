import {
    Body,
    Column,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Preview,
    Row,
    Section,
    Text,
  } from '@react-email/components';
  import * as React from 'react';
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  export const RentAgreementEmail = ({ 
    renterName,
    unitNumber,
    propertyName,
    startDate,
    endDate,
    totalPrice,
    rentCollectionType,
    installments = [],
    language = 'ar', // 'ar' for Arabic, 'en' for English
    rentAgreementNumber,
    tax,
    registrationFees,
    insuranceFees
  }) => {
    
    // Helper function to format dates - Arabic dates in Arabic, English dates in English
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      // Always use English numerals for dates regardless of language
      return `${day}/${month}/${year}`;
    };

    // Helper function to format currency - Arabic formatting for Arabic, English for English
    const formatCurrency = (amount) => {
      const number = Number(amount);
      if (language === 'ar') {
        // Arabic formatting but with English numerals
        return number.toLocaleString('en-US');
      } else {
        // English formatting
        return number.toLocaleString('en-US');
      }
    };

    // Helper function to format numbers - always English numerals
    const formatNumber = (num) => {
      // Convert Arabic numerals to English numerals
      return String(num).replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
    };

    // Helper function to translate rent collection type
    const translateRentCollectionType = (type) => {
      const translations = {
        ar: {
          'ONE_MONTH': 'شهر واحد',
          'TWO_MONTHS': 'شهرين',
          'THREE_MONTHS': 'ثلاثة أشهر',
          'FOUR_MONTHS': 'أربعة أشهر',
          'SIX_MONTHS': 'ستة أشهر',
          'ONE_YEAR': 'سنة واحدة'
        },
        en: {
          'ONE_MONTH': 'One Month',
          'TWO_MONTHS': 'Two Months',
          'THREE_MONTHS': 'Three Months',
          'FOUR_MONTHS': 'Four Months',
          'SIX_MONTHS': 'Six Months',
          'ONE_YEAR': 'One Year'
        }
      };
      return translations[language][type] || type;
    };

    // Text content based on language with enhanced formatting
    const content = {
      ar: {
        preview: 'إشعار اتفاقية إيجار جديدة - شركة تار العقارية',
        heading: 'إشعار إنشاء اتفاقية إيجار جديدة',
        greeting: `السلام عليكم ورحمة الله وبركاته\n\nعزيزي/عزيزتي ${renterName}،`,
        mainText: `يسرنا إعلامكم بأنه تم إنشاء اتفاقية إيجار جديدة للوحدة رقم ${formatNumber(unitNumber)} في عقار ${propertyName}.`,
        detailsHeading: 'تفاصيل اتفاقية الإيجار:',
        contractNumber: `• رقم العقد: ${rentAgreementNumber || 'غير محدد'}`,
        unitInfo: `• الوحدة رقم: ${formatNumber(unitNumber)}`,
        propertyInfo: `• العقار: ${propertyName}`,
        startDate: `• تاريخ بداية العقد: ${formatDate(startDate)}`,
        endDate: `• تاريخ انتهاء العقد: ${formatDate(endDate)}`,
        totalPrice: `• إجمالي قيمة العقد: ${formatCurrency(totalPrice)} درهم إماراتي`,
        rentType: `• دورة تحصيل الإيجار: ${translateRentCollectionType(rentCollectionType)}`,
        taxInfo: tax ? `• الضريبة: ${formatCurrency(tax)} درهم إماراتي` : null,
        regFeesInfo: registrationFees ? `• رسوم التسجيل: ${formatCurrency(registrationFees)} درهم إماراتي` : null,
        insuranceInfo: insuranceFees ? `• رسوم التأمين: ${formatCurrency(insuranceFees)} درهم إماراتي` : null,
        installmentsHeading: 'جدول مواعيد دفع الأقساط:',
        installmentNumber: (index) => `القسط رقم ${formatNumber(index + 1)}`,
        installmentDate: 'تاريخ الاستحقاق',
        installmentAmount: 'المبلغ المستحق',
        currency: 'درهم',
        keepEmail: 'يرجى الاحتفاظ بهذا البريد الإلكتروني كمرجع لبيانات عقد الإيجار ومواعيد دفع الأقساط.',
        thankYou: 'نشكركم على ثقتكم بنا ونتطلع إلى خدمتكم بأفضل ما لدينا.',
        footer: 'لقد تلقيت هذا البريد الإلكتروني لأنك مستأجر مسجل في نظام شركة تار العقارية.',
        companyName: 'شركة تار العقارية',
        regards: 'مع أطيب التحيات،'
      },
      en: {
        preview: 'New Rental Agreement Notification - TAR Real Estate',
        heading: 'New Rental Agreement Creation Notice',
        greeting: `Dear ${renterName},`,
        mainText: `We are pleased to inform you that a new rental agreement has been created for unit number ${formatNumber(unitNumber)} in ${propertyName} property.`,
        detailsHeading: 'Rental Agreement Details:',
        contractNumber: `• Contract Number: ${rentAgreementNumber || 'Not specified'}`,
        unitInfo: `• Unit Number: ${formatNumber(unitNumber)}`,
        propertyInfo: `• Property: ${propertyName}`,
        startDate: `• Contract Start Date: ${formatDate(startDate)}`,
        endDate: `• Contract End Date: ${formatDate(endDate)}`,
        totalPrice: `• Total Contract Value: ${formatCurrency(totalPrice)} AED`,
        rentType: `• Rent Collection Cycle: ${translateRentCollectionType(rentCollectionType)}`,
        taxInfo: tax ? `• Tax: ${formatCurrency(tax)} AED` : null,
        regFeesInfo: registrationFees ? `• Registration Fees: ${formatCurrency(registrationFees)} AED` : null,
        insuranceInfo: insuranceFees ? `• Insurance Fees: ${formatCurrency(insuranceFees)} AED` : null,
        installmentsHeading: 'Installment Payment Schedule:',
        installmentNumber: (index) => `Installment ${formatNumber(index + 1)}`,
        installmentDate: 'Due Date',
        installmentAmount: 'Amount Due',
        currency: 'AED',
        keepEmail: 'Please keep this email as a reference for your rental agreement details and installment payment dates.',
        thankYou: 'Thank you for your trust in us and we look forward to serving you with the best we have.',
        footer: 'You received this email because you are a registered tenant in TAR Real Estate system.',
        companyName: 'TAR Real Estate Company',
        regards: 'Best Regards,'
      }
    };

    const currentContent = content[language];
    const isRTL = language === 'ar';

    // Dynamic styles based on language
    const dynamicMain = {
      ...main,
      direction: isRTL ? 'rtl' : 'ltr'
    };

    const dynamicContainer = {
      ...container,
      direction: isRTL ? 'rtl' : 'ltr'
    };

    return (
    <Html dir={isRTL ? "rtl" : "ltr"}>
      <Head />
      <Body style={main}>
        {/* Background overlay for better readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(246, 249, 252, 0.85)',
          zIndex: 1,
        }}></div>
        
        <Preview>{currentContent.preview}</Preview>
        <Container style={{...dynamicContainer, position: 'relative', zIndex: 2}}>
          <Section>
            <Row>
              <Column>
                <Img
                  style={headerImage}
                  src={`${baseUrl}/about.jpg`}
                  width="300"
                  height="40"
                  alt={language === 'ar' ? 'شركة تار العقارية' : 'TAR Real Estate'}
                />
              </Column>
            </Row>
          </Section>
  
          <Section style={paragraphContent}>
            <Hr style={hr} />
            <Text style={isRTL ? heading : {...heading, textAlign: 'left'}}>{currentContent.heading}</Text>
            <Text style={isRTL ? paragraph : {...paragraph, textAlign: 'left'}}>
              {currentContent.greeting}
            </Text>
            <Text style={isRTL ? paragraph : {...paragraph, textAlign: 'left'}}>
              {currentContent.mainText}
            </Text>
          </Section>
  
          <Section style={paragraphList}>
            <Text style={isRTL ? paragraph : {...paragraph, textAlign: 'left'}}>{currentContent.detailsHeading}</Text>
            {currentContent.contractNumber && (
              <Text style={isRTL ? listItem : {...listItem, paddingLeft: '20px', paddingRight: '0', textAlign: 'left'}}>{currentContent.contractNumber}</Text>
            )}
            <Text style={isRTL ? listItem : {...listItem, paddingLeft: '20px', paddingRight: '0', textAlign: 'left'}}>{currentContent.unitInfo}</Text>
            <Text style={isRTL ? listItem : {...listItem, paddingLeft: '20px', paddingRight: '0', textAlign: 'left'}}>{currentContent.propertyInfo}</Text>
            <Text style={isRTL ? listItem : {...listItem, paddingLeft: '20px', paddingRight: '0', textAlign: 'left'}}>{currentContent.startDate}</Text>
            <Text style={isRTL ? listItem : {...listItem, paddingLeft: '20px', paddingRight: '0', textAlign: 'left'}}>{currentContent.endDate}</Text>
            <Text style={isRTL ? listItem : {...listItem, paddingLeft: '20px', paddingRight: '0', textAlign: 'left'}}>{currentContent.totalPrice}</Text>
            <Text style={isRTL ? listItem : {...listItem, paddingLeft: '20px', paddingRight: '0', textAlign: 'left'}}>{currentContent.rentType}</Text>
            {currentContent.taxInfo && (
              <Text style={isRTL ? listItem : {...listItem, paddingLeft: '20px', paddingRight: '0', textAlign: 'left'}}>{currentContent.taxInfo}</Text>
            )}
            {currentContent.regFeesInfo && (
              <Text style={isRTL ? listItem : {...listItem, paddingLeft: '20px', paddingRight: '0', textAlign: 'left'}}>{currentContent.regFeesInfo}</Text>
            )}
            {currentContent.insuranceInfo && (
              <Text style={isRTL ? listItem : {...listItem, paddingLeft: '20px', paddingRight: '0', textAlign: 'left'}}>{currentContent.insuranceInfo}</Text>
            )}
          </Section>

          {/* Enhanced Installments Section */}
          {installments && installments.length > 0 && (
            <Section style={paragraphList}>
              <Text style={isRTL ? installmentsHeading : {...installmentsHeading, textAlign: 'left'}}>{currentContent.installmentsHeading}</Text>
              <div style={tableWrapper}>
                <table style={installmentsTable}>
                  <thead>
                    <tr style={installmentHeaderRow}>
                      <th style={installmentHeaderCell}>
                        {language === 'ar' ? 'رقم القسط' : 'Installment #'}
                      </th>
                      <th style={installmentHeaderCell}>
                        {currentContent.installmentDate}
                      </th>
                      <th style={installmentHeaderCell}>
                        {currentContent.installmentAmount}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((installment, index) => (
                      <tr key={index} style={{
                        ...installmentRow,
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                      }}>
                        <td style={installmentCell}>
                          {formatNumber(index + 1)}
                        </td>
                        <td style={installmentCell}>
                          {formatDate(installment.dueDate)}
                        </td>
                        <td style={installmentCell}>
                          {formatCurrency(installment.amount)} {currentContent.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
  
          <Section style={paragraphContent}>
            <Text style={isRTL ? paragraph : {...paragraph, textAlign: 'left'}}>
              {currentContent.keepEmail}
            </Text>
            <Text style={isRTL ? paragraph : {...paragraph, textAlign: 'left'}}>
              {currentContent.thankYou}
            </Text>
            <Text style={isRTL ? paragraph : {...paragraph, textAlign: 'left'}}>
              {currentContent.regards}
            </Text>
            <Text style={isRTL ? paragraph : {...paragraph, textAlign: 'left'}}>
              <strong>{currentContent.companyName}</strong>
            </Text>
            <Hr style={hr} />
          </Section>
  
          <Section style={{ ...paragraphContent, paddingBottom: 30 }}>
            <Text style={footerText}>
              © {new Date().getFullYear()} 
            </Text>
            <Text style={footerText}>
              {currentContent.footer}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
  
  export default RentAgreementEmail;
  
  const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    backgroundImage: `url(${baseUrl}/logo-1.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    position: 'relative',
  };
  
  const container = {
    margin: '30px auto',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 5,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  };
  
  const headerImage = {
    margin: '20px auto',
    display: 'block',
    maxWidth: '400px',
    width: '100%',
    height: 'auto',
    borderRadius: '8px',
  };
  
  const containerContact = {
    backgroundColor: '#f7f9fc',
    width: '90%',
    borderRadius: '5px',
    overflow: 'hidden',
    paddingRight: '20px',
    margin: '20px auto',
  };
  
  const heading = {
    fontSize: '20px',
    lineHeight: '26px',
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'right',
  };
  
  const paragraphContent = {
    padding: '0 40px',
  };
  
  const paragraphList = {
    paddingRight: 40,
    paddingLeft: 40,
  };
  
  const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#3c4043',
    textAlign: 'right',
  };
  
  const listItem = {
    ...paragraph,
    paddingRight: '20px',
  };
  
  const hr = {
    borderColor: '#e8eaed',
    margin: '20px 0',
  };
  
  const footerText = {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '5px 0',
  };

  const installmentsHeading = {
    ...paragraph,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '15px',
  };

  const installmentsTable = {
    width: '100%',
    border: '2px solid #1976d2',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    margin: '15px 0',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    boxShadow: '0 4px 16px rgba(25, 118, 210, 0.1)',
    backdropFilter: 'blur(5px)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  };

  const tableWrapper = {
    overflow: 'hidden',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(25, 118, 210, 0.1)',
  };

  const installmentHeaderRow = {
    backgroundColor: '#1976d2',
    borderBottom: '2px solid #1565c0',
  };

  const installmentHeaderCell = {
    padding: '15px 10px',
    textAlign: 'center',
    borderRight: '1px solid #1565c0',
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    width: '33.33%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
  };

  const installmentRow = {
    borderBottom: '1px solid #e8eaed',
    transition: 'background-color 0.2s ease',
  };

  const installmentCell = {
    padding: '12px 10px',
    textAlign: 'center',
    borderRight: '1px solid #e8eaed',
    fontSize: '14px',
    color: '#2c3e50',
    fontWeight: '500',
    width: '33.33%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    verticalAlign: 'middle',
  };

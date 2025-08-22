// File: /app/api/cron/notifications/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { sendEmail } from '../utlis/sendMail';
import RentAgreementEmail from '@/helpers/functions/sentEmail';

const prisma = new PrismaClient();

export async function GET(request) {
  // Check for cron secret key to secure the endpoint
const authHeader = request.headers.get('authorization');

  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }  

  const today = new Date();
  const twoWeeksFromNow = new Date(new Date().setDate(today.getDate() + 14));
  const twoMonthsFromNow = new Date(new Date().setMonth(today.getMonth() + 2));

  // Helper function to format dates (DD/MM/YYYY)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Helper function to sanitize text for WhatsApp
  const sanitizeForWhatsApp = (text) => {
    if (!text) return '';
    // Replace tabs and newlines with spaces
    let sanitized = text.replace(/[\t\n\r]/g, ' ');
    // Replace multiple consecutive spaces with a single space
    sanitized = sanitized.replace(/\s{2,}/g, ' ');
    // Trim any leading/trailing spaces
    return sanitized.trim();
  };

  try {
    // Fetch payments due in 2 weeks with complete client information
    const duePayments = await prisma.payment.findMany({
      where: {
        dueDate: {
          lte: twoWeeksFromNow,
          gte: today
        },
        status: 'PENDING'
      },
      include: {
        client: true,
        property: true
      }
    });

    // Fetch contracts expiring in 2 months with complete renter information
    const expiringContracts = await prisma.rentAgreement.findMany({
      where: {
        endDate: {
          lte: twoMonthsFromNow,
          gte: today
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

    const results = {
      paymentNotifications: [],
      contractNotifications: [],
      errors: []
    };

    // Send WhatsApp messages and emails for due payments
    for (const payment of duePayments) {
      try {
        // Make sure client exists
        if (!payment.client) {
          results.errors.push({
            type: 'payment',
            id: payment.id,
            error: 'Client not found'
          });
          continue;
        }

        const formattedDueDate = formatDate(payment.dueDate);
        const hasPhone = payment.client.phone && payment.client.phone.trim() !== '';
        const hasEmail = payment.client.email && payment.client.email.trim() !== '';

        // Skip if no contact methods available
        if (!hasPhone && !hasEmail) {
          results.errors.push({
            type: 'payment',
            id: payment.id,
            error: 'No contact methods available for client'
          });
          continue;
        }

        const templateVariables = {
          // Sanitize all text variables for WhatsApp
          1: sanitizeForWhatsApp(payment.client.name) || 'Tenant',
          2: sanitizeForWhatsApp(payment.amount.toString()),
          3: sanitizeForWhatsApp(payment.property?.name) || 'Property',
          4: sanitizeForWhatsApp(formattedDueDate)
        };

        // Try to send WhatsApp message only if phone exists
        if (hasPhone) {
          try {
            await sendWhatsAppMessage(
              payment.client.phone,
              templateVariables,
              true,
              'payment_due_reminder'
            );
            
            results.paymentNotifications.push({
              id: payment.id,
              clientId: payment.client.id,
              whatsapp: 'sent to ' + payment.client.phone
            });
          } catch (whatsappError) {
            // Log WhatsApp error but continue with email
            console.error(`WhatsApp error for payment ${payment.id}:`, whatsappError.message);
            console.error('Error details:', JSON.stringify(whatsappError, null, 2));
            results.errors.push({
              type: 'payment_whatsapp',
              id: payment.id,
              clientId: payment.client.id,
              error: whatsappError.message,
              variables: JSON.stringify(templateVariables)
            });
          }
        }

        // Try to send email only if email exists
        if (hasEmail) {
          try {
            const emailHtml = RentAgreementEmail({
              renterName: payment.client.name || 'Tenant',
              unitNumber: payment.property?.name || 'Unit',
              propertyName: payment.property?.name || 'Property',
              startDate: formattedDueDate,
              endDate: formattedDueDate,
              totalPrice: payment.amount,
              rentCollectionType: '1'
            });

            await sendEmail(
              payment.client.email,
              'تذكير باستحقاق الدفع',
              emailHtml
            );
            
            results.paymentNotifications.push({
              id: payment.id,
              clientId: payment.client.id,
              email: 'sent to ' + payment.client.email
            });
          } catch (emailError) {
            console.error(`Email error for payment ${payment.id}:`, emailError.message);
            results.errors.push({
              type: 'payment_email',
              id: payment.id,
              clientId: payment.client.id,
              error: emailError.message
            });
          }
        }
      } catch (paymentError) {
        console.error(`Error processing payment ${payment.id}:`, paymentError);
        results.errors.push({
          type: 'payment_processing',
          id: payment.id,
          error: paymentError.message
        });
      }
    }

    // Send WhatsApp messages and emails for expiring contracts
    for (const contract of expiringContracts) {
      try {
        // Make sure renter exists
        if (!contract.renter) {
          results.errors.push({
            type: 'contract',
            id: contract.id,
            error: 'Renter not found'
          });
          continue;
        }

        const formattedEndDate = formatDate(contract.endDate);
        const hasPhone = contract.renter.phone && contract.renter.phone.trim() !== '';
        const hasEmail = contract.renter.email && contract.renter.email.trim() !== '';

        // Skip if no contact methods available
        if (!hasPhone && !hasEmail) {
          results.errors.push({
            type: 'contract',
            id: contract.id,
            error: 'No contact methods available for renter'
          });
          continue;
        }

        const templateVariables = {
          // Sanitize all text variables for WhatsApp
          1: sanitizeForWhatsApp(contract.renter.name) || 'Renter',
          2: sanitizeForWhatsApp(contract.unit?.property?.name) || 'Property',
          3: sanitizeForWhatsApp(contract.unit?.number) || 'Unit',
          4: sanitizeForWhatsApp(formattedEndDate)
        };

        // Try to send WhatsApp message only if phone exists
        if (hasPhone) {
          try {
            await sendWhatsAppMessage(
              contract.renter.phone,
              templateVariables,
              true,
              'contract_expiration'
            );
            
            results.contractNotifications.push({
              id: contract.id,
              renterId: contract.renter.id,
              whatsapp: 'sent to ' + contract.renter.phone
            });
          } catch (whatsappError) {
            // Log WhatsApp error but continue with email
            console.error(`WhatsApp error for contract ${contract.id}:`, whatsappError.message);
            console.error('Error details:', JSON.stringify(whatsappError, null, 2));
            results.errors.push({
              type: 'contract_whatsapp',
              id: contract.id,
              renterId: contract.renter.id,
              error: whatsappError.message,
              variables: JSON.stringify(templateVariables)
            });
          }
        }

        // Try to send email only if email exists
        if (hasEmail) {
          try {
            const emailHtml = RentAgreementEmail({
              renterName: contract.renter.name || 'Renter',
              unitNumber: contract.unit?.number || 'Unit',
              propertyName: contract.unit?.property?.name || 'Property',
              startDate: formatDate(contract.startDate),
              endDate: formattedEndDate,
              totalPrice: contract.totalPrice,
              rentCollectionType: contract.rentCollectionType
            });

            await sendEmail(
              contract.renter.email,
              'تذكير بانتهاء العقد',
              emailHtml
            );
            
            results.contractNotifications.push({
              id: contract.id,
              renterId: contract.renter.id,
              email: 'sent to ' + contract.renter.email
            });
          } catch (emailError) {
            console.error(`Email error for contract ${contract.id}:`, emailError.message);
            results.errors.push({
              type: 'contract_email',
              id: contract.id,
              renterId: contract.renter.id,
              error: emailError.message
            });
          }
        }
      } catch (contractError) {
        console.error(`Error processing contract ${contract.id}:`, contractError);
        results.errors.push({
          type: 'contract_processing',
          id: contract.id,
          error: contractError.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      paymentCount: duePayments.length,
      contractCount: expiringContracts.length,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in notification endpoint:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

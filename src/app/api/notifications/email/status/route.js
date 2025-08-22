// file: /app/api/notifications/email/status/route.js

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

/**
 * Sends an email notification to the user when their maintenance request status changes.
 */
export async function POST(request) {
  try {
    // Parse request body
    const { email, requestId, newStatus, name } = await request.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    if (!newStatus) {
      return NextResponse.json(
        { error: "New status is required" },
        { status: 400 }
      );
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Construct email content
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `تحديث حالة طلب الصيانة #${requestId}`,
      html: `
        <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif;">
          <h2>تحديث حالة طلب الصيانة</h2>
          <p>${name ? `مرحباً ${name}،` : 'مرحباً،'}</p>
          <p>تم تحديث حالة طلب الصيانة الخاص بك:</p>
          <p><strong>رقم الطلب:</strong> ${requestId}</p>
          <p><strong>الحالة الجديدة:</strong> ${newStatus}</p>
          <p>إذا كان لديك أي استفسارات، فلا تتردد في التواصل معنا.</p>
          <p>شكراً لك،</p>
          <p>فريق الصيانة</p>
        </div>
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email notification sent:", info.messageId);

    return NextResponse.json({
      success: true,
      message: "Email notification sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error sending email notification:", error);

    return NextResponse.json(
      {
        error: "Failed to send email notification",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

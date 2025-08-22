// File: /api/notifications/email/contact_form/reply/route.js
import nodemailer from "nodemailer";

export async function POST(request) {
  const { name, email, phone, message } = await request.json();

  // Create a nodemailer transporter using Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Format the email content
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email, // Send to the contact form submitter's email
    subject: "رد على استفسارك", // Reply to your inquiry
    text: `
      مرحباً ${name}،

      شكراً لتواصلك معنا. فيما يلي ردنا على استفسارك:

      ${message}

      إذا كان لديك أي أسئلة إضافية، فلا تتردد في الرد على هذا البريد الإلكتروني أو الاتصال بنا على ${process.env.CONTACT_PHONE || "رقم هاتفنا"}.

      مع أطيب التحيات،
      فريق الدعم
    `,
    // You can also include HTML version
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>مرحباً ${name}،</p>
        
        <p>شكراً لتواصلك معنا. فيما يلي ردنا على استفسارك:</p>
        
        <div style="padding: 15px; background-color: #f5f5f5; border-right: 4px solid #007bff; margin: 15px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        
        <p>إذا كان لديك أي أسئلة إضافية، فلا تتردد في الرد على هذا البريد الإلكتروني أو الاتصال بنا على ${process.env.CONTACT_PHONE || "رقم هاتفنا"}.</p>
        
        <p>مع أطيب التحيات،<br>
        فريق الدعم</p>
      </div>
    `,
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    
    // Send a copy to admin if needed
   /** if (process.env.ADMIN_EMAIL) {
      const adminCopy = {
        ...mailOptions,
        to: process.env.ADMIN_EMAIL,
        subject: `نسخة: رد على استفسار ${name}`,
        text: `تم إرسال الرد التالي إلى ${name} (${email}):\n\n${mailOptions.text}`,
        html: `<p>تم إرسال الرد التالي إلى ${name} (${email}):</p>${mailOptions.html}`
      };
      await transporter.sendMail(adminCopy);
    } */
    
    return new Response(
      JSON.stringify({ message: "Email reply sent successfully" }), 
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email reply:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send email reply" }), 
      { status: 500 }
    );
  }
}

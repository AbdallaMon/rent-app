import nodemailer from "nodemailer";

export async function sendEmail(to, subject, html, text) {
  try {
    // Create the transporter with your Gmail credentials
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Make sure html and text are actually strings, not Promises
    const resolvedHtml = html instanceof Promise ? await html : html;
    const resolvedText = text instanceof Promise ? await text : text;

    // Set up mail options with resolved content
    let mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: to,
      subject: subject,
      text: resolvedText,
      html: resolvedHtml,
    };

    // Send the email
    let info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

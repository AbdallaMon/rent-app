// File: /api/notifications/whatsapp/contact_form/route.js
import axios from "axios";

export async function POST(request) {
  const { name, email, phone, message,language } = await request.json();

  try {
    await axios.post(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: process.env.WHATSAPP_RECIPIENT_NUMBER,
        type: "template",
        template: {
          name: "contact_form_submission", // Name of your WhatsApp template
          language: {
            code: "ar_AE", // Language code (e.g., "en" for English)
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: name || "N/A", // Ensure a fallback value if name is empty
                },
                {
                  type: "text",
                  text: email || "N/A", // Ensure a fallback value if email is empty
                },
                {
                  type: "text",
                  text: phone || "N/A", // Ensure a fallback value if phone is empty
                },
                {
                  type: "text",
                  text: message || "N/A", // Ensure a fallback value if message is empty
                },
                {
                  type: "text",
                  text: language || "N/A", // Ensure a fallback value if language is empty
                },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_BUSINESS_API_TOKEN}`,
        },
      }
    );
    return new Response(JSON.stringify({ message: "WhatsApp message sent successfully" }), { status: 200 });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error.response?.data || error.message);
    return new Response(JSON.stringify({ error: "Failed to send WhatsApp message" }), { status: 500 });
  }
}

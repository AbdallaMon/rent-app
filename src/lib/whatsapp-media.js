// Example function to send image messages via WhatsApp
import { formatPhoneNumber } from '@/lib/whatsapp';

/**
 * Sends an image message via WhatsApp Business API
 * @param {string} to - Recipient phone number
 * @param {string} imageUrl - Public URL of the image to send
 * @param {string} caption - Optional caption text
 * @returns {Promise<Object>} - WhatsApp API response
 */
export const sendWhatsAppImageMessage = async (to, imageUrl, caption = '') => {
  try {
    // Format phone number to E.164
    const formattedTo = formatPhoneNumber(to);
    
    // Get WhatsApp Business Phone Number ID from env
    const whatsappBusinessPhoneNumberId = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID;
    
    if (!whatsappBusinessPhoneNumberId) {
      throw new Error('WhatsApp Business Phone Number ID is required');
    }
    
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${whatsappBusinessPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_BUSINESS_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedTo,
          type: 'image',
          image: {
            link: imageUrl,
            caption: caption
          }
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp API Error: ${JSON.stringify(error)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending WhatsApp image message:', error);
    throw error;
  }
};

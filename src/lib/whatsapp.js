// File: /src/lib/whatsapp.js

import { getClientLanguageSettings } from '@/services/server/notifications/languageUtils';
import { trackMessageSent, trackIncomingMessage } from '@/lib/whatsapp-analytics';
import axios from 'axios';


const whatsappBusinessApiToken = process.env.WHATSAPP_BUSINESS_API_TOKEN;

// Add validation for required credentials
if (!whatsappBusinessApiToken) {
  console.error('WhatsApp Business API credentials are missing!');
  console.debug('Make sure to set WHATSAPP_BUSINESS_API_TOKEN in your environment variables.');
}

const client = axios.create({
  baseURL: 'https://graph.facebook.com/v22.0',
  headers: {
    'Authorization': `Bearer ${whatsappBusinessApiToken}`,
    'Content-Type': 'application/json'
  }
});

console.info('WhatsApp Business API client initialization status:', client ? 'SUCCESS' : 'FAILED');

/**
 * Checks if a phone number might be valid for UAE or India.
 * @param {string} cleaned - The cleaned phone number (digits only).
 * @returns {Object} - Object containing validity and reason if invalid.
 */
const preValidateNumber = (cleaned) => {
  // UAE mobile numbers start with 5 and are 9 digits (excluding country code)
  // India mobile numbers start with 6,7,8,9 and are 10 digits (excluding country code)
  // Saudi Arabia mobile numbers start with 5 and are 9 digits (excluding country code)
  
  // Check basic length requirements
  if (cleaned.length < 7) {
    return { valid: false, reason: 'Number too short' };
  }
  
  // Check for international format with UAE, India, or Saudi Arabia country code
  if (cleaned.startsWith('971')) {
    const remainingDigits = cleaned.substring(3);
    
    // For numbers with country code, check first digit
    const firstDigit = remainingDigits.charAt(0);
    
    // If it's a UAE mobile number (starts with 5)
    if (firstDigit === '5') {
      if (remainingDigits.length !== 9) {
        return { 
          valid: false, 
          reason: `Invalid UAE mobile number length (got ${remainingDigits.length} digits after country code, expected 9)` 
        };
      }
    } 
    // If it's a UAE landline
    else if (['2', '3', '4', '6', '7', '9'].includes(firstDigit)) {
      if (remainingDigits.length < 7 || remainingDigits.length > 8) {
        return { 
          valid: false, 
          reason: `Invalid UAE landline number length (got ${remainingDigits.length} digits after country code, expected 7-8)` 
        };
      }
    } 
    // Invalid first digit
    else {
      return { 
        valid: false, 
        reason: `Invalid UAE number prefix: ${firstDigit} (must start with 2, 3, 4, 5, 6, 7, or 9 after country code)` 
      };
    }  } else if (cleaned.startsWith('91')) {
    const remainingDigits = cleaned.substring(2);
    
    // India mobile numbers start with 6,7,8,9 and are 10 digits long
    if (['6', '7', '8', '9'].includes(remainingDigits.charAt(0))) {
      if (remainingDigits.length !== 10) {
        return { 
          valid: false, 
          reason: `Invalid India mobile number length (got ${remainingDigits.length} digits after country code, expected 10)` 
        };
      }
    } else {
      return { 
        valid: false, 
        reason: `Invalid India number prefix: ${remainingDigits.charAt(0)} (must start with 6, 7, 8, or 9 after country code)` 
      };
    }
  } else if (cleaned.startsWith('966')) {
    const remainingDigits = cleaned.substring(3);
    
    // Saudi Arabia mobile numbers start with 5 and are 9 digits long
    if (remainingDigits.charAt(0) === '5') {
      if (remainingDigits.length !== 9) {
        return { 
          valid: false, 
          reason: `Invalid Saudi mobile number length (got ${remainingDigits.length} digits after country code, expected 9)` 
        };
      }
    } else {
      return { 
        valid: false, 
        reason: `Invalid Saudi number prefix: ${remainingDigits.charAt(0)} (must start with 5 after country code)` 
      };
    }
  }
  
  return { valid: true };
};

/**
 * Formats a phone number to E.164 format with enhanced validation for UAE and India.
 * @param {string} phoneNumber - The phone number to format.
 * @returns {string} - The formatted phone number in E.164 format.
 * @throws {Error} - If the phone number is invalid.
 */
export const formatPhoneNumber = (phoneNumber) => {
    console.debug('Formatting phone number:', phoneNumber);
    
    // Check if phone number is valid
    if (!phoneNumber) {
        console.error('Phone number is missing');
        throw new Error('Phone number is required');
    }
    
    // Remove any non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    console.debug('Cleaned phone number:', cleaned);
    
    // If the number starts with '0091' (international format with 00)
    if (cleaned.startsWith('0091')) {
        console.debug('Converting 0091 format to +91 format');
        return `+${cleaned.slice(2)}`;  // Convert 0091 to +91
    }
      // If the number starts with '+91', '+971', or '+966', return it as is
    if (cleaned.startsWith('91') || cleaned.startsWith('971') || cleaned.startsWith('966')) {
        return `+${cleaned}`;
    }
    
    // Indian mobile format (starting with 6, 7, 8, or 9 and exactly 10 digits)
    if (cleaned.length === 10 && ['6', '7', '8', '9'].includes(cleaned.charAt(0))) {
        console.debug('Converting 10-digit Indian mobile number to +91 format');
        return `+91${cleaned}`;
    }
    
    // UAE mobile format (starting with 5 and exactly 9 digits)
    if (cleaned.length === 9 && cleaned.charAt(0) === '5') {
        console.debug('Converting 9-digit UAE mobile number to +971 format');
        return `+971${cleaned}`;
    }
    
    // If the number starts with '0' (local format)
    if (cleaned.startsWith('0')) {
        // For UAE, numbers typically start with 0 followed by 5 for mobiles
        if (cleaned.charAt(1) === '5' && cleaned.length === 10) {
            console.debug('Converting UAE local 0 format to international format');
            return `+971${cleaned.slice(1)}`;
        }
        
        // For India, local numbers start with 0 followed by mobile prefix
        if (['6', '7', '8', '9'].includes(cleaned.charAt(1)) && cleaned.length === 11) {
            console.debug('Converting Indian local 0 format to international format');
            return `+91${cleaned.slice(1)}`;
        }
    }
    
    // If we couldn't identify a specific format but the number is long enough,
    // assume it's already in an international format without the +
    if (cleaned.length >= 11) {
        console.debug('Assuming international format, adding + prefix');
        return `+${cleaned}`;
    }
    
    // If the number doesn't match any known format, throw an error
    console.error('Phone number does not match any known format:', phoneNumber);
    throw new Error(`Invalid phone number format: ${phoneNumber}`);
};

/**
 * Validates if a number is a valid WhatsApp number with enhanced checks
 * @param {string} formattedNumber - The E.164 formatted phone number
 * @returns {Object} - Object with validity and reason if invalid
 */
const isValidWhatsAppNumber = (formattedNumber) => {
   console.debug('Validating WhatsApp number:', formattedNumber);
   
   // Remove any non-numeric characters and the plus sign
   const numericOnly = formattedNumber.replace(/[^\d]/g, '');
   console.debug('Numeric-only format:', numericOnly);
   
   // Check if it starts with UAE or India country code (971 or 91)
   if (!numericOnly.startsWith('971') && !numericOnly.startsWith('91')) {
       return { 
           valid: false, 
           reason: `Number does not start with UAE, India, or Saudi Arabia country code (971, 91, or 966): ${numericOnly}` 
       };
   }
   
   // Extract the part after the country code
   const countryCodeLength = numericOnly.startsWith('971') ? 3 : 2; // UAE: 971 (3 digits), India: 91 (2 digits)
   const nationalNumber = numericOnly.substring(countryCodeLength);
   console.debug('National number (after country code):', nationalNumber);
   
   // Check for UAE or India mobile patterns
   if (numericOnly.startsWith('971')) {
       // UAE mobile numbers start with 5 after the country code
       if (nationalNumber.charAt(0) !== '5') {
           return { 
               valid: false, 
               reason: `Not a UAE mobile number (does not start with 5 after country code): ${nationalNumber}` 
           };
       }
       
       // UAE mobile numbers are 9 digits after country code
       if (nationalNumber.length !== 9) {
           return { 
               valid: false, 
               reason: `Invalid UAE mobile number length: ${nationalNumber.length} digits (expected 9)` 
           };
       }
   } else if (numericOnly.startsWith('91')) {
       // India mobile numbers start with 6,7,8,9 after the country code
       if (!['6', '7', '8', '9'].includes(nationalNumber.charAt(0))) {
           return { 
               valid: false, 
               reason: `Not an India mobile number (does not start with 6, 7, 8, or 9 after country code): ${nationalNumber}` 
           };
       }
       
       // India mobile numbers are 10 digits after country code
       if (nationalNumber.length !== 10) {
           return { 
               valid: false, 
               reason: `Invalid India mobile number length: ${nationalNumber.length} digits (expected 10)` 
           };
       }
   }
   
   console.debug('WhatsApp number validation successful');
   return { valid: true };
};

/**
 * Sends a message via WhatsApp Business API using the Meta Graph API.
 * Enhanced with better error handling, logging, and phone number validation.
 * @param {string} to - The recipient's phone number. Will be automatically formatted.
 * @param {string|object} body - The message body or template variables (if useTemplate is true).
 * @param {boolean} useTemplate - Whether to use a template message (for outside 24-hour window).
 * @param {string} templateName - The name of the template to use (required if useTemplate is true).
 * @param {Object} options - Additional options for the WhatsApp message.
 * @returns {Promise<Object>} - The WhatsApp Business API response.
 */
export const sendWhatsAppMessage = async (
    to, 
    body, 
    useTemplate = false, 
    templateName = '', 
    options = {}
) => {
    console.log('Starting WhatsApp message send process...');
    console.debug('Message parameters:', { to, useTemplate, templateName, hasOptions: !!Object.keys(options).length });
    
    try {
        if (!client) {
            console.error('WhatsApp Business API client not initialized - missing credentials');
            throw new Error('WhatsApp Business API client not initialized due to missing credentials');
        }
        
        if (!to) {
            console.error('Missing recipient phone number');
            throw new Error('Recipient phone number is required');
        }
        
        if (!body) {
            console.error('Missing message body');
            throw new Error('Message body is required');
        }
        
        // Format the 'to' phone number to E.164 format
        console.log('Formatting recipient phone number...');
        const formattedTo = formatPhoneNumber(to);
        console.debug('Formatted phone number:', formattedTo);
        
        // Additional validation for WhatsApp-enabled numbers
        console.log('Validating WhatsApp compatibility...');
        const whatsappValidation = isValidWhatsAppNumber(formattedTo);
        
        if (!whatsappValidation.valid) {
            console.error(`WhatsApp validation failed: ${whatsappValidation.reason}`);
            throw new Error(`Invalid WhatsApp number: ${whatsappValidation.reason}`);
        }
        
        // Prepare message options
        console.log('Preparing message options...');
        const messageOptions = {
            messaging_product: 'whatsapp',
            to: formattedTo,
            type: 'text',
            ...options  // Allow additional options (e.g., mediaUrl)
        };
        
        // Handle template messages for outside 24-hour window
        if (useTemplate && templateName) {
            console.log(`Using template message: ${templateName}`);
            messageOptions.type = 'template';
            messageOptions.template = {
                name: templateName,
                language: {
                    code: options.language?.code || 'ar_AE' // Default to UAE Arabic if not specified
                }
            };
            
            // For templates, the body parameter contains the template variables
            if (typeof body === 'object') {
                console.debug('Template variables:', JSON.stringify(body));
                messageOptions.template.components = [
                    {
                        type: 'body',
                        parameters: Object.entries(body).map(([key, value]) => ({
                            type: 'text',
                            text: value.toString() // Ensure value is a string
                        }))
                    }
                ];
            } else {
                console.warn('Template variables should be an object, got string instead');
                messageOptions.template.components = [
                    {
                        type: 'body',
                        parameters: [
                            {
                                type: 'text',
                                text: body
                            }
                        ]
                    }
                ];
            }
        } else {
            // Regular message within 24-hour window
            console.log('Using standard message within 24-hour window');
            messageOptions.text = {
                body: body
            };
        }
        
        // Log complete message options (without sensitive info)
        const logSafeOptions = { ...messageOptions };
        delete logSafeOptions.mediaUrl; // Don't log URLs that might contain tokens
        console.debug('Final message options:', logSafeOptions);
          // Send the message and await the result
        const whatsappBusinessPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        if (!whatsappBusinessPhoneNumberId) {
            console.error('WhatsApp Business phone number ID is missing');
            throw new Error('WhatsApp Business phone number ID is required');
        }
        console.log('Sending WhatsApp message via WhatsApp Business API...');
        const startTime = Date.now();
        const response = await client.post(`/${whatsappBusinessPhoneNumberId}/messages`, messageOptions);
        const endTime = Date.now();
        
        console.log(`WhatsApp message sent successfully in ${endTime - startTime}ms`);
        console.log('Message ID:', response.data.messages[0].id);        console.debug('Message details:', {
            id: response.data.messages[0].id,
            status: response.status,
            timestamp: new Date().toISOString()
        });
        
        // Track message in analytics system
        try {
            await trackMessageSent({
                messageId: response.data.messages[0].id,
                to: formattedTo,
                type: messageOptions.type,
                templateName: useTemplate ? templateName : null,
                language: options.language?.code || 'ar_AE',
                status: 'sent',
                metadata: {
                    ...(options.metadata || {}),
                    useTemplate,
                    responseStatus: response.status
                }
            });
        } catch (analyticsError) {
            // Non-blocking - just log the error
            console.error('Error tracking WhatsApp message in analytics:', analyticsError);
        }
        
        return response.data;
    } catch (error) {
        // Enhanced error handling with more specific logging
        
        // Check for network issues
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.error('Network error while connecting to WhatsApp Business API:', error.message);
            throw new Error(`Network error: ${error.message}`);
        }
        
        // Check for authentication issues
        if (error.response && error.response.status === 401) {
            console.error('Authentication error with WhatsApp Business API - check your credentials');
            throw new Error('WhatsApp Business API authentication failed - invalid credentials');
        }
        
        // Check for specific WhatsApp Business API errors related to messaging window
        if (error.response && error.response.data && error.response.data.error && error.response.data.error.code === 131031) {
            console.error('Error: Message failed - outside 24-hour messaging window.');
            throw new Error('WhatsApp messaging window expired. Use a template message for this recipient.');
        }
        
        // Check for WhatsApp template errors
        if (error.response && error.response.data && error.response.data.error && error.response.data.error.code === 132000) {
            console.error('Template error:', error.response.data.error.message);
            throw new Error(`WhatsApp template error: ${error.response.data.error.message}`);
        }
        
        // Check for rate limiting
        if (error.response && error.response.status === 429) {
            console.error('Rate limit exceeded with WhatsApp Business API');
            throw new Error('WhatsApp Business API rate limit exceeded - try again later');
        }
        
        // General error logging
        console.error('Error sending WhatsApp message:', error);
        console.debug('Error details:', {
            code: error.code,
            status: error.response ? error.response.status : undefined,
            moreInfo: error.response ? error.response.data : undefined,
            details: error.response ? error.response.data.error : undefined
        });
        
        throw error;
    }
};


/**
 * Sends a localized WhatsApp message using client's language preference
 * @param {string} to - The recipient's phone number
 * @param {string|object} body - The message body or template variables
 * @param {string} clientLanguage - The client's language preference (ARABIC or ENGLISH)
 * @param {string} baseTemplateName - The base name of the template without language suffix
 * @param {boolean} useTemplate - Whether to use a template message
 * @param {Object} options - Additional options for the message
 * @returns {Promise<Object>} - The WhatsApp Business API response
 */
export const sendLocalizedWhatsAppMessage = async (
    to, 
    body, 
    clientLanguage, 
    baseTemplateName, 
    useTemplate = true, 
    options = {}
) => {
    // Determine template name based on language - add _en suffix for English
    let actualTemplateName = baseTemplateName;
    if (clientLanguage === "ENGLISH") {
        actualTemplateName = `${baseTemplateName}_en`;
    }
    
    // Get language settings based on client preference
    const { languageCode } = getClientLanguageSettings(clientLanguage, baseTemplateName);
    
    // Add language code to options
    const messageOptions = {
        ...options,
        language: { code: languageCode }
    };
    
    console.log(`Using localized template: ${actualTemplateName} with language code: ${languageCode}`);
    
    // Send the message with language settings
    return sendWhatsAppMessage(to, body, useTemplate, actualTemplateName, messageOptions);
};

/**
 * Sends an interactive WhatsApp message with validation for WhatsApp Business API limits.
 * @param {string} to - The recipient's phone number.
 * @param {Object} interactiveContent - The interactive message content.
 * @returns {Promise<Object>} - The WhatsApp Business API response.
 */
export const sendInteractiveWhatsAppMessage = async (to, interactiveContent) => {
    try {
        if (!client) {
            throw new Error('WhatsApp Business API client not initialized');
        }
        
        if (!to) {
            throw new Error('Recipient phone number is required');
        }
        
        if (!interactiveContent) {
            throw new Error('Interactive content is required');
        }
          // Format the 'to' phone number to E.164 format
        const formattedTo = formatPhoneNumber(to);
        console.log('Formatted recipient for interactive message:', formattedTo);
        
        // Validate WhatsApp number
        const whatsappValidation = isValidWhatsAppNumber(formattedTo);
        if (!whatsappValidation.valid) {
            throw new Error(`Invalid WhatsApp number: ${whatsappValidation.reason}`);
        }
        
        // Prepare message options for interactive message
        const messageOptions = {
            messaging_product: 'whatsapp',
            to: formattedTo,
            type: 'interactive',
            interactive: interactiveContent
        };
        
        // Log the interactive content for debugging
        console.log('Interactive content to send:', JSON.stringify(interactiveContent, null, 2));
        console.log('Complete message options:', JSON.stringify(messageOptions, null, 2));
          // Send the message and await the result
        const whatsappBusinessPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        if (!whatsappBusinessPhoneNumberId) {
            throw new Error('WhatsApp Business phone number ID is required');
        }
          console.log('Sending interactive WhatsApp message...');
        console.log('Using phone number ID:', whatsappBusinessPhoneNumberId);
        
        const response = await client.post(`/${whatsappBusinessPhoneNumberId}/messages`, messageOptions);
        console.log('Interactive message sent successfully');
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        
        return response.data;
    } catch (error) {
        console.error('Error sending interactive WhatsApp message:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
            console.error('Response headers:', error.response.headers);
        }
        throw error;
    }
};

// File: /src/lib/whatsapp.js

import { getClientLanguageSettings } from "@/services/server/notifications/languageUtils";
import {
  trackMessageSent,
  trackIncomingMessage,
} from "@/lib/whatsapp-analytics";
import axios from "axios";
import {
  cleanDigits,
  formatToE164,
  isAllowedMsisdn,
  isValidE164Digits,
} from "./phone";

const whatsappBusinessApiToken = process.env.WHATSAPP_BUSINESS_API_TOKEN;

// Add validation for required credentials
if (!whatsappBusinessApiToken) {
  console.error("WhatsApp Business API credentials are missing!");
  console.debug(
    "Make sure to set WHATSAPP_BUSINESS_API_TOKEN in your environment variables."
  );
}

const client = axios.create({
  baseURL: "https://graph.facebook.com/v22.0",
  headers: {
    Authorization: `Bearer ${whatsappBusinessApiToken}`,
    "Content-Type": "application/json",
  },
});

console.info(
  "WhatsApp Business API client initialization status:",
  client ? "SUCCESS" : "FAILED"
);

export const formatPhoneNumber = (phoneNumber) => {
  const e164 = formatToE164(phoneNumber); // يرمي Error لو طول غير صالح
  // تحقق إضافي: يكون رقم (بدون +) يبدأ بكود دولة مسموح
  const digits = cleanDigits(e164);
  if (!isAllowedMsisdn(digits)) {
    throw new Error(
      `Number country code not allowed. Allowed: [${ALLOWED_CC.join(", ")}]`
    );
  }
  return e164;
};

const isValidWhatsAppNumber = (formatted) => {
  const numeric = formatted.replace(/[^\d]/g, "");
  if (!isValidE164Digits(numeric)) {
    return { valid: false, reason: `Invalid length: ${numeric.length}` };
  }
  if (!isAllowedMsisdn(numeric)) {
    return {
      valid: false,
      reason: `Country code not allowed. Allowed: [${ALLOWED_CC.join(", ")}]: ${numeric}`,
    };
  }
  // أي تحققات إضافية خاصة بدولة ممكن تضيفها هنا لو حابب
  return { valid: true };
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
  const { languageCode } = getClientLanguageSettings(
    clientLanguage,
    baseTemplateName
  );

  // Add language code to options
  const messageOptions = {
    ...options,
    language: { code: languageCode },
  };

  console.log(
    `Using localized template: ${actualTemplateName} with language code: ${languageCode}`
  );

  // Send the message with language settings
  return sendWhatsAppMessage(
    to,
    body,
    useTemplate,
    actualTemplateName,
    messageOptions
  );
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
  templateName = "",
  options = {}
) => {
  console.log("Starting WhatsApp message send process...");
  console.debug("Message parameters:", {
    to,
    useTemplate,
    templateName,
    hasOptions: !!Object.keys(options).length,
  });

  try {
    if (!client) {
      console.error(
        "WhatsApp Business API client not initialized - missing credentials"
      );
      throw new Error(
        "WhatsApp Business API client not initialized due to missing credentials"
      );
    }

    if (!to) {
      console.error("Missing recipient phone number");
      throw new Error("Recipient phone number is required");
    }

    if (!body) {
      console.error("Missing message body");
      throw new Error("Message body is required");
    }

    // Format the 'to' phone number to E.164 format
    console.log("Formatting recipient phone number...");
    const formattedTo = formatPhoneNumber(to);
    console.debug("Formatted phone number:", formattedTo);

    // Additional validation for WhatsApp-enabled numbers
    console.log("Validating WhatsApp compatibility...");
    const whatsappValidation = isValidWhatsAppNumber(formattedTo);

    if (!whatsappValidation.valid) {
      console.error(`WhatsApp validation failed: ${whatsappValidation.reason}`);
      throw new Error(`Invalid WhatsApp number: ${whatsappValidation.reason}`);
    }

    // Prepare message options
    console.log("Preparing message options...");
    const messageOptions = {
      messaging_product: "whatsapp",
      to: formattedTo,
      type: "text",
      ...options, // Allow additional options (e.g., mediaUrl)
    };

    // Handle template messages for outside 24-hour window
    if (useTemplate && templateName) {
      console.log(`Using template message: ${templateName}`);
      messageOptions.type = "template";
      messageOptions.template = {
        name: templateName,
        language: {
          code: options.language?.code || "ar_AE", // Default to UAE Arabic if not specified
        },
      };

      // For templates, the body parameter contains the template variables
      if (typeof body === "object") {
        console.debug("Template variables:", JSON.stringify(body));
        messageOptions.template.components = [
          {
            type: "body",
            parameters: Object.entries(body).map(([key, value]) => ({
              type: "text",
              text: value.toString(), // Ensure value is a string
            })),
          },
        ];
      } else {
        console.warn(
          "Template variables should be an object, got string instead"
        );
        messageOptions.template.components = [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: body,
              },
            ],
          },
        ];
      }
    } else {
      // Regular message within 24-hour window
      console.log("Using standard message within 24-hour window");
      messageOptions.text = {
        body: body,
      };
    }

    // Log complete message options (without sensitive info)
    const logSafeOptions = { ...messageOptions };
    delete logSafeOptions.mediaUrl; // Don't log URLs that might contain tokens
    console.debug("Final message options:", logSafeOptions);
    // Send the message and await the result
    const whatsappBusinessPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!whatsappBusinessPhoneNumberId) {
      console.error("WhatsApp Business phone number ID is missing");
      throw new Error("WhatsApp Business phone number ID is required");
    }
    console.log("Sending WhatsApp message via WhatsApp Business API...");
    const startTime = Date.now();
    const response = await client.post(
      `/${whatsappBusinessPhoneNumberId}/messages`,
      messageOptions
    );
    const endTime = Date.now();

    console.log(
      `WhatsApp message sent successfully in ${endTime - startTime}ms`
    );
    console.log("Message ID:", response.data.messages[0].id);
    console.debug("Message details:", {
      id: response.data.messages[0].id,
      status: response.status,
      timestamp: new Date().toISOString(),
    });

    // Track message in analytics system
    try {
      await trackMessageSent({
        messageId: response.data.messages[0].id,
        to: formattedTo,
        type: messageOptions.type,
        templateName: useTemplate ? templateName : null,
        language: options.language?.code || "ar_AE",
        status: "sent",
        metadata: {
          ...(options.metadata || {}),
          useTemplate,
          responseStatus: response.status,
        },
      });
    } catch (analyticsError) {
      // Non-blocking - just log the error
      console.error(
        "Error tracking WhatsApp message in analytics:",
        analyticsError
      );
    }

    return response.data;
  } catch (error) {
    // Enhanced error handling with more specific logging

    // Check for network issues
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      console.error(
        "Network error while connecting to WhatsApp Business API:",
        error.message
      );
      throw new Error(`Network error: ${error.message}`);
    }

    // Check for authentication issues
    if (error.response && error.response.status === 401) {
      console.error(
        "Authentication error with WhatsApp Business API - check your credentials"
      );
      throw new Error(
        "WhatsApp Business API authentication failed - invalid credentials"
      );
    }

    // Check for specific WhatsApp Business API errors related to messaging window
    if (
      error.response &&
      error.response.data &&
      error.response.data.error &&
      error.response.data.error.code === 131031
    ) {
      console.error(
        "Error: Message failed - outside 24-hour messaging window."
      );
      throw new Error(
        "WhatsApp messaging window expired. Use a template message for this recipient."
      );
    }

    // Check for WhatsApp template errors
    if (
      error.response &&
      error.response.data &&
      error.response.data.error &&
      error.response.data.error.code === 132000
    ) {
      console.error("Template error:", error.response.data.error.message);
      throw new Error(
        `WhatsApp template error: ${error.response.data.error.message}`
      );
    }

    // Check for rate limiting
    if (error.response && error.response.status === 429) {
      console.error("Rate limit exceeded with WhatsApp Business API");
      throw new Error(
        "WhatsApp Business API rate limit exceeded - try again later"
      );
    }

    // General error logging
    console.error("Error sending WhatsApp message:", error);
    console.debug("Error details:", {
      code: error.code,
      status: error.response ? error.response.status : undefined,
      moreInfo: error.response ? error.response.data : undefined,
      details: error.response ? error.response.data.error : undefined,
    });

    throw error;
  }
};

/**
 * Sends an interactive WhatsApp message with validation for WhatsApp Business API limits.
 * @param {string} to - The recipient's phone number.
 * @param {Object} interactiveContent - The interactive message content.
 * @returns {Promise<Object>} - The WhatsApp Business API response.
 */
export const sendInteractiveWhatsAppMessage = async (
  to,
  interactiveContent
) => {
  try {
    if (!client) {
      throw new Error("WhatsApp Business API client not initialized");
    }

    if (!to) {
      throw new Error("Recipient phone number is required");
    }

    if (!interactiveContent) {
      throw new Error("Interactive content is required");
    }
    // Format the 'to' phone number to E.164 format
    const formattedTo = formatPhoneNumber(to);
    console.log("Formatted recipient for interactive message:", formattedTo);

    // Validate WhatsApp number
    const whatsappValidation = isValidWhatsAppNumber(formattedTo);
    if (!whatsappValidation.valid) {
      throw new Error(`Invalid WhatsApp number: ${whatsappValidation.reason}`);
    }

    // Prepare message options for interactive message
    const messageOptions = {
      messaging_product: "whatsapp",
      to: formattedTo,
      type: "interactive",
      interactive: interactiveContent,
    };

    // Log the interactive content for debugging
    console.log(
      "Interactive content to send:",
      JSON.stringify(interactiveContent, null, 2)
    );
    console.log(
      "Complete message options:",
      JSON.stringify(messageOptions, null, 2)
    );
    // Send the message and await the result
    const whatsappBusinessPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!whatsappBusinessPhoneNumberId) {
      throw new Error("WhatsApp Business phone number ID is required");
    }
    console.log("Sending interactive WhatsApp message...");
    console.log("Using phone number ID:", whatsappBusinessPhoneNumberId);

    const response = await client.post(
      `/${whatsappBusinessPhoneNumberId}/messages`,
      messageOptions
    );
    console.log("Interactive message sent successfully");
    console.log("Response data:", JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error("Error sending interactive WhatsApp message:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error(
        "Response data:",
        JSON.stringify(error.response.data, null, 2)
      );
      console.error("Response headers:", error.response.headers);
    }
    throw error;
  }
};

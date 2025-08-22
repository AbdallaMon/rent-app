/**
 * Enhanced language utilities with better logging and error handling
 */

/**
 * Gets the appropriate language code and template name based on client language preference
 * @param {string} language - The language preference from the client record (ARABIC or ENGLISH)
 * @param {string} baseTemplateName - The base name of the template without language suffix
 * @returns {Object} Object containing languageCode, templateName, and direction
 */
export function getClientLanguageSettings(language, baseTemplateName) {
  // Default to Arabic if language is not specified
  const clientLanguage = (language || "ARABIC").toUpperCase();
  
  console.log(`Language utility: Processing language settings for ${clientLanguage}`);
  
  // Determine language code for WhatsApp API
  const languageCode = clientLanguage === "ARABIC" ? "ar_AE" : "en"; // WhatsApp API language codes
  
  // Create template name based on language (add _en suffix for English)
  let templateName = baseTemplateName;
  if (clientLanguage === "ENGLISH" && baseTemplateName) {
    templateName = `${baseTemplateName}_en`;
  }
  
  // Get text direction for UI purposes
  const direction = clientLanguage === "ARABIC" ? "rtl" : "ltr";
  
  const result = {
    languageCode,
    templateName,
    direction,
    isArabic: clientLanguage === "ARABIC"
  };
  
  console.log(`Language utility: Resolved settings:`, result);
  return result;
}

/**
 * Retrieves client's language preference from the Client table
 * @param {Object} prisma - PrismaClient instance
 * @param {number} clientId - The client ID
 * @returns {Promise<string>} The client's language preference
 */
export async function getClientLanguagePreference(prisma, clientId) {
  console.log(`Language utility: Fetching language preference for client ID: ${clientId}`);
  
  if (!clientId) {
    console.warn("Language utility: No client ID provided, defaulting to ARABIC");
    return "ARABIC";
  }
  
  try {
    const client = await prisma.client.findUnique({
      where: { id: Number(clientId) },
      select: { language: true }
    });
    
    if (!client) {
      console.warn(`Language utility: Client with ID ${clientId} not found, defaulting to ARABIC`);
      return "ARABIC";
    }
    
    console.log(`Language utility: Found client language preference: ${client.language}`);
    return client.language;
  } catch (error) {
    console.error("Language utility: Error fetching client language preference:", error);
    return "ARABIC"; // Default to Arabic on error
  }
}

/**
 * Retrieves language preference from the ContactForm table
 * @param {Object} prisma - PrismaClient instance
 * @param {number} contactFormId - The contact form ID
 * @returns {Promise<string>} The contact form's language preference
 */
export async function getContactFormLanguage(prisma, contactFormId) {
  console.log(`Language utility: Fetching language for contact form ID: ${contactFormId}`);
  
  if (!contactFormId) {
    console.warn("Language utility: No contact form ID provided, defaulting to ARABIC");
    return "ARABIC";
  }
  
  try {
    const contactForm = await prisma.contactForm.findUnique({
      where: { id: Number(contactFormId) },
      select: { language: true }
    });
    
    if (!contactForm) {
      console.warn(`Language utility: Contact form with ID ${contactFormId} not found, defaulting to ARABIC`);
      return "ARABIC";
    }
    
    console.log(`Language utility: Found contact form language: ${contactForm.language}`);
    return contactForm.language;
  } catch (error) {
    console.error("Language utility: Error fetching contact form language:", error);
    return "ARABIC"; // Default to Arabic on error
  }
}

/**
 * Gets a localized message based on language preference
 * @param {string} language - The language preference (ARABIC or ENGLISH)
 * @param {Object} messages - Object containing message keys with Arabic and English versions
 * @returns {Object} Object containing the appropriate messages for the language
 */
export function getLocalizedMessages(language, messages) {
  const clientLanguage = (language || "ARABIC").toUpperCase();
  console.log(`Language utility: Localizing messages for language: ${clientLanguage}`);
  
  // Create a result object with localized messages
  const result = {};
  
  // For each message key, select the appropriate language version
  Object.keys(messages).forEach(key => {
    if (messages[key] && typeof messages[key] === 'object') {
      if (clientLanguage === "ARABIC" && messages[key].ar) {
        result[key] = messages[key].ar;
      } else if (clientLanguage === "ENGLISH" && messages[key].en) {
        result[key] = messages[key].en;
      } else {
        // Fallback to available language if preferred is not available
        result[key] = messages[key].ar || messages[key].en || messages[key];
        console.log(`Language utility: Using fallback for message key "${key}"`);
      }
    } else {
      // If the message doesn't have language variants, use it as is
      result[key] = messages[key];
      console.log(`Language utility: Message key "${key}" doesn't have language variants`);
    }
  });
  
  return result;
}

/**
 * Detects probable language based on message content
 * @param {string} text - The message text to analyze
 * @returns {string} The detected language (ARABIC or ENGLISH)
 */
export function detectMessageLanguage(text) {
  if (!text) {
    console.log("Language utility: No text provided for language detection, defaulting to ARABIC");
    return "ARABIC"; 
  }
  
  // Count Arabic and English characters
  const arabicPattern = /[\u0600-\u06FF]/g;
  const englishPattern = /[a-zA-Z]/g;
  
  const arabicMatches = text.match(arabicPattern) || [];
  const englishMatches = text.match(englishPattern) || [];
  
  const detectedLanguage = arabicMatches.length >= englishMatches.length ? "ARABIC" : "ENGLISH";
  console.log(`Language utility: Detected language from text: ${detectedLanguage} (Arabic chars: ${arabicMatches.length}, English chars: ${englishMatches.length})`);
  
  return detectedLanguage;
}

/**
 * Get appropriate response language based on client settings and message content
 * @param {string} clientLanguage - The client's stored language preference
 * @param {string} messageText - The text of the incoming message
 * @returns {string} The language to use for the response
 */
export function getResponseLanguage(clientLanguage, messageText) {
  // If client has a stored preference, use that
  if (clientLanguage && (clientLanguage === "ARABIC" || clientLanguage === "ENGLISH")) {
    console.log(`Language utility: Using stored client language preference: ${clientLanguage}`);
    return clientLanguage;
  }
  
  // Otherwise detect from message content
  const detectedLanguage = detectMessageLanguage(messageText);
  console.log(`Language utility: No stored preference, detected language from message: ${detectedLanguage}`);
  return detectedLanguage;
}

/**
 * Validate and normalize language value
 * @param {string} language - The language value to validate
 * @returns {string} Normalized language value (ARABIC or ENGLISH)
 */
export function validateLanguage(language) {
  if (!language) {
    console.log("Language utility: No language provided, defaulting to ARABIC");
    return "ARABIC";
  }
  
  const normalizedLanguage = language.toUpperCase();
  if (normalizedLanguage !== "ARABIC" && normalizedLanguage !== "ENGLISH") {
    console.warn(`Language utility: Invalid language value "${language}", defaulting to ARABIC`);
    return "ARABIC";
  }
  
  return normalizedLanguage;
}

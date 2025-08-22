import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { validateLanguage } from "@/services/server/notifications/languageUtils";

export async function POST(request) {
    try {
        const data = await request.json();
        console.log("WhatsApp handler: Received request data:", JSON.stringify(data, null, 2));
       
        // Validate required fields
        if (!data.renterPhone || !data.renterName) {
            console.error("WhatsApp handler: Missing required fields for WhatsApp message");
            return Response.json(
                { error: 'Missing required fields for WhatsApp message' },
                { status: 400 }
            );
        }
       
        // Format dates to only include date, month, and year
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                throw new Error(`Invalid date format: ${dateString}`);
            }
            return date.toLocaleDateString('en-GB', { // Use 'en-GB' for DD/MM/YYYY format
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        };
       
        const formattedStartDate = formatDate(data.startDate);
        const formattedEndDate = formatDate(data.endDate);
       
        // Determine client language using the language API
        let clientLanguage = "ARABIC"; // Default
        let languageCode = "ar_AE";
        let templateName = "rent_agreement_creation"; // Default template
        
        if (data.renterId) {
            try {
                console.log(`WhatsApp handler: Calling language API for renter ID: ${data.renterId}`);
                
                // Call the language API endpoint
                const languageResponse = await fetch(new URL(`/api/notifications/language?clientId=${data.renterId}`, request.url).toString(), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!languageResponse.ok) {
                    throw new Error(`Language API returned ${languageResponse.status}`);
                }
                
                const languageData = await languageResponse.json();
                console.log(`WhatsApp handler: Retrieved language data:`, languageData);
                
                clientLanguage = languageData.language;
                languageCode = languageData.languageCode;
                
                // Get the specific template for rent agreements
                const baseTemplateName = "rent_agreement_creation";
                templateName = languageData.languageSettings.templates[baseTemplateName];
                
                console.log(`WhatsApp handler: Using client language from API: ${clientLanguage}`);
            } catch (error) {
                console.error(`WhatsApp handler: Error retrieving language from API: ${error.message}`);
                
                // Fall back to the language provided in the request, if any
                clientLanguage = validateLanguage(data.language) || "ARABIC";
                languageCode = clientLanguage === "ARABIC" ? "ar_AE" : "en";
                templateName = clientLanguage === "ARABIC" ? "rent_agreement_creation" : "rent_agreement_creation_en";
                
                console.log(`WhatsApp handler: Falling back to request language: ${clientLanguage}`);
            }
        } else {
            // No client ID, use the language provided in the request
            clientLanguage = validateLanguage(data.language) || "ARABIC";
            languageCode = clientLanguage === "ARABIC" ? "ar_AE" : "en";
            templateName = clientLanguage === "ARABIC" ? "rent_agreement_creation" : "rent_agreement_creation_en";
            
            console.log(`WhatsApp handler: No renter ID, using request language: ${clientLanguage}`);
        }
        
        console.log(`WhatsApp handler: Using template: ${templateName} with language code: ${languageCode}`);
       
        // Construct the template variables
        const templateVariables = {
            1: data.renterName,
            2: data.propertyName,
            3: data.unitNumber,
            4: formattedStartDate,
            5: formattedEndDate,
            6: data.totalContractPrice.toString() // Ensure it's a string
        };
       
        // Send WhatsApp message with appropriate template and language
        const result = await sendWhatsAppMessage(
            data.renterPhone,
            templateVariables,
            true, // Use template
            templateName, // Use the resolved template name
            { language: { code: languageCode } }
        );
       
        console.log('WhatsApp handler: Message sent successfully with ID:', result.messages?.[0]?.id);
       
        return Response.json({
            success: true,
            messageId: result.messages?.[0]?.id,
            language: clientLanguage,
            templateUsed: templateName
        });
    } catch (error) {
        console.error('WhatsApp handler: Failed to send message:', error.toString());
        // Return detailed error for debugging
        return Response.json(
            {
                error: 'Failed to send WhatsApp message',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

// file: /src/services/server/notifications/status.js
/**
 * Sends notifications (WhatsApp and/or email) about maintenance request status updates.
 * @param {object} options - Notification options
 * @param {string} options.requestId - The maintenance request ID
 * @param {string} options.newStatus - The new status of the maintenance request
 * @param {string} [options.phoneNumber] - The user's phone number for WhatsApp notification
 * @param {string} [options.email] - The user's email address for email notification
 * @param {string} [options.name] - The user's name (for email personalization)
 * @returns {Promise<object>} - Object containing results of notification attempts
 */
export async function sendMaintenanceStatusNotification({
  requestId,
  newStatus,
  phoneNumber,
  email,
  name
}) {
  const results = {
    whatsapp: { sent: false },
    email: { sent: false }
  };

  // Input validation
  if (!requestId || !newStatus) {
    throw new Error("Request ID and new status are required");
  }

  // Send WhatsApp notification if phone number is provided
  if (phoneNumber) {
    try {
      const whatsappResponse = await fetch("/api/notifications/whatsapp/request/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phoneNumber,
          requestId,
          newStatus
        })
      });

      const whatsappResult = await whatsappResponse.json();
      
      if (whatsappResponse.ok) {
        results.whatsapp = {
          sent: true,
          messageId: whatsappResult.messageId
        };
      } else {
        results.whatsapp = {
          sent: false,
          error: whatsappResult.error || whatsappResult.details || "Unknown error"
        };
      }
    } catch (error) {
      console.error("Failed to send WhatsApp notification:", error);
      results.whatsapp = {
        sent: false,
        error: error.message
      };
    }
  }

  // Send email notification if email is provided
  if (email) {
    try {
      const emailResponse = await fetch("/api/notifications/email/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          requestId,
          newStatus,
          name
        })
      });

      const emailResult = await emailResponse.json();
      
      if (emailResponse.ok) {
        results.email = {
          sent: true,
          messageId: emailResult.messageId
        };
      } else {
        results.email = {
          sent: false,
          error: emailResult.error || emailResult.details || "Unknown error"
        };
      }
    } catch (error) {
      console.error("Failed to send email notification:", error);
      results.email = {
        sent: false,
        error: error.message
      };
    }
  }

  return results;
}

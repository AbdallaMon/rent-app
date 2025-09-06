export async function sendNotifications(rentAgreement, options = {}) {
  // Get renter's language from database, fallback to options or default Arabic
  let renterLanguage = "ar"; // default

  // Convert database language enum to email language code
  if (rentAgreement.renter && rentAgreement.renter.language) {
    renterLanguage = rentAgreement.renter.language === "ENGLISH" ? "en" : "ar";
  } else if (options.language) {
    renterLanguage = options.language;
  }

  // Validate required fields
  if (
    !rentAgreement.renter.name ||
    !rentAgreement.renter.phone ||
    !rentAgreement.renter.email
  ) {
    console.warn("Missing required fields for notifications:", {
      name: !!rentAgreement.renter.name,
      phone: !!rentAgreement.renter.phone,
      email: !!rentAgreement.renter.email,
    });
    // Don't throw error, just log warning and continue with available data
  }

  // Fetch installments for this rent agreement with better error handling
  let installments = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const installmentsResponse = await fetch(
      `${baseUrl}/api/main/installments?rentAgreementId=${rentAgreement.id}`
    );
    if (installmentsResponse.ok) {
      const installmentsData = await installmentsResponse.json();
      installments = installmentsData.data || [];
      console.log(
        `✅ Fetched ${installments.length} installments for rent agreement ${rentAgreement.id}`
      );
    } else {
      console.warn(
        `⚠️ Failed to fetch installments: ${installmentsResponse.status}`
      );
    }
  } catch (error) {
    console.error("❌ Failed to fetch installments:", error);
    // Continue without installments rather than failing completely
  }

  const notificationData = {
    renterName: rentAgreement.renter.name,
    renterEmail: rentAgreement.renter.email,
    renterPhone: rentAgreement.renter.phone,
    unitNumber: rentAgreement.unit.number,
    propertyName: rentAgreement.unit.property.name,
    startDate: rentAgreement.startDate,
    endDate: rentAgreement.endDate,
    totalContractPrice: rentAgreement.totalContractPrice,
    rentCollectionType: rentAgreement.rentCollectionType,
    installments: installments,
    language: renterLanguage,
    // Additional details for enhanced email
    rentAgreementNumber: rentAgreement.rentAgreementNumber,
    tax: rentAgreement.tax,
    registrationFees: rentAgreement.registrationFees,
    insuranceFees: rentAgreement.insuranceFees,
  };

  const notifications = [];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // Send email notification
  if (rentAgreement.renter.email) {
    console.log(
      `📧 Sending ${renterLanguage === "ar" ? "Arabic" : "English"} email notification to ${rentAgreement.renter.email}`
    );
    notifications.push(
      fetch(`${baseUrl}/api/notifications/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationData),
      })
        .then((response) => {
          if (!response.ok) {
            console.error("❌ Email notification failed:", response.statusText);
            return response.text().then((text) => {
              console.error("Error details:", text);
              throw new Error(`Email failed: ${response.statusText}`);
            });
          } else {
            console.log(
              `✅ ${renterLanguage === "ar" ? "Arabic" : "English"} email notification sent successfully`
            );
            return response.json();
          }
        })
        .catch((error) => {
          console.error("❌ Failed to send email notification:", error);
          throw error;
        })
    );
  } else {
    console.warn("⚠️ No email address provided for renter");
  }

  if (rentAgreement.renter.phone) {
    const templateVariables = {
      1: rentAgreement.renter.name, // اسم المستأجر
      2: rentAgreement.unit.property.name, // اسم العقار
      3: rentAgreement.unit.number, // رقم الوحدة
      4: rentAgreement.startDate, // تاريخ البدء
      5: rentAgreement.endDate, // تاريخ الانتهاء
      6: rentAgreement.totalContractPrice, // السعر الإجمالي
    };

    notifications.push(
      fetch(`${baseUrl}/api/notifications/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renterPhone: rentAgreement.renter.phone,
          renterName: rentAgreement.renter.name,
          propertyName: rentAgreement.unit.property.name,
          unitNumber: rentAgreement.unit.number,
          startDate: rentAgreement.startDate,
          endDate: rentAgreement.endDate,
          totalContractPrice: rentAgreement.totalContractPrice,
          templateName: "rent_agreement_creation",
          templateVariables: templateVariables,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            console.error("WhatsApp notification failed:", response.statusText);
          } else {
            console.log("WhatsApp notification sent successfully");
          }
        })
        .catch((error) =>
          console.error("Failed to send WhatsApp notification:", error)
        )
    );
  }

  // Execute all notifications in parallel and return results
  const results = await Promise.allSettled(notifications);
  return results.map((result) => {
    if (result.status === "fulfilled") {
      return { success: true, response: result.value };
    } else {
      return { success: false, error: result.reason };
    }
  });
}

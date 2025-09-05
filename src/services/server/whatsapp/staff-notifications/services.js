import { normalizePhone } from "@/lib/phone";
import {
  formatDate,
  logWhatsApp,
  messageStatus,
  messageTypes,
  updateWhatsAppLog,
} from "../utility";
import { sendSmart } from "../whatsapp";
import { getTeamSettings } from "./settings";

function buildArabicMessageByType(type, extra = {}) {
  const { note } = extra || {};
  switch (String(type || "").toUpperCase()) {
    case "RENEW_CONTRACT":
      return (
        "طلب جديد لتجديد العقد. نرجو المتابعة مع العميل لاستكمال الإجراءات." +
        (note ? ` ملاحظة: ${note}` : "")
      );
    case "SUPPORT":
      return (
        "طلب تواصل مع خدمة العملاء. نرجو مراجعة التفاصيل والتواصل مع العميل." +
        (note ? ` ملاحظة: ${note}` : "")
      );
    case "MAINTAINCE":
      return "طلب صيانة من جديد" + (note ? ` ملاحظة: ${note}` : "");
    case "COMPLAINT":
      return (
        "شكوى جديدة من العميل. نرجو الاطلاع واتخاذ الإجراء المناسب." +
        (note ? ` ملاحظة: ${note}` : "")
      );
    default:
      return (
        "نموذج تواصل جديد من العميل. نرجو المراجعة والتواصل." +
        (note ? ` ملاحظة: ${note}` : "")
      );
  }
}
export async function sendContactFormSubmissionToCS({
  type,
  note,
  clientName,
  clientEmail,
  clientPhone,
  preferedLng,
  id,
}) {
  console.log("trigger sendContactFormSubmissionToCS");

  const teamSettings = await getTeamSettings();
  const customerServicePhone = teamSettings?.customerServicePhone;
  const recipient = normalizePhone(customerServicePhone).e164;
  const templateName = "contact_form_submission";
  const language = "ar_AE";
  const relationKey =
    type === "RENEW_CONTRACT"
      ? messageTypes.RENEW_RENTAGREEMENT_REQUEST
      : messageTypes.CUSTOMER_SUPPORT_REQUEST;
  const logData = {
    relationId: String(id),
    relationKey,
    recipient,
    language,
    status: messageStatus.SCHEDULED,
    messageType: relationKey,
    templateName,
  };
  const log = await logWhatsApp({
    ...logData,
  });

  try {
    const textForSession = buildArabicMessageByType(type);
    const bodyParams = [
      clientName,
      clientEmail,
      clientPhone,
      textForSession,
      preferedLng,
    ];
    const result = await sendSmart({
      to: recipient,
      text: textForSession,
      spec: {
        templateName: templateName,
        language,
        bodyParams,
      },
    });
    await updateWhatsAppLog({
      logId: log.id,
      status: messageStatus.DELIVERED,
      other: {
        language: result.language,
        metadata: result.meta,
      },
    });

    return result;
  } catch (e) {
    await updateWhatsAppLog({
      logId: log.id,
      status: messageStatus.FAILED,
      other: { metadata: e?.response || { error: e?.message } },
    });
    console.log("error sending notifcation to customer service", e.message);
  }
}

export async function sendMaintainceRequestToTech({
  requestId,
  propertyName,
  unitNumber,
  clientPhone,
  requestDate,
  type,
  maintenanceType,
  description,
  priority,
  clientName,
  displayId,
}) {
  const teamSettings = await getTeamSettings();
  const technicianPhone = teamSettings?.technicianPhone;
  const recipient = normalizePhone(technicianPhone).e164;
  const templateName = "maintenance_request_tc_v3";
  const language = "ar_AE";
  const relationKey = messageTypes.MAINTAINCE_REQUEST_TO_TECH;
  const logData = {
    relationId: String(requestId),
    relationKey,
    recipient,
    language,
    status: messageStatus.SCHEDULED,
    messageType: relationKey,
    templateName,
  };
  const log = await logWhatsApp({
    ...logData,
  });
  try {
    const textForSession = buildArabicMessageByType(type);
    const bodyParams = [
      str(displayId || requestId),
      str(clientName),
      str(priority),
      str(maintenanceType),
      str(description),
      str(clientPhone),
      str(propertyName),
      str(unitNumber),
      formatDate(requestDate),
    ];
    const result = await sendSmart({
      to: recipient,
      text: textForSession,
      spec: {
        templateName,
        language,
        bodyParams,
      },
    });
    await updateWhatsAppLog({
      logId: log.id,
      status: messageStatus.DELIVERED,
      other: {
        language: result.language,
        metadata: result.meta,
      },
    });
    console.log("sent text to tehc phone:", teamSettings.technicianPhone);
    return result;
  } catch (e) {
    console.error("WA template failed:", e?.response?.data || e);

    await updateWhatsAppLog({
      logId: log.id,
      status: messageStatus.FAILED,
      other: { metadata: e?.response || { error: e?.message } },
    });
    console.log("error sending notifcation to technician", e.message);
  }
}
export async function sendMaintainceRequestToCS({
  requestId,
  propertyName,
  unitNumber,
  clientPhone,
  requestDate,
  type,
  maintenanceType,
  description,
  priority,
  clientName,
  displayId,
}) {
  const teamSettings = await getTeamSettings();
  const customerServicePhone = teamSettings?.customerServicePhone;
  const recipient = normalizePhone(customerServicePhone).e164;
  const templateName = "maintenance_request_tc_v3";
  const language = "ar_AE";
  const relationKey = messageTypes.MAINTAINCE_REQUEST_TO_TECH;
  const logData = {
    relationId: String(requestId),
    relationKey,
    recipient,
    language,
    status: messageStatus.SCHEDULED,
    messageType: relationKey,
    templateName,
  };
  const log = await logWhatsApp({
    ...logData,
  });
  try {
    const textForSession = buildArabicMessageByType(type);
    const bodyParams = [
      str(displayId || requestId),
      str(clientName),
      str(priority),
      str(maintenanceType),
      str(description),
      str(clientPhone),
      str(propertyName),
      str(unitNumber),
      formatDate(requestDate),
    ];
    const result = await sendSmart({
      to: recipient,
      text: textForSession,
      spec: {
        templateName,
        language,
        bodyParams,
      },
    });
    await updateWhatsAppLog({
      logId: log.id,
      status: messageStatus.DELIVERED,
      other: {
        language: result.language,
        metadata: result.meta,
      },
    });
    console.log(
      "sent maintenance request to cs phone:",
      teamSettings.customerServicePhone
    );
    return result;
  } catch (e) {
    console.error("WA template failed:", e?.response?.data || e);

    await updateWhatsAppLog({
      logId: log.id,
      status: messageStatus.FAILED,
      other: { metadata: e?.response || { error: e?.message } },
    });
    console.log("error sending notifcation to technician", e.message);
  }
}
export async function sendComplaintRequestToCs({
  requestId,
  propertyName,
  unitNumber,
  clientPhone,
  requestDate,
  type,
  complaintType,
  description,
  clientName,
  displayId,
  priority,
}) {
  console.log("trigger sendComplaintRequestToCs");

  const teamSettings = await getTeamSettings();
  const customerServicePhone = teamSettings?.customerServicePhone;
  const recipient = normalizePhone(customerServicePhone).e164;
  const templateName = "complaint_request_cs_v2";
  const language = "ar_AE";
  const relationKey = messageTypes.COMPLAINT_REQUEST_TO_CS;
  const logData = {
    relationId: String(requestId),
    relationKey,
    recipient,
    language,
    status: messageStatus.SCHEDULED,
    messageType: relationKey,
    templateName,
  };
  const log = await logWhatsApp({
    ...logData,
  });
  try {
    const textForSession = buildArabicMessageByType(type);
    const bodyParams = [
      str(requestId),
      str(displayId),
      str(clientName),
      str(priority),
      str(complaintType),
      str(description),
      str(clientPhone),
      str(propertyName),
      str(unitNumber),
      formatDate(requestDate),
    ];
    const result = await sendSmart({
      to: recipient,
      text: textForSession,
      spec: {
        templateName,
        language,
        bodyParams,
      },
    });
    await updateWhatsAppLog({
      logId: log.id,
      status: messageStatus.DELIVERED,
      other: {
        language: result.language,
        metadata: result.meta,
      },
    });
    return result;
  } catch (e) {
    console.error("WA template failed:", e?.response?.data || e);

    await updateWhatsAppLog({
      logId: log.id,
      status: messageStatus.FAILED,
      other: { metadata: e?.response || { error: e?.message } },
    });
    console.log("error sending notifcation to customer service", e.message);
  }
}
// complaint_request_cs
function str(v) {
  return (v == null ? "" : String(v))
    .replace(/[\u200E\u200F\u202A-\u202E]/g, "")
    .trim();
}

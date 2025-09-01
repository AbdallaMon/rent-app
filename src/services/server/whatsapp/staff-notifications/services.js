import { getTeamSettings } from "../cron-jobs/reminderService";
import { normalizePhone } from "../cron-jobs/utility";
import { sendSmart } from "../whatsapp";

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
}) {
  try {
    const teamSettings = await getTeamSettings();
    const customerServicePhone = teamSettings?.customerServicePhone;
    const recipient = normalizePhone(customerServicePhone);
    const textForSession = buildArabicMessageByType(type, { note });
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
        templateName: "contact_form_submission",
        language: "ar_AE",
        bodyParams,
      },
    });
    return result;
  } catch (e) {
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
}) {
  try {
    const teamSettings = await getTeamSettings();
    const technicianPhone = teamSettings?.technicianPhone;
    const recipient = normalizePhone(technicianPhone);
    const textForSession = buildArabicMessageByType(type, { note });
    const bodyParams = [
      requestId,
      clientName,
      priority,
      maintenanceType,
      description,
      clientPhone,
      propertyName,
      unitNumber,
      requestDate,
    ];
    const result = await sendSmart({
      to: recipient,
      text: textForSession,
      spec: {
        templateName: "maintenance_request_tc_v2",
        language: "ar_AE",
        bodyParams,
      },
    });
    return result;
  } catch (e) {
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
  try {
    const teamSettings = await getTeamSettings();
    const technicianPhone = teamSettings?.technicianPhone;
    const customerServicePhone = teamSettings?.customerServicePhone;
    const recipient = normalizePhone(customerServicePhone);
    const textForSession = buildArabicMessageByType(type, { note });
    const bodyParams = [
      requestId,
      displayId,
      clientName,
      priority,
      complaintType,
      description,
      clientPhone,
      propertyName,
      unitNumber,
      requestDate,
    ];
    const result = await sendSmart({
      to: recipient,
      text: textForSession,
      spec: {
        templateName: "complaint_request_cs_v2",
        language: "ar_AE",
        bodyParams,
      },
    });
    return result;
  } catch (e) {
    console.log("error sending notifcation to technician", e.message);
  }
}
// complaint_request_cs

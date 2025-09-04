import {
  ComplaintCategoryLabels,
  LANG,
  MaintenanceTypeLabels,
  PriorityLabels,
} from "../services/constants";
import { getSession, setSession } from "../session";
import {
  sendLanguage,
  sendMain,
  sendMaintenanceConfirmation,
  sendComplaintConfirmation,
} from "../responders";
import { createMaintenanceRequestProduction } from "../services/maintenance";
import { createComplaintProduction } from "../services/complaints";

export async function handleTextMessage(phone, text, incomingMessage) {
  const sess = getSession(phone);
  if (!sess) return sendLanguage(phone);

  const language = sess.language || LANG.AR;
  const ar = language === LANG.AR;
  const t = (text || "").toLowerCase().trim();

  switch (sess.step) {
    case "awaiting_language_selection":
      if (t === "1" || t.includes("english"))
        return sendMain(phone, LANG.EN, incomingMessage);
      if (t === "2" || t.includes("عرب"))
        return sendMain(phone, LANG.AR, incomingMessage);
      return sendLanguage(phone);

    case "awaiting_description": {
      const res = await createMaintenanceRequestProduction(phone, text, sess);
      if (!res?.success) {
        await sendMain(phone, language);
        return;
      }
      const r = res.data?.request;
      await sendMaintenanceConfirmation(
        phone,
        language,
        {
          id: r?.displayId || r?.id,
          property: res.data?.property?.name || (ar ? "غير محدد" : "N/A"),
          unit:
            res.data?.unit?.number ||
            res.data?.unit?.unitId ||
            (ar ? "غير محدد" : "N/A"),
          type: MaintenanceTypeLabels[r?.type || "OTHER"][ar ? "ar" : "en"],
          priority: PriorityLabels[r?.priority || "MEDIUM"][ar ? "ar" : "en"],
          desc: text,
        },
        incomingMessage
      );
      setSession(phone, { data: {}, step: "completed" });
      return;
    }

    case "awaiting_complaint_description": {
      const res = await createComplaintProduction(phone, text, sess);
      if (!res?.success) {
        await sendMain(phone, language);
        return;
      }
      const c = res.data?.complaint;
      await sendComplaintConfirmation(
        phone,
        language,
        {
          id: c?.displayId || c?.id,
          property: res.data?.property?.name || (ar ? "غير محدد" : "N/A"),
          unit:
            res.data?.unit?.number ||
            res.data?.unit?.unitId ||
            (ar ? "غير محدد" : "N/A"),
          type: ComplaintCategoryLabels[c?.type || "OTHER"][ar ? "ar" : "en"],
          priority: PriorityLabels[c?.priority || "MEDIUM"][ar ? "ar" : "en"],
          desc: text,
        },
        incomingMessage
      );
      setSession(phone, { data: {}, step: "completed" });
      return;
    }

    case "completed":
      return sendMain(phone, language, incomingMessage);

    default:
      return sendMain(phone, language, incomingMessage);
  }
}

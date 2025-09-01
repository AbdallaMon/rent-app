// lib/reminderService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const {
  daysUntil,
  sleep,
  formatDateDubai,
  isWithinWorkingHours,
  nowDubai,
} = require("./time");
const { normalizePhone } = require("./utility");
const {
  getSettings,
  getTeamSettings,
} = require("../staff-notifications/settings");
const { sendSmart } = require("../whatsapp");

// ===== language mapping =====
function toWhatsAppLang(enumVal) {
  return enumVal === "ENGLISH" ? "en" : "ar_AE";
}

const SELECT_TEMPLATE = {
  payment_reminder(lang) {
    return lang === "en" ? "payment_due_reminder_en" : "payment_due_reminder";
  },
  contract_expiry_reminder(lang) {
    return lang === "en"
      ? "contract_expiration_reminder_en"
      : "contract_expiration";
  },
  maintenance_followup(lang) {
    return lang === "en"
      ? "maintenance_request_reminder_en"
      : "maintenance_request_reminder";
  },
};

async function logWhatsApp(body) {
  try {
    return await prisma.whatsappMessageLog.create({
      data: {
        messageId: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        ...body,
      },
    });
  } catch (e) {
    console.error("logWhatsApp error:", e.message);
  }
}
async function updateWhatsAppLog({ logId, status, other }) {
  const log = await prisma.whatsappMessageLog.findFirst({
    where: { id: logId },
  });
  if (!log) return;
  await prisma.whatsappMessageLog.update({
    where: { id: log.id },
    data: { status, ...(other && { ...other }) },
  });
}
async function checkIfThereIsALog({ sendSchema, relationKey, relationId }) {
  return await prisma.whatsappMessageLog.findFirst({
    where: {
      sendSchema,
      relationKey,
      relationId,
      status: { not: "failed" },
    },
  });
}

// ===== generic smart reminder sender (no template creation) =====
async function sendReminderSmart({
  relationKey, // "payment_reminder" | "contract_expiry_reminder" | "maintenance_reminder"
  to,
  lang, // "ar_AE" | "en"
  textForSession, // free-form message (session window)
  bodyParams, // array matching the template BODY order
  settings,
  logData, // { sendSchema, relationId, relationKey }
}) {
  const recipient = normalizePhone(to);
  const templateName = SELECT_TEMPLATE[relationKey](lang);

  const log = await logWhatsApp({
    recipient,
    language: lang,
    status: "scheduled",
    messageType: relationKey,
    ...logData,
  });

  try {
    const result = await sendSmart({
      to: recipient,
      text: textForSession,
      spec: {
        templateName,
        language: lang,
        bodyParams,
      },
    });

    // const result = {
    //   type: "template",
    //   language: "ar_AE",
    //   meta: [],
    // };
    await updateWhatsAppLog({
      logId: log.id,
      status: "delivered",
      other: {
        messageType: result.type, // "session" | "template"
        language: result.language, // "session" | "ar_AE" | "en"
        metadata: result.meta,
      },
    });

    return { ok: true, type: result.type, language: result.language };
  } catch (e) {
    await updateWhatsAppLog({
      logId: log.id,
      status: "failed",
      other: { metadata: e?.response || { error: e?.message } },
    });
    return { ok: false, error: e?.message };
  }
}

// ====== FLOWS ======

// ---- Payments ----
// Template params order (AR & EN):
// 1: name, 2: amount AED, 3: property, 4: due date
async function processPaymentReminders(now = new Date(), settings) {
  const daysList = settings.paymentReminderDays;
  if (!daysList.length) return { ok: true, skipped: "no_days" };

  const pending = await prisma.payment.findMany({
    where: { status: { not: "PAID" } },
    select: {
      id: true,
      amount: true,
      dueDate: true,
      paymentType: true,
      client: { select: { id: true, name: true, phone: true, language: true } },
      rentAgreement: {
        select: {
          id: true,
          renter: {
            select: { id: true, name: true, phone: true, language: true },
          },
          unit: {
            select: { number: true, property: { select: { name: true } } },
          },
        },
      },
    },
  });

  let sent = 0;
  for (const p of pending) {
    if (!p.dueDate) continue;
    const diff = daysUntil(new Date(p.dueDate), now);
    console.log(diff, "diff");
    console.log(daysList, "daysList");
    if (!daysList.includes(diff)) continue;

    const logData = {
      sendSchema: String(diff),
      relationId: String(p.id),
      relationKey: "payment_reminder",
    };
    const oldLog = await checkIfThereIsALog(logData);
    if (oldLog) continue;

    // choose the target (renter for RENT/INSURANCE/TAX/REGISTRATION)
    const needsRenter = ["RENT", "INSURANCE", "TAX", "REGISTRATION"].includes(
      p.paymentType
    );
    const target = needsRenter ? p.rentAgreement?.renter : p.client;
    const phone = target?.phone;
    if (!phone) continue;

    const lang = toWhatsAppLang(target?.language || "ARABIC");
    const name = target?.name || (lang === "ar_AE" ? "العميل" : "Customer");
    const propertyName =
      p?.rentAgreement?.unit?.property?.name ||
      (lang === "ar_AE" ? "غير محدد" : "N/A");
    const dueStr = formatDateDubai(p.dueDate);

    const bodyParams = [name, String(p.amount), propertyName, dueStr];

    const textForSession =
      lang === "ar_AE"
        ? `عزيزي ${name}،\n\nتذكير بدفع الإيجار المستحق:\n- المبلغ: ${p.amount} درهم إماراتي\n- العقار: ${propertyName}\n- تاريخ الاستحقاق: ${dueStr}\n\nيرجى إتمام الدفع في أقرب وقت ممكن.`
        : `Dear ${name},\n\nRent payment reminder:\n- Amount: ${p.amount} AED\n- Property: ${propertyName}\n- Due date: ${dueStr}\n\nPlease complete payment as soon as possible.`;

    const res = await sendReminderSmart({
      relationKey: "payment_reminder",
      to: phone,
      lang,
      textForSession,
      bodyParams,
      settings,
      logData,
    });

    if (res.ok) sent += 1;

    await sleep(settings.messageDelay || 0);
  }

  return { ok: true, sent };
}

// ---- Contracts ----
// Template params (AR & EN):
// 1: name, 2: property, 3: unit, 4: expiration date
async function processContractReminders(now = new Date(), settings) {
  const daysList = settings.contractReminderDays;
  if (!daysList.length) return { ok: true, skipped: "no_days" };

  const agreements = await prisma.rentAgreement.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      endDate: true,
      renter: { select: { id: true, name: true, phone: true, language: true } },
      unit: { select: { number: true, property: { select: { name: true } } } },
    },
  });

  let sent = 0;
  for (const ra of agreements) {
    if (!ra.endDate) continue;
    const diff = daysUntil(new Date(ra.endDate), now);
    console.log(diff, "diff");
    console.log(daysList, "daysList");
    if (!daysList.includes(diff)) continue;

    const logData = {
      sendSchema: String(diff),
      relationId: String(ra.id),
      relationKey: "contract_expiry_reminder",
    };
    const oldLog = await checkIfThereIsALog(logData);
    if (oldLog) continue;

    const phone = ra.renter?.phone;
    if (!phone) continue;

    const lang = toWhatsAppLang(ra.renter?.language || "ARABIC");
    const name = ra.renter?.name || (lang === "ar_AE" ? "العميل" : "Customer");
    const propertyName =
      ra.unit?.property?.name || (lang === "ar_AE" ? "غير محدد" : "N/A");
    const unitNo = ra.unit?.number || "-";
    const endStr = formatDateDubai(ra.endDate);

    const bodyParams = [name, propertyName, unitNo, endStr];

    const textForSession =
      lang === "ar_AE"
        ? `عزيزي / ${name}،\n\nيرجى العلم أن عقد الإيجار سينتهي قريبًا.\n🏠 العقار: ${propertyName}\n🔑 الوحدة: ${unitNo}\n📅 تاريخ الانتهاء: ${endStr}\n\nيرجى التواصل معنا قريبًا.`
        : `Dear / ${name},\n\nYour lease will expire soon.\n🏠 Property: ${propertyName}\n🔑 Unit: ${unitNo}\n📅 Expiration date: ${endStr}\n\nPlease contact us as soon as possible.`;

    const res = await sendReminderSmart({
      relationKey: "contract_expiry_reminder",
      to: phone,
      lang,
      textForSession,
      bodyParams,
      settings,
      logData,
    });

    if (res.ok) sent += 1;
    await sleep(settings.messageDelay || 0);
  }

  return { ok: true, sent };
}

// ---- Maintenance (to technician/team) ----
// Template params: 1 property, 2 unit, 3 problem, 4 client phone, 5 request date
// lib/reminderService.js
async function processMaintenanceFollowups(
  now = new Date(),
  teamSettings,
  settings
) {
  const technicianPhone = teamSettings?.technicianPhone;
  const customerServicePhone = teamSettings?.customerServicePhone;
  if (!technicianPhone) return { ok: false, error: "No technician phone" };

  const daysList = (settings.maintenanceFollowupDays || [])
    .map(Number)
    .filter((n) => Number.isFinite(n));
  if (!daysList.length) return { ok: true, skipped: "no_days" };

  const requests = await prisma.maintenanceRequest.findMany({
    where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
    select: {
      id: true,
      displayId: true,
      description: true,
      requestDate: true,
      property: { select: { name: true } },
      unit: { select: { number: true } },
      client: { select: { phone: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  let sent = 0;
  // Choose the language for the TECH team here:
  const techLang = "ar_AE"; // change to "en" if your team prefers English

  for (const r of requests) {
    const baseDate = r.requestDate || r.createdAt || r.updatedAt;
    const diff = daysUntil(new Date(baseDate), now);
    console.log(diff, "diff");
    console.log(daysList, "daysList");

    if (!daysList.includes(diff)) continue;

    const logData = {
      sendSchema: String(diff),
      relationId: r.id,
      relationKey: "maintenance_followup", // <— NEW key
    };
    const oldLog = await checkIfThereIsALog(logData);
    if (oldLog) continue;

    const propertyName = r.property?.name || "-";
    const unitNo = r.unit?.number || "-";
    const issue = (r.description || "-").slice(0, 200);
    const clientPhone = normalizePhone(r.client?.phone || "") || "-";
    const reqDateStr = formatDateDubai(baseDate);
    const ageDays = String(diff);
    const ticketId = r.displayId || r.id;

    // 7 params, same order as templates
    const bodyParams = [
      propertyName,
      unitNo,
      issue,
      clientPhone,
      reqDateStr,
      ageDays,
      ticketId,
    ];

    // Session text (human-friendly; can include newlines/emojis)
    const textForSession =
      techLang === "ar_AE"
        ? `تذكير متابعة طلب صيانة (${ticketId}):\nالعقار: ${propertyName}\nالوحدة: ${unitNo}\nالمشكلة: ${issue}\nرقم العميل: ${clientPhone}\nتاريخ الطلب: ${reqDateStr}\nالمدة المنقضية: ${ageDays} يوم\n\nيرجى المتابعة واتخاذ الإجراء المناسب.`
        : `Maintenance follow-up reminder (${ticketId}):\nProperty: ${propertyName}\nUnit: ${unitNo}\nIssue: ${issue}\nClient phone: ${clientPhone}\nRequest date: ${reqDateStr}\nAge: ${ageDays} day(s)\n\nPlease follow up and take the necessary action.`;

    const textForCustomerService =
      csLang === "ar_AE"
        ? `متابعة طلب صيانة متأخر (${ticketId}):\nالعقار: ${propertyName}\nالوحدة: ${unitNo}\nالمشكلة: ${issue}\nتاريخ الطلب: ${reqDateStr}\nالمدة المنقضية: ${ageDays} يوم\n\nيرجى مراجعة حالة الطلب مع الفني والتأكد من سرعة الإنجاز.`
        : `Delayed maintenance request follow-up (${ticketId}):\nProperty: ${propertyName}\nUnit: ${unitNo}\nIssue: ${issue}\nRequest date: ${reqDateStr}\nAge: ${ageDays} day(s)\n\nPlease review the request status with the technician and ensure timely completion.`;

    const res = await sendReminderSmart({
      relationKey: "maintenance_followup",
      to: technicianPhone,
      lang: techLang,
      textForSession,
      bodyParams,
      settings,
      logData,
    });

    const customerServiceRes = await sendReminderSmart({
      relationKey: "maintenance_followup",
      to: customerServicePhone,
      lang: techLang,
      textForCustomerService,
      bodyParams,
      settings,
      logData,
    });
    if (res.ok) sent += 1;
    await sleep(settings.messageDelay || 0);
  }

  return { ok: true, sent };
}

// ---- Orchestrator ----
async function runAllReminders({ now = new Date() } = {}) {
  const results = {};
  const settings = await getSettings();
  const teamSettings = await getTeamSettings();
  const isAllowedToSendReminder = await checkIfReminderAllowed(settings);
  if (!isAllowedToSendReminder.ok) {
    return [isAllowedToSendReminder];
  }

  try {
    results.payments = await processPaymentReminders(now, settings);
  } catch (e) {
    results.payments = { ok: false, error: e.message };
  }
  try {
    results.contracts = await processContractReminders(now, settings);
  } catch (e) {
    results.contracts = { ok: false, error: e.message };
  }
  try {
    const isTeamAllowed =
      await checkIfAllowedToSendByTeamSettings(teamSettings);
    //send to customer service too
    if (!isTeamAllowed.ok) {
      return [isTeamAllowed];
    }
    results.maintenance = await processMaintenanceFollowups(
      now,
      teamSettings,
      settings
    );
  } catch (e) {
    results.maintenance = { ok: false, error: e.message };
  }
  return results;
}
async function checkIfReminderAllowed(settings) {
  if (!settings.enableAutoReminders) {
    return { ok: false, stoped: "Not allowed to send by system settings" };
  }
  const clock = nowDubai(new Date());
  const isAllowedToSendNow = isWithinWorkingHours(clock, settings);
  if (!isAllowedToSendNow) {
    return {
      ok: false,
      stoped: "Not allowed to send cause now is not within working hours",
    };
  }
  return {
    ok: true,
  };
}
async function checkIfAllowedToSendByTeamSettings(teamSettings) {
  if (!teamSettings.notifyTechnicianForMaintenance) {
    return { ok: false, skipped: "no notification for technician allowed" };
  }

  return { ok: true };
}
module.exports = {
  getSettings,
  processPaymentReminders,
  processContractReminders,
  processMaintenanceFollowups,
  runAllReminders,
  getTeamSettings,
};

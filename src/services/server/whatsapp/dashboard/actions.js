import prisma from "@/lib/prisma";
import { DAY_KEYS, DEFAULT_REMINDER, HHMMSS } from "./defaults";

const isEG =
  String(process.env.NEXT_PUBLIC_EG || "").toLowerCase() === "true" ||
  String(process.env.EG || "").toUpperCase() === "true";

function validatePhone(phone, label) {
  if (!phone) return; // optional fields
  const cleaned = String(phone).replace(/\s/g, "");
  const eg = /^20\d{10}$/; // 20 + 10 digits
  const ae = /^971\d{9}$/; // 971 + 9 digits
  const ok = isEG ? eg.test(cleaned) : ae.test(cleaned);
  if (!ok) {
    throw new Error(
      `${label} غير صحيح. يجب أن يبدأ بـ ${isEG ? "20" : "971"} ويتكون من ${isEG ? "12" : "12"} رقماً`
    );
  }
}

function intsArray(value, { min = 1, max = 365, label }) {
  const arr = Array.isArray(value) ? value : [];
  const out = [];
  const bad = [];
  for (const v of arr) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= min && n <= max) out.push(Math.trunc(n));
    else bad.push(v);
  }
  if (bad.length) {
    throw new Error(
      `${label} يجب أن يحتوي فقط على أرقام صحيحة بين ${min} و ${max}`
    );
  }

  return Array.from(new Set(out)).sort((a, b) => a - b);
}

function clampInt(v, { min, max, label }) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) {
    throw new Error(`${label} يجب أن يكون رقماً صحيحاً`);
  }
  if (n < min || n > max) {
    throw new Error(`${label} خارج النطاق`);
  }

  return n;
}

function validateTimeStr(s, label) {
  if (!HHMMSS.test(String(s || ""))) {
    throw new Error(`${label} يجب أن يكون بتنسيق HH:mm أو HH:mm:ss`);
  }
  return s.length === 5 ? `${s}:00` : s; // normalize to HH:mm:ss
}

function validateWorkingDays(days) {
  const arr = Array.isArray(days) ? days : [];
  const invalid = arr.filter((d) => !DAY_KEYS.includes(d));
  if (invalid.length) {
    throw new Error(
      `أيام العمل تحتوي على قيم غير صحيحة: ${invalid.join(", ")}`
    );
  }
  // Ensure unique + keep order of DAY_KEYS
  const uniq = Array.from(new Set(arr));
  return uniq;
}

// ---------- VALIDATORS ----------
export function validateReminderInput(input = {}) {
  const out = {};
  out.paymentReminderDays = intsArray(
    input.paymentReminderDays ?? DEFAULT_REMINDER.paymentReminderDays,
    {
      min: 1,
      max: 365,
      label: "paymentReminderDays",
    }
  );
  out.contractReminderDays = intsArray(
    input.contractReminderDays ?? DEFAULT_REMINDER.contractReminderDays,
    {
      min: 1,
      max: 365,
      label: "contractReminderDays",
    }
  );
  out.maintenanceFollowupDays = intsArray(
    input.maintenanceFollowupDays ?? DEFAULT_REMINDER.maintenanceFollowupDays,
    {
      min: 1,
      max: 365,
      label: "maintenanceFollowupDays",
    }
  );

  out.maxRetries = clampInt(input.maxRetries ?? DEFAULT_REMINDER.maxRetries, {
    min: 1,
    max: 10,
    label: "maxRetries",
  });
  out.messageDelay = clampInt(
    input.messageDelay ?? DEFAULT_REMINDER.messageDelay,
    { min: 500, max: 10000, label: "messageDelay" }
  );

  out.enableAutoReminders = Boolean(
    input.enableAutoReminders ?? DEFAULT_REMINDER.enableAutoReminders
  );
  out.includeCompanySignature = Boolean(
    input.includeCompanySignature ?? DEFAULT_REMINDER.includeCompanySignature
  );
  out.isActive = Boolean(input.isActive ?? DEFAULT_REMINDER.isActive);

  out.workingHoursStart = validateTimeStr(
    input.workingHoursStart ?? DEFAULT_REMINDER.workingHoursStart,
    "workingHoursStart"
  );
  out.workingHoursEnd = validateTimeStr(
    input.workingHoursEnd ?? DEFAULT_REMINDER.workingHoursEnd,
    "workingHoursEnd"
  );

  out.workingDays = validateWorkingDays(
    input.workingDays ?? DEFAULT_REMINDER.workingDays
  );

  // free-form arrays (stored as Json) — keep as-is or fallback
  out.enabledReminderTypes = Array.isArray(input.enabledReminderTypes)
    ? input.enabledReminderTypes
    : DEFAULT_REMINDER.enabledReminderTypes;

  out.highPriorityThreshold = clampInt(
    input.highPriorityThreshold ?? DEFAULT_REMINDER.highPriorityThreshold,
    {
      min: 1,
      max: 60,
      label: "highPriorityThreshold",
    }
  );
  out.mediumPriorityThreshold = clampInt(
    input.mediumPriorityThreshold ?? DEFAULT_REMINDER.mediumPriorityThreshold,
    {
      min: 1,
      max: 60,
      label: "mediumPriorityThreshold",
    }
  );

  // language string (DB is String)
  out.defaultLanguage = String(
    input.defaultLanguage ?? DEFAULT_REMINDER.defaultLanguage
  );

  // audit
  out.updatedBy = String(input.updatedBy || "admin_interface");
  out.updatedAt = new Date();
  return out;
}

export function validateTeamInput(input = {}) {
  // phones
  validatePhone(input.technicianPhone, "رقم هاتف الفني");
  validatePhone(input.customerServicePhone, "رقم هاتف خدمة العملاء");

  const out = {
    technicianPhone: input.technicianPhone || "",
    technicianName: input.technicianName || "الفني",
    notifyTechnicianForMaintenance: Boolean(
      input.notifyTechnicianForMaintenance ?? true
    ),
    technicianWorkingHours:
      input.technicianWorkingHours || "من 8:00 صباحاً إلى 5:00 مساءً",

    customerServicePhone: input.customerServicePhone || "",
    customerServiceName: input.customerServiceName || "خدمة العملاء",
    notifyCustomerServiceForComplaints: Boolean(
      input.notifyCustomerServiceForComplaints ?? true
    ),
    notifyCustomerServiceForContacts: Boolean(
      input.notifyCustomerServiceForContacts ?? true
    ),
    customerServiceWorkingHours:
      input.customerServiceWorkingHours || "من 9:00 صباحاً إلى 6:00 مساءً",

    maxDailyNotifications: clampInt(input.maxDailyNotifications ?? 10, {
      min: 1,
      max: 50,
      label: "maxDailyNotifications",
    }),
    notificationDelay: clampInt(input.notificationDelay ?? 5, {
      min: 1,
      max: 60,
      label: "notificationDelay",
    }),
    enableUrgentNotifications: Boolean(input.enableUrgentNotifications ?? true),
    enableBackupNotifications: Boolean(
      input.enableBackupNotifications ?? false
    ),

    customNotificationMessage: input.customNotificationMessage || "",
    isActive: Boolean(input.isActive ?? true),
    updatedBy: String(input.updatedBy || "admin_interface"),
    updatedAt: new Date(),
  };
  return out;
}
async function upsertReminderSettings(data) {
  const validated = validateReminderInput(data);
  const saved = await prisma.reminderSettings.upsert({
    where: { id: "default_reminder_settings" },
    update: validated,
    create: { id: "default_reminder_settings", ...validated },
  });
  return saved;
}

async function upsertTeamSettings(data) {
  const validated = validateTeamInput(data);
  const saved = await prisma.whatsAppTeamSettings.upsert({
    where: { id: "default_team_settings" },
    update: validated,
    create: { id: "default_team_settings", ...validated },
  });
  return saved;
}

export async function saveWhatsAppSettings({ reminderSettings, teamSettings }) {
  const results = await Promise.all([
    upsertReminderSettings(reminderSettings),
    upsertTeamSettings(teamSettings),
  ]);
  return {
    message: "تم حفظ الإعدادات بنجاح",
    data: results,
    reminderSettings: results[0],
    teamSettings: results[1],
  };
}

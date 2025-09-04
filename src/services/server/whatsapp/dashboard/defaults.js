export const DEFAULT_REMINDER = {
  paymentReminderDays: [7, 3, 1],
  contractReminderDays: [60, 30, 15, 7],
  maintenanceFollowupDays: [3, 7, 14],
  maxRetries: 3,
  messageDelay: 2000,
  enableAutoReminders: true,
  workingHoursStart: "09:00:00",
  workingHoursEnd: "18:00:00",
  workingDays: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  enabledReminderTypes: ["payment_reminder", "contract_expiry_reminder"],
  highPriorityThreshold: 3,
  mediumPriorityThreshold: 7,
  defaultLanguage: "ar_AE",
  includeCompanySignature: true,
  isActive: true,
};

export const DEFAULT_TEAM = {
  technicianPhone: "",
  technicianName: "الفني",
  notifyTechnicianForMaintenance: true,
  technicianWorkingHours: "من 8:00 صباحاً إلى 5:00 مساءً",
  customerServicePhone: "",
  customerServiceName: "خدمة العملاء",
  notifyCustomerServiceForComplaints: true,
  notifyCustomerServiceForContacts: true,
  customerServiceWorkingHours: "من 9:00 صباحاً إلى 6:00 مساءً",
  maxDailyNotifications: 10,
  notificationDelay: 5,
  enableUrgentNotifications: true,
  enableBackupNotifications: false,
  customNotificationMessage: "",
  isActive: true,
};

// ---------- Utils ----------
export const DAY_KEYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const HHMMSS = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

import prisma from "@/lib/prisma";

export async function getSettings() {
  const s = await prisma.reminderSettings.findUnique({
    where: { id: "default_reminder_settings" },
  });
  if (!s) throw new Error("ReminderSettings not found");
  return {
    ...s,
    paymentReminderDays: Array.isArray(s.paymentReminderDays)
      ? s.paymentReminderDays
      : JSON.parse(s.paymentReminderDays || "[]"),
    contractReminderDays: Array.isArray(s.contractReminderDays)
      ? s.contractReminderDays
      : JSON.parse(s.contractReminderDays || "[]"),
    maintenanceFollowupDays: Array.isArray(s.maintenanceFollowupDays)
      ? s.maintenanceFollowupDays
      : JSON.parse(s.maintenanceFollowupDays || "[]"),
    enabledReminderTypes: Array.isArray(s.enabledReminderTypes)
      ? s.enabledReminderTypes
      : JSON.parse(s.enabledReminderTypes || "[]"),
    workingDays: Array.isArray(s.workingDays)
      ? s.workingDays
      : JSON.parse(s.workingDays || "[0,1,2,3,4,5]"),
  };
}
export async function getTeamSettings() {
  return await prisma.whatsAppTeamSettings.findUnique({
    where: { id: "default_team_settings" },
  });
}

const {
  runAllReminders,
} = require("../src/services/server/whatsapp/reminderService.js");
(async () => {
  try {
    const out = await runAllReminders(new Date());
    console.log("[CRON] done:", JSON.stringify(out));
  } catch (e) {
    console.error("[CRON] failed:", e);
    process.exitCode = 1;
  }
})();

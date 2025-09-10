import { runAllReminders } from "./reminderService.js";

(async () => {
  try {
    const out = await runAllReminders({ now: new Date() });
    console.log("[CRON] done:", JSON.stringify(out));
  } catch (e) {
    console.error("[CRON] failed:", e);
    process.exitCode = 1;
  }
})();

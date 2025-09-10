// CommonJS wrapper that can run under plain `node` or PM2
(async () => {
  try {
    // Point to the transpiled JS file (not TS). If your service is TS, see notes below.
    const { runAllReminders } = await import(
      "../src/services/server/whatsapp/cron-jobs/reminderService.js"
    );

    const out = await runAllReminders({ now: new Date() });
    console.log("[CRON] done:", JSON.stringify(out));
  } catch (e) {
    console.error("[CRON] failed:", e);
    process.exitCode = 1;
  }
})();

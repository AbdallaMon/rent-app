import { runAllReminders } from "@/services/server/whatsapp/cron-jobs/reminderService";

export async function GET(request, { params }) {
  try {
    const key = request.headers.get("x-cron-key");
    if (!key || key !== process.env.CRON_SECRET) {
      //# throuh error
      throw new Error("KEYS ARE NOT MATCHED");
    }
    const data = await runAllReminders();
    return Response.json({
      ...data,
    });
  } catch (e) {
    console.log(e);
    return Response.json({
      status: 500,
      message: e.message,
    });
  }
}

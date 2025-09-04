import { getWhatsappStats } from "@/services/server/whatsapp/dashboard/get-data";

import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  getService: getWhatsappStats,
});

export const GET = handler.GET;

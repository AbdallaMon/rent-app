import { getWhatsAppSettings } from "@/services/server/whatsapp/dashboard/get-data";
import { saveWhatsAppSettings } from "@/services/server/whatsapp/dashboard/actions";

import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  getService: getWhatsAppSettings,
  postService: saveWhatsAppSettings,
});

export const GET = handler.GET;
export const POST = handler.POST;

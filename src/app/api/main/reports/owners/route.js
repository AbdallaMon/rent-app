import { createHandler } from "@/app/api/handler";
import { getOwnersReport } from "@/services/server/reports";

const handler = createHandler({
  getService: getOwnersReport,
});

export const GET = handler.GET;

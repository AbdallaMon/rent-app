import { createHandler } from "@/app/api/handler";
import { getReports } from "@/services/server/reports";

const handler = createHandler({
  getService: getReports,
});

export const GET = handler.GET;

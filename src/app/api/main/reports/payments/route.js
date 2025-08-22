import { createHandler } from "@/app/api/handler";
import { getPaymentsReport } from "@/services/server/reports";

const handler = createHandler({
  getService: getPaymentsReport,
});

export const GET = handler.GET;

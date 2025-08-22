import { createHandler } from "@/app/api/handler";
import { getTaxPaymentsReport } from "@/services/server/reports";

const handler = createHandler({
  getService: getTaxPaymentsReport,
});

export const GET = handler.GET;

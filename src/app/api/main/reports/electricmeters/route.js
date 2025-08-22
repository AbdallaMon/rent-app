import { createHandler } from "@/app/api/handler";
import { getElectricMetersReports } from "@/services/server/reports";

const handler = createHandler({
  getService: getElectricMetersReports,
});

export const GET = handler.GET;

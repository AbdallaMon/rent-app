import { createHandler } from "@/app/api/handler";
import { getMaintenanceReports, getReports } from "@/services/server/reports";

const handler = createHandler({
  getService: getMaintenanceReports,
});

export const GET = handler.GET;

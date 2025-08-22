import { createHandler } from "@/app/api/handler";
import { getRentedUnitsReport } from "@/services/server/reports";

const handler = createHandler({
  getService: getRentedUnitsReport,
});

export const GET = handler.GET;

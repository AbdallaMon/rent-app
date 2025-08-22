import { createHandler } from "@/app/api/handler";
import {
  getMaintenanceContracts,
  getMaintenances,
} from "@/services/server/maintenance";

const handler = createHandler({
  getService: getMaintenanceContracts,
});

export const GET = handler.GET;

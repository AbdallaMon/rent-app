import { createHandler } from "@/app/api/handler";

import {
  deleteMaintenance,
  getMaintenanceById,
} from "@/services/server/maintenance";

const handler = createHandler({
  deleteService: deleteMaintenance,
  getService: getMaintenanceById,
});

export const PUT = handler.PUT;
export const DELETE = handler.DELETE;
export const GET = handler.GET;

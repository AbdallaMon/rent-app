import { createHandler } from "@/app/api/handler";

import {
  deleteMaintenance,
  getMaintenanceById, updateMaintenance,
} from "@/services/server/maintenance";

const handler = createHandler({
  deleteService: deleteMaintenance,
  getService: getMaintenanceById,
  putService: updateMaintenance,
});

export const PUT = handler.PUT;
export const DELETE = handler.DELETE;
export const GET = handler.GET;

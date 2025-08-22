import { deleteBank, updateBank } from "@/services/server/settings";

import { createHandler } from "@/app/api/handler";
import { deleteUnit, getUnitById, updateUnit } from "@/services/server/units";

const handler = createHandler({
  deleteService: deleteUnit,
  putService: updateUnit,
  getService: getUnitById,
});

export const PUT = handler.PUT;
export const DELETE = handler.DELETE;
export const GET = handler.GET;

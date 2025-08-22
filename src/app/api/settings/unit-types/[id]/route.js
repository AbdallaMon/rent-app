import { deleteUnitType, updateUnitType } from "@/services/server/settings";

import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  deleteService: deleteUnitType,
  putService: updateUnitType,
});

export const PUT = handler.PUT;
export const DELETE = handler.DELETE;

import { deleteDistrict, updateDistrict } from "@/services/server/settings";

import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  deleteService: deleteDistrict,
  putService: updateDistrict,
});

export const PUT = handler.PUT;
export const DELETE = handler.DELETE;

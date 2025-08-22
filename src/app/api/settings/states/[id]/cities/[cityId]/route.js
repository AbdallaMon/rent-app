import { deleteCity, updateCity } from "@/services/server/settings";

import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  deleteService: deleteCity,
  putService: updateCity,
});

export const PUT = handler.PUT;
export const DELETE = handler.DELETE;

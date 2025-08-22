import {
  deletePropertyType,
  updatePropertyType,
} from "@/services/server/settings";

import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  deleteService: deletePropertyType,
  putService: updatePropertyType,
});

export const PUT = handler.PUT;
export const DELETE = handler.DELETE;

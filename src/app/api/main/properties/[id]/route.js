import { createHandler } from "@/app/api/handler";
import {
  deleteProperty,
  getPropertyById,
  updateProperty,
} from "@/services/server/properties";

const handler = createHandler({
  deleteService: deleteProperty,
  putService: updateProperty,
  getService: getPropertyById,
});

export const PUT = handler.PUT;
export const DELETE = handler.DELETE;
export const GET = handler.GET;

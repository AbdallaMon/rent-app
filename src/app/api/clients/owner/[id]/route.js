import { createHandler } from "@/app/api/handler";
import {
  deleteOwner,
  getOwnerById,
  updateOwner,
} from "@/services/server/clients";

const handler = createHandler({
  deleteService: deleteOwner,
  putService: updateOwner,
  getService: getOwnerById,
});

export const PUT = handler.PUT;
export const DELETE = handler.DELETE;
export const GET = handler.GET;

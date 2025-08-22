import { createHandler } from "@/app/api/handler";
import {
  deleteRenter,
  updateRenter,
  getRenterById,
} from "@/services/server/clients";

const handler = createHandler({
  deleteService: deleteRenter,
  putService: updateRenter,
  getService: getRenterById,
});

export const PUT = handler.PUT;
export const DELETE = handler.DELETE;
export const GET = handler.GET;

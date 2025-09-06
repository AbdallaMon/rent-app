import { createHandler } from "@/app/api/handler";
import {
  updateComplaint,
  deleteComplaint,
} from "../../../../../services/server/requests/actions";
import { getComplaintById } from "@/services/server/requests/get-data";

const handler = createHandler({
  getService: getComplaintById,
  putService: updateComplaint,
  deleteService: deleteComplaint,
});

export const GET = handler.GET;
export const DELETE = handler.DELETE;
export const PUT = handler.PUT;

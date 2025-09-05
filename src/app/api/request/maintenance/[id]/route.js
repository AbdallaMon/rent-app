import { createHandler } from "@/app/api/handler";
import { getMaintenenaceRequestById } from "../../../../../services/server/requests/get-data";
import {
  updateMaintenanceReqeust,
  deleteMaintenenceReqeust,
} from "../../../../../services/server/requests/actions";

const handler = createHandler({
  getService: getMaintenenaceRequestById,
  putService: updateMaintenanceReqeust,
  deleteService: deleteMaintenenceReqeust,
});

export const GET = handler.GET;
export const DELETE = handler.DELETE;
export const PUT = handler.PUT;

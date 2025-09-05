import { createHandler } from "@/app/api/handler";
import { getMaintenanceRequests } from "@/services/server/requests/get-data";
import { createMaintenanceReqeust } from "@/services/server/requests/actions";

const handler = createHandler({
  getService: getMaintenanceRequests,
  postService: createMaintenanceReqeust,
});

export const GET = handler.GET;
export const POST = handler.POST;

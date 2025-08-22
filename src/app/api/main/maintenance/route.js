import { createHandler } from "@/app/api/handler";
import {
  createMaintenance,
  getMaintenances,
} from "@/services/server/maintenance";

const handler = createHandler({
  postService: createMaintenance,
  getService: getMaintenances,
});

export const POST = handler.POST;
export const GET = handler.GET;

import { createHandler } from "@/app/api/handler";
import {
  createUnits,
  getUnitsByPropertyId,
} from "@/services/server/properties";

const handler = createHandler({
  getService: getUnitsByPropertyId,
  postService: createUnits,
});

export const GET = handler.GET;
export const POST = handler.POST;

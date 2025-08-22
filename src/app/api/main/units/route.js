import { createHandler } from "@/app/api/handler";
import { createUnit, getUnits } from "@/services/server/units";

const handler = createHandler({
  getService: getUnits,
  postService: createUnit,
});

export const GET = handler.GET;
export const POST = handler.POST;

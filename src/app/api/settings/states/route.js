import { createState, getStates } from "@/services/server/settings";
import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  getService: getStates,
  postService: createState,
});

export const GET = handler.GET;
export const POST = handler.POST;

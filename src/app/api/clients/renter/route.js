import { createHandler } from "@/app/api/handler";
import { createRenter, getRenters } from "@/services/server/clients";

const handler = createHandler({
  getService: getRenters,
  postService: createRenter,
});

export const GET = handler.GET;
export const POST = handler.POST;

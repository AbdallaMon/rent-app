import { createHandler } from "@/app/api/handler";
import { createOwner, getOwners } from "@/services/server/clients";

const handler = createHandler({
  getService: getOwners,
  postService: createOwner,
});

export const GET = handler.GET;
export const POST = handler.POST;

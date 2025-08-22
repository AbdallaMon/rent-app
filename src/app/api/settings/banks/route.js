import { createBank, getBanks } from "@/services/server/settings";

import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  getService: getBanks,
  postService: createBank,
});

export const GET = handler.GET;
export const POST = handler.POST;

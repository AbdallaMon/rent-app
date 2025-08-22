import { createCollector, getCollectors } from "@/services/server/settings";

import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  getService: getCollectors,
  postService: createCollector,
});

export const GET = handler.GET;
export const POST = handler.POST;

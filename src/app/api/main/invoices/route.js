import { createHandler } from "@/app/api/handler";

import { getInvioces } from "@/services/server/invioces";

const handler = createHandler({
  getService: getInvioces,
});

export const GET = handler.GET;

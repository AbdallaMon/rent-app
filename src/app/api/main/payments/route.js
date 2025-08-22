import { createHandler } from "@/app/api/handler";

import { getRentPaymentsForCurrentMonth } from "@/services/server/payments";

const handler = createHandler({
  getService: getRentPaymentsForCurrentMonth,
});

export const GET = handler.GET;

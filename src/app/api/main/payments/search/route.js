import { createHandler } from "@/app/api/handler";
import { getSearchedPayments } from "@/services/server/payments";

const handler = createHandler({
  getService: getSearchedPayments,
});

export const GET = handler.GET;

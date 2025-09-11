import { createHandler } from "@/app/api/handler";

import {
  createBillingInvoice,
  getBillingInvoice,
} from "@/services/server/invioces";

const handler = createHandler({
  getService: getBillingInvoice,
  postService: createBillingInvoice,
});

export const GET = handler.GET;
export const POST = handler.POST;

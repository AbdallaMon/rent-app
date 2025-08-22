import { createHandler } from "@/app/api/handler";

import { updateInvoice } from "@/services/server/invioces";

const handler = createHandler({
  putService: updateInvoice,
});

export const PUT = handler.PUT;

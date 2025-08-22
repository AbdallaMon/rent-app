import { createHandler } from "@/app/api/handler";
import { createInvoice } from "@/services/server/invioces";

const handler = createHandler({
  postService: createInvoice,
});

export const POST = handler.POST;

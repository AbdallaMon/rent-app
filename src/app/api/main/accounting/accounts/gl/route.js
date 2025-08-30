import { createHandler } from "@/app/api/handler";
import { createGlAccount } from "@/services/server/accounting/actions";

const handler = createHandler({
  postService: createGlAccount,
});

export const DELETE = handler.DELETE;

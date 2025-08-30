import { createHandler } from "@/app/api/handler";
import { deleteGlAccount } from "@/services/server/accounting/actions";

const handler = createHandler({
  deleteService: deleteGlAccount,
});

export const DELETE = handler.DELETE;

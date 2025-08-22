import { createHandler } from "@/app/api/handler";

import {
  createNewBankAccount,
  updatePayment,
} from "@/services/server/payments";

const handler = createHandler({
  putService: updatePayment,
  postService: createNewBankAccount,
});

export const PUT = handler.PUT;

export const POST = handler.POST;
export const GET = handler.GET;

import { createHandler } from "@/app/api/handler";
import { getAccountsBalance } from "@/services/server/accounting/get-data";
import { handleGlAccountTransaction } from "@/services/server/accounting/actions";

const handler = createHandler({
  getService: getAccountsBalance,
  postService: handleGlAccountTransaction,
});

export const GET = handler.GET;
export const POST = handler.POST;

import { createHandler } from "@/app/api/handler";
import { getSecurityDeposits } from "@/services/server/deposits/get-data";
import { createDeposit } from "@/services/server/deposits/actions";

const handler = createHandler({
  getService: getSecurityDeposits,
  postService: createDeposit,
});

export const GET = handler.GET;
export const POST = handler.POST;

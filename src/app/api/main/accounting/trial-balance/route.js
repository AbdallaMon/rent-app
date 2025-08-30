import { createHandler } from "@/app/api/handler";
import { getTrialBalance } from "../../../../../services/server/accounting/get-data";

const handler = createHandler({
  getService: getTrialBalance,
  //   postService: createProperty,
});

export const GET = handler.GET;
export const POST = handler.POST;

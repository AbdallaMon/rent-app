import { createHandler } from "@/app/api/handler";
import { getJournals } from "../../../../../services/server/accounting/get-data";

const handler = createHandler({
  getService: getJournals,
  //   postService: createProperty,
});

export const GET = handler.GET;
export const POST = handler.POST;

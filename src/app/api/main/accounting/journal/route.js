import { createHandler } from "@/app/api/handler";
import { getJournalsEntries } from "@/services/server/accounting/get-data";

const handler = createHandler({
  getService: getJournalsEntries,
  //   postService: createProperty,
});

export const GET = handler.GET;
export const POST = handler.POST;

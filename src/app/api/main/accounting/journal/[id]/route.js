import { createHandler } from "@/app/api/handler";
import { getJournalLineById } from "@/services/server/accounting/get-data";

const handler = createHandler({
  getService: getJournalLineById,
  //   postService: createProperty,
});

export const GET = handler.GET;
export const POST = handler.POST;

import { createHandler } from "@/app/api/handler";
import { getJournalEntryById } from "@/services/server/accounting/get-data";

const handler = createHandler({
  getService: getJournalEntryById,
  //   postService: createProperty,
});

export const GET = handler.GET;
export const POST = handler.POST;

import { createHandler } from "@/app/api/handler";
import { getPettyCashJournalEntries } from "@/services/server/accounting/get-data";

const handler = createHandler({
  getService: getPettyCashJournalEntries,
  //   postService: createProperty,
});

export const GET = handler.GET;
export const POST = handler.POST;

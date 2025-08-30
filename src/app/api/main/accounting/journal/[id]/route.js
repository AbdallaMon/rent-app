import { createHandler } from "@/app/api/handler";
import { deleteAJournalEntry } from "@/services/server/accounting/actions";
import { getJournalLineById } from "@/services/server/accounting/get-data";

const handler = createHandler({
  getService: getJournalLineById,
  deleteService: deleteAJournalEntry,
  //   postService: createProperty,
});

export const GET = handler.GET;
export const DELETE = handler.DELETE;
export const POST = handler.POST;

import { createHandler } from "@/app/api/handler";
import { getCompliants } from "@/services/server/requests/get-data";
import { createComplaint } from "@/services/server/requests/actions";

const handler = createHandler({
  getService: getCompliants,
  postService: createComplaint,
});

export const GET = handler.GET;
export const POST = handler.POST;

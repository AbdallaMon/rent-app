import { createHandler } from "@/app/api/handler";
import { getLedgar } from "../../../../../services/server/accounting/get-data";

const handler = createHandler({
  getService: getLedgar,
});

export const GET = handler.GET;

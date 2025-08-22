import { createHandler } from "@/app/api/handler";
import { getClients } from "@/services/server/clients";

const handler = createHandler({
  getService: getClients,
});

export const GET = handler.GET;

// File: /src/app/api/main/home/expiredContracts/route.js
import { createHandler } from "@/app/api/handler";
import { getExpiredContracts } from "@/services/server/getExpiredContracts";


const handler = createHandler({
  getService: getExpiredContracts,
});

export const GET = handler.GET;

// File: /src/app/api/main/home/recentMaintenances/route.js
import { createHandler } from "@/app/api/handler";
import { getRecentMaintenances } from "@/services/server/getRecentMaintenances";


const handler = createHandler({
  getService: getRecentMaintenances,
});

export const GET = handler.GET;

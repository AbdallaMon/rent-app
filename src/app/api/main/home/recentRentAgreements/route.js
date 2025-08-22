// File: /src/app/api/main/home/recentRentAgreements/route.js
import { createHandler } from "@/app/api/handler";
import { getRecentRentAgreements } from "@/services/server/getRecentRentAgreements";


const handler = createHandler({
  getService: getRecentRentAgreements,
});

export const GET = handler.GET;

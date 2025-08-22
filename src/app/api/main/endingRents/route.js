import { createHandler } from "@/app/api/handler"; 
import { getEndingRentAgreements } from "@/services/server/rentAgreements";

const handler = createHandler({
  getService: getEndingRentAgreements,
});

export const GET = handler.GET;

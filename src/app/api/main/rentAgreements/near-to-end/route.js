import { createHandler } from "@/app/api/handler";
import { getNearToEndRentAgreements } from "@/services/server/rentAgreements";

const handler = createHandler({
  getService: getNearToEndRentAgreements,
});

export const GET = handler.GET;

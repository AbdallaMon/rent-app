import { createHandler } from "@/app/api/handler";
import { getEndedRentAgreementsWhichNeedToBeRenewed } from "@/services/server/rentAgreements";
const handler = createHandler({
  getService: getEndedRentAgreementsWhichNeedToBeRenewed,
});

export const GET = handler.GET;

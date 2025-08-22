import { createHandler } from "@/app/api/handler";
import { updateRentAgreementInstallmentsPaymentsData } from "@/services/server/rentAgreements";

const handler = createHandler({
  postService: updateRentAgreementInstallmentsPaymentsData,
});

export const POST = handler.POST;

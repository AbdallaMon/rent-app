import { createHandler } from "@/app/api/handler";
import {
  createInstallmentsAndPayments,
  getRentAgreementPaymentsForInstallments,
} from "@/services/server/rentAgreements";

const handler = createHandler({
  postService: createInstallmentsAndPayments,
  getService: getRentAgreementPaymentsForInstallments,
});

export const POST = handler.POST;
export const GET = handler.GET;

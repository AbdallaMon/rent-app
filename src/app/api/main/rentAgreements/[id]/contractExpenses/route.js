import { createHandler } from "@/app/api/handler";
import {
  createContractExpensePayments,
  getRentAgreementPaymentForContractExpences,
} from "@/services/server/rentAgreements";

const handler = createHandler({
  postService: createContractExpensePayments,
  getService: getRentAgreementPaymentForContractExpences,
});

export const POST = handler.POST;
export const GET = handler.GET;

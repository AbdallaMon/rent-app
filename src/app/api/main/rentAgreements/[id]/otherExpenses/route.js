import { createHandler } from "@/app/api/handler";
import {
  createOtherExpensePayments,
  getRentAgreementPaymentForOthersExpences,
} from "@/services/server/rentAgreements";

const handler = createHandler({
  postService: createOtherExpensePayments,
  getService: getRentAgreementPaymentForOthersExpences,
});

export const POST = handler.POST;
export const GET = handler.GET;

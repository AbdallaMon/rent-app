import { createHandler } from "@/app/api/handler";
import {
  createFeePayments,
  gentRentAgreementPaymentsForFees,
} from "@/services/server/rentAgreements";

const handler = createHandler({
  postService: createFeePayments,
  getService: gentRentAgreementPaymentsForFees,
});

export const POST = handler.POST;
export const GET = handler.GET;

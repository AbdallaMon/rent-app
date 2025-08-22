import {
  createRentAgreementType,
  getRentAgreementTypes,
} from "@/services/server/settings";
import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  getService: getRentAgreementTypes,
  postService: createRentAgreementType,
});

export const GET = handler.GET;
export const POST = handler.POST;

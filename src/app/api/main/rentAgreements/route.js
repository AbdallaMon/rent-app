import { createHandler } from "@/app/api/handler";
import {
  createRentAgreement,
  getRentAgreements,
} from "@/services/server/rentAgreements";

const handler = createHandler({
  getService: getRentAgreements,
  postService: createRentAgreement,
});

export const GET = handler.GET;
export const POST = handler.POST;

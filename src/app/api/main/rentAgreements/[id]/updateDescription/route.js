import { createHandler } from "@/app/api/handler";
import { updateRentAgreementDescription } from "@/services/server/rentAgreements";

const handler = createHandler({
  postService: updateRentAgreementDescription,
});

export const POST = handler.POST;

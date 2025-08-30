import { createHandler } from "@/app/api/handler";
import {
  deleteADeposit,
  refundDeposit,
} from "@/services/server/deposits/actions";

const handler = createHandler({
  postService: refundDeposit,
  deleteService: deleteADeposit,
});

export const POST = handler.POST;
export const DELETE = handler.DELETE;

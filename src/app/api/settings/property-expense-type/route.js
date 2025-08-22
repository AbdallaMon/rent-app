import { createHandler } from "@/app/api/handler";
import {
  createPropertyExpenseType,
  getPropertyExpenseTypes,
} from "@/services/server/settings";

const handler = createHandler({
  getService: getPropertyExpenseTypes,
  postService: createPropertyExpenseType,
});

export const GET = handler.GET;
export const POST = handler.POST;

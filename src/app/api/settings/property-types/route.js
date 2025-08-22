import {
  createPropertyType,
  getPropertyTypes,
} from "@/services/server/settings";

import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  getService: getPropertyTypes,
  postService: createPropertyType,
});

export const GET = handler.GET;
export const POST = handler.POST;

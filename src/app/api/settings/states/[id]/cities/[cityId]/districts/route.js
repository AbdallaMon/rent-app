import { createDistrict, getDistricts } from "@/services/server/settings";
import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  getService: getDistricts,
  postService: createDistrict,
});

export const GET = handler.GET;
export const POST = handler.POST;

import { createCity, getCities } from "@/services/server/settings";
import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  getService: getCities,
  postService: createCity,
});

export const GET = handler.GET;
export const POST = handler.POST;

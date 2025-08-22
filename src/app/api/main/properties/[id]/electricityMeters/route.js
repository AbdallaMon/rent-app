import { createHandler } from "@/app/api/handler";
import { createElectricityMeters } from "@/services/server/properties";

const handler = createHandler({
  postService: createElectricityMeters,
});

export const POST = handler.POST;

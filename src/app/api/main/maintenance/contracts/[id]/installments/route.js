import { createHandler } from "@/app/api/handler";
import { createMaintenenceInstallmentsAndPayments } from "@/services/server/maintenance";

const handler = createHandler({
  postService: createMaintenenceInstallmentsAndPayments,
});

export const POST = handler.POST;

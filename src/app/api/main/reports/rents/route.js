import { createHandler } from "@/app/api/handler";
import {
  getRentAgreementsReports,
} from "@/services/server/reports";

const handler = createHandler({
  getService: getRentAgreementsReports,
});

export const GET = handler.GET;

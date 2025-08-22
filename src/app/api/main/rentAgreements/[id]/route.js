import { createHandler } from "@/app/api/handler";
import {
  deleteRentAgreement,
  getRentAgreementById,
  updateRentAgreement,
} from "@/services/server/rentAgreements";

const handler = createHandler({
  deleteService: deleteRentAgreement,
  putService: updateRentAgreement,
  getService: getRentAgreementById,
});

export const PUT = handler.PUT;
export const DELETE = handler.DELETE;
export const GET = handler.GET;

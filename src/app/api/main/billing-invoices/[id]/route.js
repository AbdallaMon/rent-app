import { createHandler } from "@/app/api/handler";

import {
  deleteBillingInvoice,
  getBillingInvoiceById,
  updateBillingInvoice,
} from "@/services/server/invioces";

const handler = createHandler({
  putService: updateBillingInvoice,
  getService: getBillingInvoiceById,
  deleteService: deleteBillingInvoice,
});
export const GET = handler.GET;
export const PUT = handler.PUT;
export const DELETE = handler.DELETE;

import { createHandler } from "@/app/api/handler";
import {
  deleteContractExpense,
  updateContractExpense,
} from "@/services/server/settings";

const handler = createHandler({
  deleteService: deleteContractExpense,
  putService: updateContractExpense,
});

export const PUT = handler.PUT;
export const DELETE = handler.DELETE;

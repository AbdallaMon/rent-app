import { updateUser, deleteUser } from "@/services/server/settings";
import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  putService: updateUser,
  deleteService: deleteUser,
});

export const PUT = handler.PUT;
export const DELETE = handler.DELETE;
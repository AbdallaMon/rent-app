import {
  createState,
  createUser,
  getAllPrivileges,
  getAllUsers,
  getStates,
} from "@/services/server/settings";
import { createHandler } from "@/app/api/handler";

const handler = createHandler({
  getService: getAllPrivileges,
});

export const GET = handler.GET;

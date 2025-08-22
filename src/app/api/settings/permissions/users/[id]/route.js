import {assignPropertiesToUser} from "@/services/server/settings";

import {createHandler} from "@/app/api/handler";

const handler = createHandler({
    putService: assignPropertiesToUser,
});

export const PUT = handler.PUT;

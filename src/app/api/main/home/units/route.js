import {createHandler} from "@/app/api/handler";
import {getUnits} from "@/services/server/main";

const handler = createHandler({
    getService: getUnits,
});

export const GET = handler.GET;

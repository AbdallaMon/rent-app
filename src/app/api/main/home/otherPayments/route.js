import {createHandler} from "@/app/api/handler";
import {getOtherPayments} from "@/services/server/main";

const handler = createHandler({
    getService: getOtherPayments,
});

export const GET = handler.GET;

import {createHandler} from "@/app/api/handler";
import {getRentPayments} from "@/services/server/main";

const handler = createHandler({
    getService: getRentPayments,
});

export const GET = handler.GET;

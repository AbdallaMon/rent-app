import {createHandler} from "@/app/api/handler";
import {getCurrentMonthPayments} from "@/services/server/main";

const handler = createHandler({
    getService: getCurrentMonthPayments,
});

export const GET = handler.GET;

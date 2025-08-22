import {createHandler} from "@/app/api/handler";
import {getCurrentMonthOtherPayments} from "@/services/server/main";

const handler = createHandler({
    getService: getCurrentMonthOtherPayments,
});

export const GET = handler.GET;

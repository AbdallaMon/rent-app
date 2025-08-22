import {createHandler} from "@/app/api/handler";
import {getCurrentMonthMaintenancePayments} from "@/services/server/main";

const handler = createHandler({
    getService: getCurrentMonthMaintenancePayments,
});

export const GET = handler.GET;

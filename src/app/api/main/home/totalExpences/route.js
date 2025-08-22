import {createHandler} from "@/app/api/handler";
import {getMaintenancePayments} from "@/services/server/main";

const handler = createHandler({
    getService: getMaintenancePayments,
});

export const GET = handler.GET;

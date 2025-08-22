import {createHandler} from "@/app/api/handler";
import {getUnitsReports} from "@/services/server/reports";

const handler = createHandler({
    getService: getUnitsReports,
});

export const GET = handler.GET;

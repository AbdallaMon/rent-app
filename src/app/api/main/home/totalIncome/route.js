import {createHandler} from "@/app/api/handler";
import {getTotalIncome} from "@/services/server/home";

const handler = createHandler({
    getService: getTotalIncome,
});

export const GET = handler.GET;

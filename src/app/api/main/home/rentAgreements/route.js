import {createHandler} from "@/app/api/handler";
import {getRentAgreements} from "@/services/server/main";

const handler = createHandler({
    getService: getRentAgreements,
});

export const GET = handler.GET;

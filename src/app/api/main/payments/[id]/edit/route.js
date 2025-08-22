import { createHandler } from "@/app/api/handler";

import {
     updatePaymentMethodType,
} from "@/services/server/payments";

const handler = createHandler({
    postService: updatePaymentMethodType,
});


export const POST = handler.POST;

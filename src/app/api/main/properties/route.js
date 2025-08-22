import {createHandler} from "@/app/api/handler";
import {createProperty, getProperties} from "@/services/server/properties";

const handler = createHandler({
    getService: getProperties,
    postService: createProperty,
});

export const GET = handler.GET;
export const POST = handler.POST;

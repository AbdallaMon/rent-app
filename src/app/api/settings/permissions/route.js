import {createUser, getAllUsers,} from "@/services/server/settings";
import {createHandler} from "@/app/api/handler";

const handler = createHandler({
    getService: getAllUsers,
    postService: createUser,
});

export const GET = handler.GET;
export const POST = handler.POST;

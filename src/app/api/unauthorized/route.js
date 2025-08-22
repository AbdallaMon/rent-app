export async function GET(req, res) {
    return Response.json({
        message: "unauthorized",
        status: 401
    }, {status: 401})
}

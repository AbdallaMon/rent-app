import {
  getAttachments,
  createAttachment,
} from "@/services/server/attachments";

export async function GET(request, { params }) {
  const { searchParams } = request.nextUrl;
  let page = searchParams.get("page");
  let limit = searchParams.get("limit");
  page = page ? Number(page) : 1;
  limit = limit ? Number(limit) : 10;
  try {
    const data = await getAttachments(page, limit, searchParams, params);
    return Response.json({
      ...data,
    });
  } catch (e) {
    console.log(e);
    return Response.json({
      status: 500,
      message: e.message,
    });
  }
}

export async function POST(request, { params }) {
  try {
    const data = await request.json();
    console.log(data, "data from bost");
    const req = await createAttachment(data, params);
    return Response.json({
      data: req.data ? req.data : req,
      message: req.message ? req.message : "تم الإضافة بنجاح",
      status: 200,
    });
  } catch (e) {
    console.log(e.message);
    return Response.json({
      status: 500,
      message: e.message,
    });
  }
}

import { deleteAttachment } from "@/services/server/attachments";

export async function DELETE(request, { params }) {
  const { attachmentId } = params;

  try {
    const req = await deleteAttachment(+attachmentId);
    return Response.json({
      data: req,
      message: "تم الحذف بنجاح",
      status: 200,
    });
  } catch (e) {
    console.log(e);

    return Response.json({
      status: 500,
      message: e.message,
    });
  }
}

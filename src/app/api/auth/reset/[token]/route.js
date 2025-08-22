import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export async function POST(request, { params }) {
  let body = await request.json();
  const { token } = params;

  try {
    const user = await prisma.user.findUnique({
      where: {
        resetPasswordToken: token,
      },
    });
    if (!user || Date.now() > user.resetPasswordExpires) {
      return Response.json({
        status: 500,
        message: " انتهت صلاحية الرابط او الرابط غير صحيح",
      });
    }

    const hashedPassword = bcrypt.hashSync(body.password, 8);

    await prisma.user.update({
      where: {
        resetPasswordToken: token,
      },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return Response.json({
      status: 200,
      message: "   تم تغيير كلمة السر بنجاح قم بتسجيل الدخول",
    });
  } catch (error) {
    console.log(error);
    return Response.json({
      status: 500,
      message: "حدثت مشكلة اثناء تسجيل الدخول   " + error.message,
    });
  }
}

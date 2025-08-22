import {cookies} from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET() {
    const SECRET_KEY = process.env.SECRET_KEY;
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
        return Response.json({auth: false, message: "No token provided"});
    }
    try {
        const currentTime = Math.floor(Date.now() / 1000);
        const decoded = jwt.verify(token, SECRET_KEY);        if (decoded.exp < currentTime) {
            return Response.json({
                message: "انتهت الجلسه من فضلك  قم بتسجيل الدخول مره اخري ",
                auth: false,
            });
        }
        if (decoded) {
            const user = await prisma.user.findUnique({
                where: {
                    id: decoded.userId,
                },
                include: {
                    privileges: {
                        include: {
                            privilege: true,
                        },
                    },
                },
            });
            if (!user) {
                return Response.json({
                    message: "المستخدم غير موجود",
                    auth: false,
                });
            }
            return Response.json({
                message: "تم تسجيل الدخول بنجاح، جاري تحميل الصفحة",
                user,
                auth: true,
            });
        }
    } catch (error) {
        console.log(error, "error");
        return Response.json({
            message: "خطأ في تسجيل الدخول",
            error: error.message,
            auth: false,
        });
    }
}

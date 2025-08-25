import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { checkIfIdAllowed } from "@/app/api/utlis/userProperties";

export async function middleware(request) {
  try {
    // التأكد من وجود SECRET_KEY
    if (!process.env.SECRET_KEY) {
      console.error("SECRET_KEY غير موجود في متغيرات البيئة");
      return NextResponse.redirect(new URL("/api/unauthorized", request.url));
    }

    const SECRET_KEY = new TextEncoder().encode(process.env.SECRET_KEY);
    const cookieStore = cookies();

    const token = cookieStore.get("token")?.value;

    if (!token) {
      console.log("لا يوجد token في الـ cookies");
      throw new Error("No token provided");
    }

    // التحقق من صحة الـ token
    let payload;
    try {
      const verified = await jwtVerify(token, SECRET_KEY);
      payload = verified.payload;
    } catch (jwtError) {
      console.log("خطأ في التحقق من JWT:", jwtError.message);
      throw new Error("Invalid token");
    }

    if (!payload || !payload.userId) {
      console.log("payload غير صحيح:", payload);
      throw new Error("Invalid payload");
    }

    // التحقق من صلاحيات الوصول للخصائص
    const currentPath = request.nextUrl.pathname;
    console.log(currentPath, "currentPath");
    if (currentPath.startsWith("/api/main/properties")) {
      const pathSegments = currentPath.split("/");
      let id;
      for (const segment of pathSegments) {
        if (!isNaN(segment) && segment !== "") {
          id = segment;
          break; // Exit the loop once the first number is found
        }
      }
      if (id) {
        try {
          const isAllowed = await checkIfIdAllowed(+id);
          if (!isAllowed) {
            console.log(
              `المستخدم ${payload.userId} غير مسموح له بالوصول للعقار ${id}`
            );
            throw new Error("No Allowed ");
          }
        } catch (permissionError) {
          console.log("خطأ في فحص الصلاحيات:", permissionError.message);
          throw new Error("Permission check failed");
        }
      }
    }

    // إضافة معلومات المستخدم إلى الـ headers للاستخدام في API
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId.toString());
    response.headers.set("x-user-role", payload.isAdmin ? "admin" : "user");

    return response;
  } catch (error) {
    console.log("خطأ في middleware:", error.message);

    // إعادة توجيه أفضل للأخطاء
    const baseUrl = request.nextUrl.origin;
    console.log("إعادة توجيه إلى:", baseUrl);
    return NextResponse.redirect(new URL("/api/unauthorized", baseUrl));
  }
}

export const config = {
  matcher: ["/api/main/:path*", "/api/clients/:path*"],
};

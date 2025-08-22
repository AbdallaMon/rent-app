import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendEmail } from "../../utlis/sendMail";

export async function POST(request) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.email) {
            return Response.json({
                status: 400,
                message: "Email is required",
            });
        }

        // Find the user by email
        const user = await prisma.user.findUnique({
            where: {
                email: body.email,
            },
        });

        if (!user) {
            return Response.json({
                status: 404,
                message: "No user found with this email",
            });
        }

        // Generate a reset token
        const token = crypto.randomBytes(20).toString("hex");

        // Update the user with the reset token and expiration time
        await prisma.user.update({
            where: {
                email: body.email,
            },
            data: {
                resetPasswordToken: token,
                resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour
            },
        });

        // Construct the reset link
        const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;

        // Email content (ensure these are resolved strings, not Promises)
        const emailSubject = "اعادة تعيين كلمة السر";
        const emailText = `اضغط علي الرابط لاعادة تعيين كلمة السر: ${resetLink}`;
        const emailHtml = `<p>اضغط علي الرابط لاعادة تعيين كلمة السر: <a href="${resetLink}">${resetLink}</a></p>`;

        // Send the email
        await sendEmail(body.email, emailSubject, emailHtml, emailText);

        return Response.json({
            status: 200,
            message: "تم ارسال رابط اعادة تعين كلمة السر الي  " + body.email,
        });
    } catch (error) {
        console.error("Error in password reset:", error);
        return Response.json({
            status: 500,
            message: "حدثت مشكلة اثناء اعادة تعيين كلمة السر",
        });
    } finally {
        await prisma.$disconnect();
    }
}

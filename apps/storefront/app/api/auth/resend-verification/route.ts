import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) return NextResponse.json({ success: true });

    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    if (process.env.RESEND_API_KEY) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
      const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@yourdomain.com";

      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "تأكيد بريدك الإلكتروني — Digital Plus",
        html: `
          <div dir="rtl" style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f5f3ff;border-radius:16px;">
            <h2 style="color:#7C3AED;margin-bottom:8px;">تأكيد البريد الإلكتروني</h2>
            <p style="color:#4B5563;">اضغط على الزر أدناه لتأكيد بريدك الإلكتروني والدخول إلى حسابك:</p>
            <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#7C3AED;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold;">
              تأكيد البريد الإلكتروني
            </a>
            <p style="color:#9CA3AF;font-size:12px;">الرابط صالح لمدة 24 ساعة. إذا لم تطلب هذا الرابط تجاهل هذه الرسالة.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Resend verification error:", e);
    return NextResponse.json({ error: "فشل إرسال البريد" }, { status: 500 });
  }
}

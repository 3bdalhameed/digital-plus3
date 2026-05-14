import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Resend } from "resend";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

async function sendVerificationEmail(email: string, name: string, token: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@yourdomain.com";

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: "تأكيد بريدك الإلكتروني",
    html: `
      <div dir="rtl" style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f5f3ff;border-radius:16px;">
        <h2 style="color:#7C3AED;margin-bottom:8px;">مرحباً ${name}!</h2>
        <p style="color:#4B5563;">شكراً لتسجيلك. اضغط على الزر أدناه لتأكيد بريدك الإلكتروني:</p>
        <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#7C3AED;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold;">
          تأكيد البريد الإلكتروني
        </a>
        <p style="color:#9CA3AF;font-size:12px;">الرابط صالح لمدة 24 ساعة. إذا لم تنشئ حساباً تجاهل هذه الرسالة.</p>
      </div>
    `,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "هذا البريد الإلكتروني مسجل مسبقاً" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let user: any;
    try {
      user = await prisma.user.create({
        data: { name, email, password: hashedPassword },
      });
    } catch (dbErr: any) {
      console.error("DB error:", dbErr?.message);
      if (dbErr?.message?.includes("does not exist") || dbErr?.code === "P1001") {
        return NextResponse.json({ error: "قاعدة البيانات غير مهيأة. يرجى التواصل مع الدعم." }, { status: 503 });
      }
      throw dbErr;
    }

    // Create verification token (24h expiry)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send verification email (non-blocking — don't fail registration if email fails)
    if (process.env.RESEND_API_KEY) {
      sendVerificationEmail(email, name, token).catch((e) =>
        console.error("Email send failed:", e)
      );
    }

    // Sync to Payload CMS customer
    try {
      const payloadRes = await fetch(`${process.env.PAYLOAD_API_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (payloadRes.ok) {
        const customer = await payloadRes.json();
        await prisma.user.update({
          where: { id: user.id },
          data: { payloadCustomerId: customer.doc?.id || customer.id },
        });
      }
    } catch (e) {
      console.error("Failed to create Payload customer:", e);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "حدث خطأ في إنشاء الحساب" }, { status: 500 });
  }
}

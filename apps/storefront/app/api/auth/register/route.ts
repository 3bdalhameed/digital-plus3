import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";

/**
 * POST /api/auth/register
 *
 * Simplified account creation:
 *   - email + password + optional name
 *   - password is bcrypt hashed (12 rounds)
 *   - account is marked emailVerified immediately so the user can log
 *     in right away. If you want a "click the link before you can log
 *     in" flow later, drop `emailVerified: new Date()` and switch to
 *     a Resend-sent verification token.
 *   - a welcome email is fire-and-forget (never blocks registration)
 *
 * Response: { success: true } on 201, { error } on 4xx/5xx.
 */
const registerSchema = z.object({
  name:     z.string().trim().max(120).optional(),
  email:    z.string().email(),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

async function sendWelcomeEmail(email: string, name: string) {
  if (!resend) return;
  const from = process.env.RESEND_FROM_EMAIL || "noreply@digital-plus3.com";
  try {
    await resend.emails.send({
      from,
      to: email,
      subject: "مرحباً بك في ديجيتال بلس",
      html: `
        <div dir="rtl" style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f5f3ff;border-radius:16px;">
          <h2 style="color:#7C3AED;margin-bottom:8px;">مرحباً ${name}!</h2>
          <p style="color:#4B5563;">تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول والاستفادة من عروضنا.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[register] welcome email failed:", e);
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }

  const email = normalizeEmail(parsed.data.email);
  if (!email) {
    return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
  }

  const name = parsed.data.name?.trim() || email.split("@")[0];

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل مسبقاً" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        // Emailed verification link removed for now -- verify on create
        // so the visitor can go straight to /login and sign in without
        // an extra round-trip.
        emailVerified: new Date(),
      },
    });

    // Fire-and-forget welcome email.
    sendWelcomeEmail(email, name).catch(() => {});

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (err: any) {
    console.error("[register] failed:", err?.message);
    if (err?.code === "P1001") {
      return NextResponse.json(
        { error: "قاعدة البيانات غير متاحة، يرجى المحاولة لاحقاً" },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الحساب" },
      { status: 500 },
    );
  }
}

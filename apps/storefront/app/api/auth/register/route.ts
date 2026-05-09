import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل مسبقاً" },
        { status: 409 }
      );
    }

    // Hash password and create user
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

    // Also create a matching customer record in Payload CMS
    try {
      const payloadRes = await fetch(
        `${process.env.PAYLOAD_API_URL}/customers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name }),
        }
      );
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
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء الحساب" },
      { status: 500 }
    );
  }
}

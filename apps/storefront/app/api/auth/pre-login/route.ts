import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ status: "invalid_credentials" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return NextResponse.json({ status: "invalid_credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ status: "invalid_credentials" });

    if (!user.emailVerified) return NextResponse.json({ status: "email_not_verified" });

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "invalid_credentials" });
  }
}

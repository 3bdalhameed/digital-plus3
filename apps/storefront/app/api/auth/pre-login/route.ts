import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

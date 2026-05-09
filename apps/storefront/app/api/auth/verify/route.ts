import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
  }

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!record) {
    return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    });
    return NextResponse.redirect(new URL("/login?error=link-expired", req.url));
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token } },
  });

  return NextResponse.redirect(new URL("/login?verified=true", req.url));
}

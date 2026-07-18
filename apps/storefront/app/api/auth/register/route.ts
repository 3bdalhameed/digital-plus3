import { NextResponse } from "next/server";

/**
 * Legacy registration endpoint. The site no longer supports password
 * signup -- account creation happens automatically inside the OTP
 * provider on first successful code verify (see lib/auth.ts). Kept
 * this file as a 410 stub so any client still POSTing here gets a
 * clear response instead of 404 → generic error banner.
 */
export function POST() {
  return NextResponse.json(
    {
      error:
        "التسجيل بكلمة مرور غير متاح — استخدم رمز التحقق بالبريد الإلكتروني (OTP).",
    },
    { status: 410 },
  );
}

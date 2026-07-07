import { NextRequest, NextResponse } from "next/server";
import { verifyOtp, signGuestToken } from "@/lib/otp";

/**
 * POST /api/auth/otp/verify
 * Body: { email: string, code: string }
 *
 * Verifies a 6-digit OTP previously issued by /api/auth/otp/request
 * and, on success, returns a short-lived guest-checkout token so an
 * unauthenticated visitor can complete a purchase without full
 * registration. Client stores the token in state and includes it in
 * the subsequent /api/checkout/* POST body.
 *
 * Rate-limited by middleware.ts (10/min per IP) and by the in-memory
 * OTP store's 5-attempts-per-code cap.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const code  = String(body?.code  || "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: "invalid_code_format" }, { status: 400 });
    }

    const ok = await verifyOtp(email, code);
    if (!ok) {
      // Deliberately generic — don't tell the caller whether the code
      // was wrong, expired, or over-attempted (all three would give
      // an attacker useful signal).
      return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 401 });
    }

    const token = await signGuestToken(email);
    return NextResponse.json({ ok: true, token, email });
  } catch (err) {
    console.error("[otp/verify] handler error", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

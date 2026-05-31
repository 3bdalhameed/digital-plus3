import { NextResponse } from "next/server";
import { createOtp, sendOtpEmail } from "@/lib/otp";

/**
 * POST /api/auth/otp/request
 * Body: { email: string }
 *
 * Generates a one-time 6-digit code, stores it in the in-memory OTP store
 * (10-min TTL), and emails it to the user. Rate-limited to 1 request per
 * email per 60 seconds.
 *
 * IMPORTANT: returns the same shape regardless of whether the email
 * exists in our DB or not. This prevents email-enumeration attacks
 * (where an attacker probes /api/auth/otp/request to find which emails
 * have accounts on the site).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();

    // Basic email shape check — don't bother sending if obviously invalid
    if (!email || !email.includes("@") || email.length > 320) {
      return NextResponse.json({ ok: true });
    }

    const { code, error } = await createOtp(email);

    if (error === "rate_limited") {
      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        { status: 429 }
      );
    }

    if (code) {
      // Fire-and-forget; we still respond ok even if the email fails to
      // send so attackers can't time-attack our email infra.
      sendOtpEmail(email, code).catch((err) =>
        console.error("[otp/request] sendOtpEmail failed", err)
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[otp/request] handler error", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

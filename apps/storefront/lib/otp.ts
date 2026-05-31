import { Resend } from "resend";

/**
 * One-time-password (OTP) helpers for passwordless email login.
 *
 * Storage: in-memory Map. Codes survive only while the Node process is
 * alive — fine for single-instance deploys (e.g. Coolify with one
 * container). If you scale to multiple instances or want OTPs to
 * survive a deploy, swap the `store` Map for Redis or a Prisma model.
 *
 * Security defaults:
 *   - 6-digit numeric code
 *   - 10 minute TTL
 *   - 5 wrong attempts before the code is destroyed
 *   - 60 second rate limit between requests per email
 *   - Codes hashed in memory (so even a heap dump doesn't expose them
 *     in plain text)
 */

const resend = new Resend(process.env.RESEND_API_KEY || "placeholder");

type OtpRecord = { codeHash: string; expiresAt: number; attempts: number };

const store = new Map<string, OtpRecord>();
const lastRequest = new Map<string, number>();

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_MS = 60 * 1000; // 1 minute between requests per email

/* ─── Lightweight hash without pulling in bcrypt for a 6-digit code ── */
async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(`${code}:${process.env.NEXTAUTH_SECRET ?? "salt"}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ─── Public API ─────────────────────────────────────────────────── */

export async function createOtp(
  email: string
): Promise<{ code?: string; error?: "rate_limited" }> {
  const normalized = email.trim().toLowerCase();
  const now = Date.now();
  const last = lastRequest.get(normalized);
  if (last && now - last < RATE_LIMIT_MS) {
    return { error: "rate_limited" };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await hashCode(code);
  store.set(normalized, { codeHash, expiresAt: now + CODE_TTL_MS, attempts: 0 });
  lastRequest.set(normalized, now);
  return { code };
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const rec = store.get(normalized);
  if (!rec) return false;
  if (Date.now() > rec.expiresAt) {
    store.delete(normalized);
    return false;
  }
  if (rec.attempts >= MAX_ATTEMPTS) {
    store.delete(normalized);
    return false;
  }
  rec.attempts += 1;
  const codeHash = await hashCode(code.trim());
  if (codeHash !== rec.codeHash) return false;
  // Single-use — destroy after success
  store.delete(normalized);
  return true;
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || "noreply@digital-plus3.com";
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"></head>
<body style="font-family: 'IBM Plex Sans Arabic', 'Cairo', Arial, sans-serif; background: #F3F0FF; padding: 40px 20px; direction: rtl;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(124,58,237,0.10);">
    <div style="background: linear-gradient(135deg, #7C3AED 0%, #6366F1 100%); padding: 28px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 22px; color: #fff; font-weight: 800;">رمز تسجيل الدخول</h1>
    </div>
    <div style="padding: 32px 28px; text-align: center;">
      <p style="margin: 0 0 16px; color: #475569; font-size: 14px; line-height: 1.6;">
        استخدم الرمز التالي لإكمال تسجيل الدخول. الرمز صالح لمدة 10 دقائق ولا يمكن استخدامه أكثر من مرة.
      </p>
      <div style="display: inline-block; padding: 16px 28px; background: #F5F3FF; border: 2px dashed #C4B5FD; border-radius: 14px; margin: 12px 0 20px;">
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #5B21B6; font-family: 'JetBrains Mono', monospace;">${code}</div>
      </div>
      <p style="margin: 0; color: #94A3B8; font-size: 12px; line-height: 1.6;">
        لم تطلب هذا الرمز؟ تجاهل هذه الرسالة. لن يتمكن أحد من الدخول إلى حسابك بدون هذا الرمز.
      </p>
    </div>
  </div>
</body>
</html>`.trim();

  try {
    await resend.emails.send({
      from,
      to: email,
      subject: `رمز تسجيل الدخول: ${code}`,
      html,
    });
  } catch (err) {
    console.error("[otp] failed to send email", err);
    throw err;
  }
}

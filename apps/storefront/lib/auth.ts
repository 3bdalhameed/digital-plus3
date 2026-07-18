import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { normalizeEmail } from "@/lib/normalize-email";

/**
 * Payload customer sync — every storefront user has a matching row in
 * Payload's customers collection so orders and support tickets can
 * link back. Called from the signIn callback after either provider
 * authenticates. Never blocks the login (returns null on failure).
 */
async function syncPayloadCustomer(rawEmail: string, rawName: string): Promise<string | null> {
  const email = normalizeEmail(rawEmail);
  if (!email) return null;
  const name = rawName?.trim() || email;
  try {
    const apiUrl = process.env.PAYLOAD_API_URL || "http://localhost:3001/api";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.PAYLOAD_INTERNAL_SECRET || "",
    };
    const existing = await fetch(
      `${apiUrl}/customers?where[email][equals]=${encodeURIComponent(email)}&limit=1`,
      { headers, cache: "no-store" },
    );
    const data = await existing.json();
    if (data?.docs?.[0]?.id) return String(data.docs[0].id);

    const created = await fetch(`${apiUrl}/customers`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, name }),
    });
    const j = await created.json();
    return j?.doc?.id != null ? String(j.doc.id) : null;
  } catch {
    return null;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,

  // ── Proxy / Cloudflare survival kit ─────────────────────────────
  // Everything below is set explicitly so Auth.js v5 doesn't try to
  // auto-detect anything based on the request headers. Cloudflare +
  // Coolify's Traefik proxy chain re-writes enough of the request
  // that the auto-detected values ended up mismatched and every
  // signin/signout POST failed with MissingCSRF.
  trustHost: true,
  useSecureCookies: true,
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
    csrfToken: {
      name: "authjs.csrf-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
    callbackUrl: {
      name: "authjs.callback-url",
      options: { sameSite: "lax", path: "/", secure: true },
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    // ── Passwordless OTP login ──────────────────────────────────────
    // Verifies the 6-digit code from /api/auth/otp/request. If the
    // user doesn't exist yet, auto-create a verified account -- they
    // just proved email ownership by receiving + entering the code.
    CredentialsProvider({
      id:   "otp",
      name: "otp",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        code:  { label: "رمز التحقق",       type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) return null;
        const email = normalizeEmail(String(credentials.email));
        if (!email) return null;

        const ok = await verifyOtp(email, String(credentials.code));
        if (!ok) return null;

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0],
              emailVerified: new Date(),
            },
          });
        } else if (!user.emailVerified) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        }
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      if (user.email && user.id) {
        const prismaUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (prismaUser && !prismaUser.payloadCustomerId) {
          const payloadId = await syncPayloadCustomer(user.email, user.name ?? "");
          if (payloadId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { payloadCustomerId: payloadId },
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        token.payloadCustomerId = dbUser?.payloadCustomerId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).payloadCustomerId = token.payloadCustomerId;
      }
      return session;
    },
  },
});

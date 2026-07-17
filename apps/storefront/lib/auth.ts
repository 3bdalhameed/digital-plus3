import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { normalizeEmail } from "@/lib/normalize-email";

async function syncPayloadCustomer(rawEmail: string, rawName: string): Promise<string | null> {
  // Every write to customers.email in this repo goes through the
  // canonical form so a session with mixed-case Google email can't
  // create a duplicate of the lowercased row later inserted by
  // getOrCreateCustomer at checkout.
  const email = normalizeEmail(rawEmail);
  if (!email) return null;
  const name = rawName?.trim() || email;
  try {
    const apiUrl = process.env.PAYLOAD_API_URL || "http://localhost:3001/api";
    const secret = process.env.PAYLOAD_INTERNAL_SECRET || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-internal-secret": secret,
    };

    const existing = await fetch(
      `${apiUrl}/customers?where[email][equals]=${encodeURIComponent(email)}&limit=1`,
      { headers, cache: "no-store" }
    );
    const existingData = await existing.json();
    if (existingData?.docs?.[0]?.id) return String(existingData.docs[0].id);

    const created = await fetch(`${apiUrl}/customers`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, name }),
    });
    const createdData = await created.json();
    return createdData?.doc?.id != null ? String(createdData.doc.id) : null;
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
  // Behind Cloudflare -> Coolify, TLS is terminated at the edge and the
  // container sees the forwarded request. Without trustHost, Auth.js v5
  // can't tell it's on HTTPS and sets/reads the CSRF cookie under
  // mismatched names, producing "MissingCSRF" on every sign-in.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        if (!user.emailVerified) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    /* ───── Passwordless OTP login ─────────────────────────────────
       Verifies the 6-digit code from /api/auth/otp/request, then
       either signs in the existing user OR creates a verified account
       on the fly (since possessing the OTP proves email ownership). */
    CredentialsProvider({
      id: "otp",
      name: "otp",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        code: { label: "رمز التحقق", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const ok = await verifyOtp(email, String(credentials.code));
        if (!ok) return null;

        // Find existing account, otherwise auto-create one (verified —
        // they proved email ownership via the OTP).
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
    async signIn({ user, account }) {
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

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function syncPayloadCustomer(email: string, name: string): Promise<string | null> {
  try {
    const apiUrl = process.env.PAYLOAD_API_URL || "http://localhost:3001/api";
    const existing = await fetch(
      `${apiUrl}/customers?where[email][equals]=${encodeURIComponent(email)}&limit=1`,
      { cache: "no-store" }
    );
    const existingData = await existing.json();
    if (existingData?.docs?.[0]?.id) return existingData.docs[0].id;

    const created = await fetch(`${apiUrl}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: name || email }),
    });
    const createdData = await created.json();
    return createdData?.doc?.id ?? null;
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
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const prismaUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (prismaUser && !prismaUser.payloadCustomerId) {
          const payloadId = await syncPayloadCustomer(user.email, user.name ?? "");
          if (payloadId) {
            await prisma.user.update({
              where: { id: prismaUser.id },
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

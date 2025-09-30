import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { randomBytes } from "crypto";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function getProviders(): NextAuthOptions["providers"] {
  const providers: NextAuthOptions["providers"] = [
    CredentialsProvider({
      name: "Email и пароль",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          throw new Error("Неверные учётные данные");
        }

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            roles: {
              include: { role: true },
            },
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Неверный email или пароль");
        }

        if (!user.emailVerified) {
          throw new Error("Email не подтверждён");
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          throw new Error("Неверный email или пароль");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ];

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
        },
      }),
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  secret: env.NEXTAUTH_SECRET ?? randomBytes(32).toString("hex"),
  pages: {
    signIn: "/auth/sign-in",
    verifyRequest: "/auth/verify-request",
  },
  providers: getProviders(),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id as string;
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: {
            roles: {
              include: { role: true },
            },
          },
        });

        if (dbUser) {
          token.roles = dbUser.roles.map(
            (userRole: { role: { name: string } }) => userRole.role.name,
          );
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.roles = (token.roles as string[]) ?? [];
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            roles: {
              create: {
                role: {
                  connect: { name: "user" },
                },
              },
            },
          },
        });
      } catch (error) {
        console.error("[auth] Не удалось назначить роль по умолчанию", error);
      }
    },
    async linkAccount({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
};

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { createVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { env } from "@/lib/env";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(120),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);

  if (!json) {
    return NextResponse.json({ message: "Некорректное тело запроса" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Проверьте корректность введённых данных", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;
  const name = parsed.data.name.trim();

  if (!validatePasswordStrength(password)) {
    return NextResponse.json(
      { message: "Пароль должен содержать минимум 8 символов" },
      { status: 422 },
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json({ message: "Пользователь с таким email уже существует" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      roles: {
        create: {
          role: {
            connect: { name: "user" },
          },
        },
      },
    },
  });

  const { token, hashedToken, expires } = createVerificationToken();

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedToken,
      expires,
    },
  });

  const baseUrl = env.NEXTAUTH_URL ?? new URL(request.url).origin;
  const verificationUrl = new URL(
    `/auth/verify?token=${token}&email=${encodeURIComponent(email)}`,
    baseUrl,
  ).toString();

  await sendVerificationEmail(user.email, verificationUrl);

  return NextResponse.json({ message: "Проверьте почту для подтверждения аккаунта" }, { status: 201 });
}

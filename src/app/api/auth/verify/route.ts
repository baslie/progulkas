import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/auth/sign-in?status=invalid-token", url.origin));
  }

  const hashed = hashToken(token);
  const storedToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: email.toLowerCase(),
      token: hashed,
    },
  });

  if (!storedToken || storedToken.expires < new Date()) {
    return NextResponse.redirect(new URL("/auth/sign-in?status=expired", url.origin));
  }

  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.deleteMany({
    where: { identifier: email.toLowerCase() },
  });

  return NextResponse.redirect(new URL("/auth/sign-in?status=verified", url.origin));
}

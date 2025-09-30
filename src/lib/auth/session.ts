import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    roles: Array.isArray(session.user.roles) ? session.user.roles : [],
  };
}

export function hasRole(user: SessionUser | null, role: string): boolean {
  if (!user) {
    return false;
  }

  return user.roles.includes(role) || (role === "author" && user.roles.includes("admin"));
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return user;
}

export async function requireAuthor(): Promise<SessionUser> {
  const user = await requireUser();

  if (!hasRole(user, "author")) {
    redirect("/");
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();

  if (!hasRole(user, "admin")) {
    redirect("/");
  }

  return user;
}

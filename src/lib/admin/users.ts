import { prisma } from "@/lib/prisma";

export type AuthorCandidate = {
  id: string;
  name: string | null;
  email: string;
  roles: string[];
};

const AUTHOR_ROLES = new Set(["author", "admin"]);

export async function getAuthorCandidates(): Promise<AuthorCandidate[]> {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  type UserWithRoles = (typeof users)[number];

  return users
    .map((user: UserWithRoles): AuthorCandidate => ({
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles.map(
        (assignment: UserWithRoles["roles"][number]): string => assignment.role.name,
      ),
    }))
    .filter((candidate: AuthorCandidate) => candidate.roles.some((role) => AUTHOR_ROLES.has(role)));
}

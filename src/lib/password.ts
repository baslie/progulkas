import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 12;

export function validatePasswordStrength(password: string) {
  return password.length >= 8;
}

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return compare(password, hashedPassword);
}

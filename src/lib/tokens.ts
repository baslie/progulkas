import crypto from "crypto";

export function createVerificationToken() {
  const token = crypto.randomUUID();
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  return {
    token,
    hashedToken,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
  };
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

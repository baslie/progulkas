export type RequestClientMetadata = {
  ipAddress: string | null;
  userAgent: string | null;
};

const UNKNOWN_TOKENS = new Set(["", "unknown", "null"]);
const MAX_TEXT_LENGTH = 500;

function normalizeText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || UNKNOWN_TOKENS.has(trimmed.toLowerCase())) {
    return null;
  }

  return trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed;
}

export function extractClientIp(forwardedFor: string | null, realIp: string | null): string | null {
  const candidates: string[] = [];

  if (forwardedFor) {
    for (const chunk of forwardedFor.split(",")) {
      const candidate = normalizeText(chunk);
      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  const normalizedRealIp = normalizeText(realIp);
  if (normalizedRealIp) {
    candidates.push(normalizedRealIp);
  }

  return candidates.length ? candidates[0] : null;
}

export function getRequestClientMetadata(request: Request): RequestClientMetadata {
  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const userAgent = normalizeText(headers.get("user-agent"));

  return {
    ipAddress: extractClientIp(forwardedFor, realIp),
    userAgent,
  };
}

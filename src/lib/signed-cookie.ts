import { createHmac, timingSafeEqual } from "crypto";

const encoder = new TextEncoder();

export interface SignedSession<T extends object> {
  payload: T;
  expiresAt: number;
}

function getCookieSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.COMMENT_AUTH_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "dev-only-cookie-secret"
  );
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getCookieSecret()).update(value).digest("base64url");
}

export function createSignedSession<T extends object>(
  payload: T,
  maxAgeSeconds: number
) {
  const session: SignedSession<T> = {
    payload,
    expiresAt: Date.now() + maxAgeSeconds * 1000,
  };
  const encoded = toBase64Url(JSON.stringify(session));
  return `${encoded}.${sign(encoded)}`;
}

export function verifySignedSession<T extends object>(
  value?: string
): T | null {
  if (!value) return null;

  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const signatureBytes = encoder.encode(signature);
  const expectedBytes = encoder.encode(expected);

  if (
    signatureBytes.length !== expectedBytes.length ||
    !timingSafeEqual(signatureBytes, expectedBytes)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(fromBase64Url(encoded)) as SignedSession<T>;
    if (!session.expiresAt || session.expiresAt < Date.now()) return null;
    return session.payload;
  } catch {
    return null;
  }
}

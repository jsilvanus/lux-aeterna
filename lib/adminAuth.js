import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "lux_admin_session";
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 12;

function getAdminPassword() {
  return String(process.env.ADMIN_PASSWORD ?? "").trim();
}

function getSessionSecret() {
  return String(process.env.ADMIN_SESSION_SECRET ?? "").trim();
}

export function adminSessionTtlSeconds() {
  const raw = Number(process.env.ADMIN_SESSION_TTL_SECONDS ?? DEFAULT_SESSION_TTL_SECONDS);
  if (!Number.isInteger(raw) || raw < 60 || raw > 60 * 60 * 24 * 30) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }
  return raw;
}

function toBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload) {
  const secret = getSessionSecret();
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function adminAuthConfigured() {
  return Boolean(getAdminPassword() && getSessionSecret());
}

export function verifyAdminPassword(candidate) {
  const expected = getAdminPassword();
  const provided = String(candidate ?? "");
  if (!expected) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export function createAdminSessionToken() {
  const payload = JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + adminSessionTtlSeconds(),
    role: "admin",
  });
  const encoded = toBase64Url(payload);
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function isAdminTokenValid(token) {
  if (!adminAuthConfigured() || typeof token !== "string") {
    return false;
  }

  const [encoded, providedSignature] = token.split(".");
  if (!encoded || !providedSignature) {
    return false;
  }

  const expectedSignature = signPayload(encoded);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encoded));
    return payload.role === "admin" && Number(payload.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function isAdminFromServerCookies() {
  const cookieStore = await cookies();
  return isAdminTokenValid(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

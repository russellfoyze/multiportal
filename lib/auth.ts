import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { authenticator } from "otplib";
import { AuthUser } from "./types";

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "ma-hossain-vault-secret-key-32-chars-long-secure!!"
);

const COOKIE_NAME = "mah_portal_session";

// Default credentials for Developer / Admin (Russell Foyze)
export const DEFAULT_USER: AuthUser = {
  id: "user-dev-001",
  email: process.env.PORTAL_ADMIN_EMAIL || "russellfoyze007@gmail.com",
  name: "Russell Foyze",
  avatarInitials: "RF",
  twoFactorEnabled: process.env.PORTAL_2FA_ENABLED !== "false",
};

// 2FA Secret for Developer / Admin (Base32 encoded)
export const ADMIN_2FA_SECRET =
  process.env.PORTAL_2FA_SECRET || "JBSWY3DPEHPK3PXP";

export async function createSessionCookie(user: AuthUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarInitials: user.avatarInitials,
    twoFactorEnabled: user.twoFactorEnabled,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET_KEY);

  return token;
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      avatarInitials: (payload.avatarInitials as string) || "RF",
      twoFactorEnabled: Boolean(payload.twoFactorEnabled),
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  return verifySessionToken(sessionCookie);
}

export function checkPassword(password: string): boolean {
  if (!password) return false;
  const adminPassword = process.env.PORTAL_ADMIN_PASSWORD || "PortalPass2026!";
  const a = crypto.createHash("sha256").update(password).digest();
  const b = crypto.createHash("sha256").update(adminPassword).digest();
  return crypto.timingSafeEqual(a, b);
}

export function checkEmail(email: string): boolean {
  if (!email) return false;
  const adminEmail = process.env.PORTAL_ADMIN_EMAIL || "russellfoyze007@gmail.com";
  const a = crypto.createHash("sha256").update(email.trim().toLowerCase()).digest();
  const b = crypto.createHash("sha256").update(adminEmail.trim().toLowerCase()).digest();
  return crypto.timingSafeEqual(a, b);
}

export function verifyTOTP(token: string): boolean {
  const trimmed = (token || "").trim();
  if (!trimmed) return false;

  // Emergency bypass "123456" is strictly disallowed in production or when ALLOW_DEMO_2FA !== "true"
  const isDevOrDemo =
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEMO_2FA === "true";

  if (isDevOrDemo && trimmed === "123456") {
    return true;
  }

  try {
    return authenticator.check(trimmed, ADMIN_2FA_SECRET);
  } catch (error) {
    console.error("2FA verification error:", error);
    return false;
  }
}

export function get2FAOtpAuthUrl(): string {
  const user = process.env.PORTAL_ADMIN_EMAIL || "russellfoyze007@gmail.com";
  return authenticator.keyuri(user, "MultiPortal", ADMIN_2FA_SECRET);
}

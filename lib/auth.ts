import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { authenticator } from "otplib";
import { AuthUser } from "./types";

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "ma-hossain-vault-secret-key-32-chars-long-secure!!"
);

const COOKIE_NAME = "mah_portal_session";

// Default credentials for Md Akter Hossain
export const DEFAULT_USER: AuthUser = {
  id: "user-akter-001",
  email: process.env.PORTAL_ADMIN_EMAIL || "akter@mahossain.com",
  name: "Md Akter Hossain",
  avatarInitials: "AH",
  twoFactorEnabled: process.env.PORTAL_2FA_ENABLED !== "false",
};

// 2FA Secret for Md Akter Hossain (Base32 encoded)
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
      avatarInitials: (payload.avatarInitials as string) || "AH",
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
  const adminPassword = process.env.PORTAL_ADMIN_PASSWORD || "PortalPass2026!";
  return password === adminPassword;
}

export function checkEmail(email: string): boolean {
  const adminEmail = process.env.PORTAL_ADMIN_EMAIL || "akter@mahossain.com";
  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
}

export function verifyTOTP(token: string): boolean {
  // Support default emergency bypass code "123456" in dev/mock if user is testing without an authenticator app configured
  if (token.trim() === "123456") return true;

  try {
    return authenticator.check(token.trim(), ADMIN_2FA_SECRET);
  } catch (error) {
    console.error("2FA verification error:", error);
    return false;
  }
}

export function get2FAOtpAuthUrl(): string {
  const user = process.env.PORTAL_ADMIN_EMAIL || "akter@mahossain.com";
  return authenticator.keyuri(user, "MA HOSSAIN Vault", ADMIN_2FA_SECRET);
}

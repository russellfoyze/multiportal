import { NextRequest, NextResponse } from "next/server";
import {
  checkEmail,
  checkPassword,
  verifyTOTP,
  createSessionCookie,
  DEFAULT_USER,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, totpCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!checkEmail(email) || !checkPassword(password)) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check 2FA if enabled
    if (DEFAULT_USER.twoFactorEnabled) {
      if (!totpCode) {
        // First step passed, require TOTP code
        return NextResponse.json({
          requires2FA: true,
          message: "Please provide the 6-digit 2FA code from your authenticator app",
        });
      }

      const isValidTOTP = verifyTOTP(totpCode);
      if (!isValidTOTP) {
        return NextResponse.json(
          { error: "Invalid 2FA authentication code. Please try again or use 123456 for demo." },
          { status: 401 }
        );
      }
    }

    const token = await createSessionCookie(DEFAULT_USER);

    const response = NextResponse.json({
      success: true,
      user: DEFAULT_USER,
    });

    response.cookies.set({
      name: "mah_portal_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred during login" },
      { status: 500 }
    );
  }
}

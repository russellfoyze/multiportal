import { NextRequest, NextResponse } from "next/server";
import {
  checkEmail,
  checkPassword,
  verifyTOTP,
  createSessionCookie,
  DEFAULT_USER,
} from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // 1. Resolve client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "127.0.0.1";

    const rateLimitKey = `login_${ip}`;

    const body = await request.json();
    const { email, password, totpCode } = body;

    // 2. Validate required inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 3. Check rate limit BEFORE validating credentials
    const rateCheck = checkRateLimit(rateLimitKey, {
      limit: 5,
      windowMs: 15 * 60 * 1000, // 15-minute lockout window
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: `Too many failed authentication attempts. Access locked for security. Try again in ${rateCheck.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateCheck.retryAfterSeconds.toString(),
          },
        }
      );
    }

    // 4. Timing-safe verification of email & password
    if (!checkEmail(email) || !checkPassword(password)) {
      return NextResponse.json(
        {
          error: "Invalid credentials. Access attempt logged.",
          remainingAttempts: rateCheck.remaining,
        },
        { status: 401 }
      );
    }

    // 5. Check 2FA if enabled
    if (DEFAULT_USER.twoFactorEnabled) {
      if (!totpCode) {
        // Primary authentication succeeded; advance to step 2 (TOTP verification)
        return NextResponse.json({
          requires2FA: true,
          message: "Please provide the 6-digit verification code from your authenticator app",
        });
      }

      const isValidTOTP = verifyTOTP(totpCode);
      if (!isValidTOTP) {
        return NextResponse.json(
          {
            error: "Invalid 2FA authentication code. Please check your authenticator app and try again.",
            remainingAttempts: rateCheck.remaining,
          },
          { status: 401 }
        );
      }
    }

    // 6. Reset rate limit counter upon successful full authentication
    resetRateLimit(rateLimitKey);

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

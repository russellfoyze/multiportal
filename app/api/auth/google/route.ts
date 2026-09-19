import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set in .env.local. Please configure Google OAuth credentials.",
      },
      { status: 400 }
    );
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // Generate cryptographic state parameter to prevent OAuth CSRF / state injection
  const state = crypto.randomBytes(32).toString("hex");

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account consent",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/drive",
    ],
    state,
  });

  const response = NextResponse.redirect(authUrl, 302);

  // Set short-lived HttpOnly cookie containing state
  response.cookies.set({
    name: "mah_oauth_state",
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}

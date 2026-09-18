import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set in .env.local. Please create an OAuth 2.0 Client ID in Google Cloud Console.",
      },
      { status: 400 }
    );
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive"],
  });

  return NextResponse.redirect(authUrl, 302);
}

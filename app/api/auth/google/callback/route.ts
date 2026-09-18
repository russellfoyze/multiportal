import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(new URL("/?error=missing_code", request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/?error=missing_oauth_keys", request.url));
    }

    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.refresh_token) {
      // Update .env.local automatically
      const envPath = path.join(process.cwd(), ".env.local");
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

      if (envContent.includes("GOOGLE_REFRESH_TOKEN=")) {
        envContent = envContent.replace(
          /GOOGLE_REFRESH_TOKEN=.*/,
          `GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`
        );
      } else {
        envContent += `\nGOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"\n`;
      }

      fs.writeFileSync(envPath, envContent, "utf-8");
      process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
    }

    return NextResponse.redirect(new URL("/?connected=google_oauth", request.url));
  } catch (error: any) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, request.url));
  }
}

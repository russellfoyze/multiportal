import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createSessionCookie } from "@/lib/auth";
import { AuthUser } from "@/lib/types";
import { resetCachedDriveClient, updateEnvFile, getOrCreateVaultFolder } from "@/lib/googleDrive";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    // 1. Anti-CSRF OAuth state verification
    const stateParam = request.nextUrl.searchParams.get("state");
    const cookieState = request.cookies.get("mah_oauth_state")?.value;

    if (!stateParam || !cookieState) {
      return NextResponse.redirect(new URL("/login?error=missing_oauth_state", request.url));
    }

    const stateBuf = Buffer.from(stateParam);
    const cookieBuf = Buffer.from(cookieState);

    if (
      stateBuf.length !== cookieBuf.length ||
      !crypto.timingSafeEqual(stateBuf, cookieBuf)
    ) {
      return NextResponse.redirect(new URL("/login?error=invalid_oauth_state_csrf", request.url));
    }

    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/login?error=missing_oauth_keys", request.url));
    }

    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    // 2. Fetch authenticated Google User identity
    let userEmail = "";
    let userName = "";
    let googleId = "";

    // A. Verify ID Token if present
    if (tokens.id_token) {
      try {
        const ticket = await oauth2Client.verifyIdToken({
          idToken: tokens.id_token,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        if (payload) {
          userEmail = payload.email || "";
          userName = payload.name || "";
          googleId = payload.sub || "";
        }
      } catch (e) {
        console.warn("Could not verify ID token:", e);
      }
    }

    // B. Fetch drive about user info
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    if (!userEmail) {
      try {
        const about = await drive.about.get({ fields: "user" });
        userEmail = about.data.user?.emailAddress || "";
        userName = userName || about.data.user?.displayName || "";
        googleId = googleId || about.data.user?.permissionId || "";
      } catch (e) {
        console.warn("Could not fetch user profile info:", e);
      }
    }

    if (!userEmail) {
      userEmail = "user@gmail.com";
    }
    if (!userName) {
      userName = userEmail.split("@")[0];
    }

    // 3. Automatically locate or create the "MA HOSSAIN Vault" folder in this Google account
    let folderId = "";
    try {
      folderId = await getOrCreateVaultFolder(drive);
    } catch (e) {
      console.error("Could not setup vault folder during OAuth callback:", e);
    }

    // 4. Update environment variables for this Google Drive user
    const updates: Record<string, string> = {};
    if (tokens.refresh_token) {
      updates.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
    }
    if (folderId) {
      updates.GOOGLE_DRIVE_FOLDER_ID = folderId;
    }
    if (userEmail) {
      updates.GOOGLE_DRIVE_USER_EMAIL = userEmail;
    }

    if (Object.keys(updates).length > 0) {
      updateEnvFile(updates);
      resetCachedDriveClient();
    }

    // 5. Create authenticated portal session for this Gmail user
    const initials = userName
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "GU";

    const authUser: AuthUser = {
      id: `google-${googleId || Date.now()}`,
      email: userEmail,
      name: userName,
      avatarInitials: initials,
      twoFactorEnabled: true,
    };

    const sessionToken = await createSessionCookie(authUser);

    // 6. Redirect to dashboard with session cookie
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("connected", "google_oauth");
    if (userEmail) {
      redirectUrl.searchParams.set("drive_user", userEmail);
    }

    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set({
      name: "mah_portal_session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Clear the anti-CSRF state cookie after successful verification
    response.cookies.delete("mah_oauth_state");

    return response;
  } catch (error: any) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message || "Failed to sign in with Google")}`, request.url)
    );
  }
}

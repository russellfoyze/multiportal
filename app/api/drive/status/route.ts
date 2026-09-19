import { NextResponse } from "next/server";
import { getDriveConfigStatus } from "@/lib/googleDrive";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = getDriveConfigStatus();

  // Mask sensitive folder ID in status response to prevent unnecessary full disclosure
  const maskedFolderId = status.folderId
    ? `${status.folderId.slice(0, 4)}••••••••${status.folderId.slice(-4)}`
    : undefined;

  return NextResponse.json({
    ...status,
    folderId: maskedFolderId,
  });
}

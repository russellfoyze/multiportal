import { NextResponse } from "next/server";
import { getDriveConfigStatus } from "@/lib/googleDrive";

export async function GET() {
  const status = getDriveConfigStatus();
  return NextResponse.json(status);
}

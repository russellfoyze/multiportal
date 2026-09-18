import { NextRequest, NextResponse } from "next/server";
import { getDriveFileMedia, isValidFileId } from "@/lib/googleDrive";
import { getCurrentUser } from "@/lib/auth";
import { Readable } from "stream";
import {
  sanitizeAndFixFileName,
  detectMimeType,
  buildContentDisposition,
} from "@/lib/formatUtils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const fileId = params.id;
    if (!isValidFileId(fileId)) {
      return new NextResponse("Invalid file identifier format", { status: 400 });
    }

    const { stream, mimeType, name, size } = await getDriveFileMedia(fileId);

    // Ensure clean filename with the correct format extension
    const cleanFileName = sanitizeAndFixFileName(name, undefined, mimeType);
    const effectiveMime = detectMimeType(cleanFileName, mimeType);

    const webStream = Readable.toWeb(stream);

    const headers = new Headers();
    headers.set("Content-Type", effectiveMime);
    headers.set(
      "Content-Disposition",
      buildContentDisposition(cleanFileName, "attachment")
    );
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    if (size) {
      headers.set("Content-Length", size.toString());
    }

    return new Response(webStream as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    const msg = error?.message || "Failed to download file";
    if (msg.includes("not found") || msg.includes("access denied")) {
      return new NextResponse("File not found or access denied", { status: 404 });
    }
    if (msg.includes("Invalid file identifier")) {
      return new NextResponse("Invalid file identifier", { status: 400 });
    }
    console.error("API /api/drive/download error:", error);
    return new NextResponse("An error occurred while retrieving the file", {
      status: 500,
    });
  }
}
